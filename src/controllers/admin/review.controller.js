const reviewService = require("../../services/review.service");
const { sendSuccess, sendError } = require("../../utils/apiResponse");

/**
 * GET /api/v1/admin/reviews
 * List all reviews with advanced filtering for admin.
 */
const listAllReviews = async (req, res, next) => {
  try {
    const { reviews, meta } = await reviewService.listAllReviews(req.query);

    return sendSuccess(res, {
      message: "Reviews retrieved successfully",
      data: reviews,
      meta,
    });
  } catch (error) {
    console.error("List all reviews error:", error);
    next(error);
  }
};

/**
 * PATCH /api/v1/admin/reviews/:id
 * Update publication status of a single review.
 */
const updateReviewStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { is_published } = req.body;
    const review = await reviewService.updateReviewStatus(id, is_published, req.user);

    return sendSuccess(res, {
      message: `Review ${is_published ? "published" : "unpublished"} successfully`,
      data: review,
    });
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, {
        statusCode: error.statusCode,
        message: error.message,
      });
    }
    console.error("Update review status error:", error);
    next(error);
  }
};

/**
 * PATCH /api/v1/admin/reviews/bulk-publish
 * Bulk update publication status of multiple reviews.
 */
const bulkUpdateReviewStatus = async (req, res, next) => {
  try {
    const { review_ids, is_published } = req.body;
    const result = await reviewService.bulkUpdateReviewStatus(review_ids, is_published, req.user);

    return sendSuccess(res, {
      message: `Bulk ${is_published ? "publish" : "unpublish"} successful`,
      data: result,
    });
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, {
        statusCode: error.statusCode,
        message: error.message,
      });
    }
    console.error("Bulk update review status error:", error);
    next(error);
  }
};

module.exports = {
  listAllReviews,
  updateReviewStatus,
  bulkUpdateReviewStatus,
};
