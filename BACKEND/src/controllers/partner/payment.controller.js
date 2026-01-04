const partnerPaymentService = require("../../services/partner/payment.service");
const { sendSuccess, sendError } = require("../../utils/apiResponse");

const listPayments = async (req, res, next) => {
  try {
    const result = await partnerPaymentService.listPayments(req.query, req.user);

    return sendSuccess(res, {
      message: "Payments retrieved successfully",
      data: result.payments,
      meta: result.meta,
    });
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, {
        statusCode: error.statusCode,
        message: error.message,
      });
    }
    console.error("Partner list payments error:", error);
    next(error);
  }
};

module.exports = {
  listPayments,
};
