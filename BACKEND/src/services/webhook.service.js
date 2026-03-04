const { Payment, Booking, Hotel, sequelize } = require("../models");
const { Op } = require("sequelize");
const { getPayOSClient } = require("../config/payos");
const walletService = require("./wallet.service");

class WebhookService {
  /**
   * Handle payment notification from gateways.
   *
   * @param {string} gateway - vnpay|momo|stripe
   * @param {Object} body - Webhook payload
   * @returns {Promise<Object>} Process result
   */
  async handleWebhook(gateway, body) {
    const { transaction_id, booking_id, payment_id, status, amount } = body;

    // 1. Idempotency check
    if (transaction_id) {
      const existingPaymentByTx = await Payment.findOne({
        where: { transaction_id, gateway },
      });
      // If we already have a payment with this transaction_id that is NOT pending, skip
      if (existingPaymentByTx && existingPaymentByTx.status !== "pending") {
        return { message: "Already processed" };
      }
    }

    const payment = await Payment.findByPk(payment_id);
    if (!payment) {
      return {
        message: "PayOS payment not found; webhook ignored",
        status: "ignored",
      };
    }

    // If payment already marked as success/failed, skip
    if (payment.status !== "pending") {
      return { message: "Payment status already updated" };
    }

    // 2. Transactional update
    const transaction = await sequelize.transaction();
    try {
      // Update payment record
      await payment.update(
        {
          status, // 'success' or 'failed'
          transaction_id,
          paid_at: status === "success" ? new Date() : null,
          note: body.note || `Processed via ${gateway} webhook`,
        },
        { transaction }
      );

      // 3. Update booking status if payment is successful
      if (status === "success") {
        const booking = await Booking.findByPk(booking_id, { transaction });
        if (booking) {
          if (booking.status === "cancelled") {
            console.warn(`[Webhook] Booking ${booking_id} was already cancelled before payment success. Keeping as cancelled.`);
            // In a real system, this would trigger an automatic refund or manual intervention
          } else {
            await booking.update({ status: "confirmed" }, { transaction });
          }
        }
      }

      await transaction.commit();
      return { message: "Payment processed successfully", status };
    } catch (error) {
      await transaction.rollback();
      console.error("[Webhook Error]", error);
      throw error;
    }
  }

  async handlePayOSWebhook(body) {
    const payos = getPayOSClient();
    const verifiedPayload = await payos.webhooks.verify(body);
    const webhookData = verifiedPayload?.data || verifiedPayload;
    const webhookSuccess =
      body.success ?? verifiedPayload?.success ?? webhookData?.code === "00";

    if (!webhookSuccess || webhookData.code !== "00") {
      return {
        message: "PayOS webhook ignored",
        status: "ignored",
      };
    }

    const orderCode = webhookData.orderCode;
    const paymentLinkId = webhookData.paymentLinkId;
    const lookupConditions = [];

    if (orderCode !== undefined && orderCode !== null) {
      lookupConditions.push({ payos_order_code: orderCode });
    }

    if (paymentLinkId) {
      lookupConditions.push({ payos_payment_link_id: paymentLinkId });
    }

    if (lookupConditions.length === 0) {
      return {
        message: "PayOS webhook missing payment identifiers; ignored",
        status: "ignored",
      };
    }

    const payment = await Payment.findOne({
      where: {
        gateway: "payos",
        [Op.or]: lookupConditions,
      },
      include: [
        {
          model: Booking,
          include: [{ model: Hotel, attributes: ["id", "owner_id"] }],
        },
      ],
    });

    if (!payment) {
      const error = new Error("Payment not found");
      error.statusCode = 404;
      throw error;
    }

    if (payment.status !== "pending") {
      return {
        message: "PayOS payment already processed",
        status: payment.status,
      };
    }

    const expectedAmount = Math.round(parseFloat(payment.amount));
    const paidAmount = Number(webhookData.amount);

    if (expectedAmount !== paidAmount) {
      const error = new Error("PayOS amount does not match payment amount");
      error.statusCode = 400;
      throw error;
    }

    const transaction = await sequelize.transaction();
    try {
      const lockedPayment = await Payment.findByPk(payment.id, {
        include: [
          {
            model: Booking,
            include: [{ model: Hotel, attributes: ["id", "owner_id"] }],
          },
        ],
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (lockedPayment.status !== "pending") {
        await transaction.commit();
        return {
          message: "PayOS payment already processed",
          status: lockedPayment.status,
        };
      }

      const paidAt = this._parsePayOSDate(webhookData.transactionDateTime);

      await lockedPayment.update(
        {
          status: "success",
          transaction_id: webhookData.reference || paymentLinkId,
          payos_payment_link_id:
            lockedPayment.payos_payment_link_id || paymentLinkId,
          paid_at: paidAt,
          note: `Processed via PayOS webhook: ${webhookData.desc || "success"}`,
        },
        { transaction },
      );

      const booking = lockedPayment.Booking;
      if (booking) {
        if (booking.status === "pending") {
          await booking.update({ status: "confirmed" }, { transaction });
        }

        if (
          !["cancelled", "cancellation_pending", "no_show"].includes(
            booking.status,
          )
        ) {
          await walletService.creditPartnerPendingForPayment(
            lockedPayment,
            booking,
            transaction,
          );
        }
      }

      await transaction.commit();
      return {
        message: "PayOS payment processed successfully",
        status: "success",
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  _parsePayOSDate(value) {
    if (!value) {
      return new Date();
    }

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  }
}

module.exports = new WebhookService();
