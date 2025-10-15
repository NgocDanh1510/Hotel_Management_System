const paymentService = require("../services/payment.service");
const { sendSuccess, sendError } = require("../utils/apiResponse");

/**
 * POST /api/v1/payments
 * Initiate a payment session for a booking.
 */
const createPayment = async (req, res, next) => {
  try {
    const userId = req.user.user_id;
    const result = await paymentService.createPayment(req.body, userId);

    return sendSuccess(res, {
      statusCode: 201,
      message: "Payment session initiated successfully",
      data: result,
    });
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, {
        statusCode: error.statusCode,
        message: error.message,
      });
    }
    console.error("Create payment error:", error);
    next(error);
  }
};

module.exports = {
  createPayment,
};
