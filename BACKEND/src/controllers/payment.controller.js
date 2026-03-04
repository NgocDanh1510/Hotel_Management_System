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

/**
 * GET /api/v1/payments/:id
 * Get payment detail.
 */
const getPaymentDetail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const payment = await paymentService.getPaymentDetail(id, req.user);

    return sendSuccess(res, {
      message: "Payment detail retrieved successfully",
      data: payment,
    });
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, {
        statusCode: error.statusCode,
        message: error.message,
      });
    }
    console.error("Get payment detail error:", error);
    next(error);
  }
};

/**
 * GET /api/v1/payments/:id/status
 * Get payment status for frontend polling.
 */
const getPaymentStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const status = await paymentService.getPaymentStatus(id, req.user);

    return sendSuccess(res, {
      message: "Payment status retrieved successfully",
      data: status,
    });
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, {
        statusCode: error.statusCode,
        message: error.message,
      });
    }
    console.error("Get payment status error:", error);
    next(error);
  }
};

/**
 * POST /api/v1/payments/:id/mock-complete
 * Complete a pending payment in demo mode.
 */
const mockCompletePayment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.user_id;

    const result = await paymentService.mockCompletePayment(id, userId);

    return sendSuccess(res, {
      message: "Payment completed successfully",
      data: result,
    });
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, {
        statusCode: error.statusCode,
        message: error.message,
      });
    }
    console.error("Mock complete payment error:", error);
    next(error);
  }
};

module.exports = {
  createPayment,
  getPaymentDetail,
  getPaymentStatus,
  mockCompletePayment,
};
