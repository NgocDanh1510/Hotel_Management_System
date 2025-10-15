const { Payment, Booking, sequelize } = require("../models");

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
      const error = new Error("Payment not found");
      error.statusCode = 404;
      throw error;
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
}

module.exports = new WebhookService();
