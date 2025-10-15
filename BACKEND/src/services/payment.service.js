const { Payment, Booking, sequelize } = require("../models");
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
}

module.exports = new PaymentService();
