const { Payment, Booking, Hotel, User, sequelize } = require("../models");
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
  async listAllPayments(query, user = {}) {
    const {
      status,
      type,
      gateway,
      booking_id,
      bookingId,
      hotel_id,
      hotelId,
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
    const hotelWhere = {};
    const bookingWhere = {};

    const userPermissions = user.permissions || [];
    const canReadAll = userPermissions.includes("payment.read_all");
    const canReadOwnHotel = userPermissions.includes("payment.read_own_hotel");

    if (!canReadAll && canReadOwnHotel) {
      hotelWhere.owner_id = user.user_id;
    } else if (!canReadAll && !canReadOwnHotel) {
      const error = new Error("Insufficient permissions");
      error.statusCode = 403;
      throw error;
    }
    if (status) where.status = status;
    if (type) where.type = type;
    if (gateway) where.gateway = gateway;
    if (booking_id || bookingId) where.booking_id = booking_id || bookingId;
    if (hotel_id || hotelId) bookingWhere.hotel_id = hotel_id || hotelId;

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

    const bookingInclude = {
      model: Booking,
      attributes: ["id", "hotel_id", "user_id"],
      where: bookingWhere,
      include: [
        {
          model: Hotel,
          attributes: ["id", "owner_id"],
        },
      ],
    };

    if (Object.keys(hotelWhere).length > 0) {
      bookingInclude.required = true;
      bookingInclude.include[0].where = hotelWhere;
      bookingInclude.include[0].required = true;
    } else if (Object.keys(bookingWhere).length > 0) {
      bookingInclude.required = true;
    }

    const include = [
      { model: User, attributes: ["id", "name", "email"] },
      bookingInclude,
    ];

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

  /**
   * Get payment details by ID
   * @param {string} paymentId
   * @param {string} userId
   * @returns {Promise<Object>}
   */
  async getPaymentDetail(paymentId, user) {
    const payment = await Payment.findByPk(paymentId, {
      include: [
        {
          model: Booking,
          attributes: ["id", "user_id", "hotel_id"],
          include: [{ model: Hotel, attributes: ["id", "owner_id"] }],
        },
      ]
    });

    if (!payment) {
      const error = new Error("Payment not found");
      error.statusCode = 404;
      throw error;
    }

    const perms = user.permissions || [];
    const canReadAll = perms.includes("payment.read_all");
    const canReadOwnHotel = perms.includes("payment.read_own_hotel");
    const isPaymentOwner = payment.user_id === user.user_id;
    const isBookingOwner = payment.Booking?.user_id === user.user_id;
    const isHotelOwner = payment.Booking?.Hotel?.owner_id === user.user_id;

    if (
      !canReadAll &&
      !isPaymentOwner &&
      !isBookingOwner &&
      !(canReadOwnHotel && isHotelOwner)
    ) {
      const error = new Error("You do not have permission to view this payment");
      error.statusCode = 403;
      throw error;
    }

    return payment;
  }

  /**
   * Complete a pending payment for demo/testing flows.
   * @param {string} paymentId
   * @param {string} userId
   * @returns {Promise<Object>}
   */
  async mockCompletePayment(paymentId, userId) {
    const payment = await Payment.findByPk(paymentId, {
      include: [{ model: Booking }],
    });

    if (!payment) {
      const error = new Error("Payment not found");
      error.statusCode = 404;
      throw error;
    }

    if (payment.user_id !== userId && payment.Booking?.user_id !== userId) {
      const error = new Error("You do not have permission to complete this payment");
      error.statusCode = 403;
      throw error;
    }

    if (payment.status !== "pending") {
      const error = new Error("Only pending payments can be completed");
      error.statusCode = 400;
      throw error;
    }

    const transaction = await sequelize.transaction();

    try {
      const transactionId = `MOCK_${Date.now()}`;

      await payment.update(
        {
          status: "success",
          transaction_id: transactionId,
          paid_at: new Date(),
          note: "Completed from customer frontend demo flow",
        },
        { transaction },
      );

      if (payment.Booking && payment.Booking.status === "pending") {
        await payment.Booking.update({ status: "confirmed" }, { transaction });
      }

      await transaction.commit();

      return {
        id: payment.id,
        booking_id: payment.booking_id,
        status: "success",
        transaction_id: transactionId,
        paid_at: payment.paid_at,
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * List payments for the authenticated user
   * @param {string} userId
   * @returns {Promise<Object>}
   */
  async listMyPayments(userId) {
    const payments = await Payment.findAll({
      where: { user_id: userId },
      order: [["created_at", "DESC"]],
      include: [
        { model: Booking, attributes: ["id", "status", "total_price"] }
      ]
    });

    return { payments };
  }
}

module.exports = new PaymentService();
