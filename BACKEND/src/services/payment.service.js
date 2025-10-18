const { Payment, Booking, User, sequelize } = require("../models");
const { Op } = require("sequelize");

class PaymentService {
  /**
   * Initiate a payment for a booking.
   *
   * @param {Object} data - { booking_id, amount, gateway }
   * @param {string} userId - ID of the user
   * @returns {Promise<Object>} Payment simulation info
   */
  async createPayment(data, userId) {
    const { booking_id, amount, gateway } = data;

    const booking = await Booking.findByPk(booking_id);

    // 1. Validation
    if (!booking) {
      const error = new Error("Booking not found");
      error.statusCode = 404;
      throw error;
    }

    if (booking.user_id !== userId) {
      const error = new Error("You do not have permission to pay for this booking");
      error.statusCode = 403;
      throw error;
    }

    if (booking.status !== "pending") {
      const error = new Error(`Cannot pay for booking with status '${booking.status}'. Only pending bookings can be paid.`);
      error.statusCode = 400;
      throw error;
    }

    if (parseFloat(booking.total_price) !== parseFloat(amount)) {
      const error = new Error(`Payment amount (${amount}) does not match booking total price (${booking.total_price})`);
      error.statusCode = 400;
      throw error;
    }

    // 2. Check for existing successful payment
    const successPayment = await Payment.findOne({
      where: {
        booking_id,
        status: "success",
      },
    });

    if (successPayment) {
      const error = new Error("This booking has already been paid successfully");
      error.statusCode = 409;
      throw error;
    }

    // 3. Create pending payment record
    const payment = await Payment.create({
      booking_id,
      user_id: userId,
      amount,
      gateway,
      status: "pending",
      type: "full_payment",
    });

    // 4. Mock payment gateway simulation
    // In a real app, this would involve calling VNPAY/MoMo/Stripe APIs to get a redirect URL
    const paymentUrl = `https://mock-gateway.com/${gateway}/pay?id=${payment.id}&amount=${amount}&callback=http://localhost:3000/api/v1/webhooks/payment/${gateway}`;

    return {
      payment_id: payment.id,
      payment_url: paymentUrl,
      expires_in: 900, // 15 minutes
    };
  }

  /**
   * List all payments with advanced filtering for admin.
   *
   * @param {Object} query - Filter, sort, pagination
   * @returns {Promise<Object>} Payments list + meta
   */
  async listAllPayments(query) {
    const {
      status,
      type,
      gateway,
      booking_id,
      paid_at_from,
      paid_at_to,
      amount_min,
      amount_max,
      q,
      sort = "paid_at_desc",
      offset = 0,
      limit = 20,
    } = query;

    const offsetNum = Math.max(0, parseInt(offset) || 0);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 20));

    const where = {};
    if (status) where.status = status;
    if (type) where.type = type;
    if (gateway) where.gateway = gateway;
    if (booking_id) where.booking_id = booking_id;

    if (paid_at_from || paid_at_to) {
      where.paid_at = {};
      if (paid_at_from) where.paid_at[Op.gte] = new Date(paid_at_from);
      if (paid_at_to) where.paid_at[Op.lte] = new Date(paid_at_to);
    }

    if (amount_min !== undefined || amount_max !== undefined) {
      where.amount = {};
      if (amount_min !== undefined) where.amount[Op.gte] = amount_min;
      if (amount_max !== undefined) where.amount[Op.lte] = amount_max;
    }

    const include = [{ model: User, attributes: ["id", "name", "email"] }];

    if (q) {
      where[Op.or] = [
        { transaction_id: { [Op.like]: `%${q}%` } },
        { "$User.email$": { [Op.like]: `%${q}%` } },
      ];
    }

    let order = [];
    switch (sort) {
      case "paid_at": order = [["paid_at", "ASC"]]; break;
      case "paid_at_desc": order = [["paid_at", "DESC"]]; break;
      case "amount": order = [["amount", "ASC"]]; break;
      case "amount_desc": order = [["amount", "DESC"]]; break;
      case "created_at": order = [["created_at", "ASC"]]; break;
      case "created_at_desc": order = [["created_at", "DESC"]]; break;
      default: order = [["paid_at", "DESC"]]; break;
    }

    const { count, rows } = await Payment.findAndCountAll({
      where,
      include,
      order,
      limit: limitNum,
      offset: offsetNum,
      distinct: true,
      subQuery: false,
    });

    return {
      payments: rows,
      meta: {
        total: count,
        offset: offsetNum,
        limit: limitNum,
        has_next: offsetNum + limitNum < count,
      },
    };
  }

  /**
   * Process a refund for a payment.
   *
   * @param {string} paymentId - Original payment ID
   * @param {Object} data - { amount, reason }
   * @param {Object} adminUser - Admin user performing the refund
   * @returns {Promise<Object>} Refund details
   */
  async refundPayment(paymentId, data, adminUser) {
    const { amount, reason } = data;

    const originalPayment = await Payment.findByPk(paymentId, {
      include: [Booking],
    });

    if (!originalPayment) {
      const error = new Error("Payment not found");
      error.statusCode = 404;
      throw error;
    }

    if (originalPayment.status !== "success") {
      const error = new Error(`Cannot refund payment with status '${originalPayment.status}'. Only successful payments can be refunded.`);
      error.statusCode = 400;
      throw error;
    }

    // Check refund amount
    const originalAmount = parseFloat(originalPayment.amount);
    const refundAmount = parseFloat(amount);

    if (refundAmount > originalAmount) {
      const error = new Error(`Refund amount (${refundAmount}) cannot exceed original payment amount (${originalAmount})`);
      error.statusCode = 400;
      throw error;
    }

    // Check sum of existing refunds
    const existingRefunds = await Payment.findAll({
      where: {
        booking_id: originalPayment.booking_id,
        type: "refund",
        status: "success",
      },
      attributes: [[sequelize.fn("SUM", sequelize.col("amount")), "total_refunded"]],
      raw: true,
    });

    const totalRefunded = parseFloat(existingRefunds[0].total_refunded) || 0;
    if (totalRefunded + refundAmount > originalAmount) {
      const error = new Error(`Total refunds (${totalRefunded + refundAmount}) would exceed original payment amount (${originalAmount})`);
      error.statusCode = 400;
      throw error;
    }

    const transaction = await sequelize.transaction();
    try {
      // 1. Mock Gateway Refund Call
      const gatewayResponse = { success: true, transaction_id: `REFUND_${Date.now()}` };

      // 2. Create Refund Record
      const refund = await Payment.create({
        booking_id: originalPayment.booking_id,
        user_id: originalPayment.user_id,
        amount: refundAmount,
        gateway: originalPayment.gateway,
        status: gatewayResponse.success ? "success" : "failed",
        type: "refund",
        transaction_id: gatewayResponse.transaction_id,
        paid_at: new Date(),
        note: `Refund for payment ${paymentId}. Reason: ${reason}`,
      }, { transaction });

      // 3. Update Booking Status if full refund
      if (totalRefunded + refundAmount >= originalAmount) {
        const booking = await Booking.findByPk(originalPayment.booking_id, { transaction });
        if (booking) {
          await booking.update({ status: "cancelled" }, { transaction });
        }
      }

      await transaction.commit();
      return refund;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}

module.exports = new PaymentService();
