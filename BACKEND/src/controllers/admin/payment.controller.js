const paymentService = require("../../services/payment.service");
const { sendSuccess, sendError } = require("../../utils/apiResponse");

/**
 * GET /api/v1/admin/payments
 */
const listAllPayments = async (req, res, next) => {
  try {
    const result = await paymentService.listAllPayments(req.query);
    return sendSuccess(res, {
      message: "Payments retrieved successfully",
      data: result.payments,
      meta: result.meta,
    });
  } catch (error) {
    console.error("List admin payments error:", error);
    next(error);
  }
};

/**
 * POST /api/v1/admin/payments/:id/refund
 */
const refundPayment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const refund = await paymentService.refundPayment(id, req.body, req.user);
    return sendSuccess(res, {
      statusCode: 201,
      message: "Refund processed successfully",
      data: { refund },
    });
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, { statusCode: error.statusCode, message: error.message });
    }
    console.error("Refund payment error:", error);
    next(error);
  }
};

module.exports = {
  listAllPayments,
  refundPayment,
};
