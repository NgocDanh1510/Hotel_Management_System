const partnerReviewService = require("../../services/partner/review.service");
const { sendSuccess, sendError } = require("../../utils/apiResponse");

const listReviews = async (req, res, next) => {
  try {
    const { reviews, meta } = await partnerReviewService.listReviews(
      req.query,
      req.user,
    );

    return sendSuccess(res, {
      message: "Reviews retrieved successfully",
      data: reviews,
      meta,
    });
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, {
        statusCode: error.statusCode,
        message: error.message,
      });
    }
    console.error("Partner list reviews error:", error);
    next(error);
  }
};

module.exports = {
  listReviews,
};
