const reviewService = require("../services/review.service");
const { sendSuccess, sendError } = require("../utils/apiResponse");

/**
 * POST /api/v1/reviews
 * Create a review for a checked_out booking.
 */
const createReview = async (req, res, next) => {
  try {
    const userId = req.user.user_id;
    const review = await reviewService.createReview(req.body, userId);

    return sendSuccess(res, {
      statusCode: 201,
      message: "Review submitted successfully. It will be visible after approval.",
      data: review,
    });
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, {
        statusCode: error.statusCode,
        message: error.message,
      });
    }
    console.error("Create review error:", error);
    next(error);
  }
};

/**
 * GET /api/v1/hotels/:hotelId/reviews
 * Get published reviews for a specific hotel.
 */
const getHotelReviews = async (req, res, next) => {
  try {
    const { hotelId } = req.params;
    const { reviews, meta } = await reviewService.getHotelReviews(hotelId, req.query);

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
    console.error("Get hotel reviews error:", error);
    next(error);
  }
};

module.exports = {
  createReview,
  getHotelReviews,
};
