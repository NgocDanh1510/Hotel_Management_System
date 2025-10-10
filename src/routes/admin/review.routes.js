const express = require("express");
const router = express.Router();
const reviewController = require("../../controllers/admin/review.controller");
const {
  authenticateToken,
  requirePermission,
} = require("../../middlewares/auth.middleware");
const { validateSchema, validateQuery } = require("../../middlewares/validate.middleware");
const {
  listAdminReviewsQuerySchema,
  updateReviewStatusSchema,
  bulkUpdateReviewStatusSchema,
} = require("../../validations/schemaJoi/review.validation");

/**
 * @route GET /api/v1/admin/reviews
 * @desc List all reviews with filtering
 * @access Private (review.read_all)
 */
router.get(
  "/",
  authenticateToken,
  requirePermission("review.read_all"),
  validateQuery(listAdminReviewsQuerySchema),
  reviewController.listAllReviews
);

/**
 * @route PATCH /api/v1/admin/reviews/bulk-publish
 * @desc Bulk publish/unpublish reviews
 * @access Private (review.moderate_all)
 */
router.patch(
  "/bulk-publish",
  authenticateToken,
  requirePermission("review.moderate_all"),
  validateSchema(bulkUpdateReviewStatusSchema),
  reviewController.bulkUpdateReviewStatus
);

/**
 * @route PATCH /api/v1/admin/reviews/:id
 * @desc Moderate a single review
 * @access Private (review.moderate_own_hotel OR review.moderate_all)
 */
router.patch(
  "/:id",
  authenticateToken,
  // Note: Permission check for 'moderate_own_hotel' is handled in the service
  // but we need to ensure they have at least one of the two permissions.
  // Using an OR logic for middleware if possible, or just require at least one.
  // For now, let's allow if they have either.
  (req, res, next) => {
    const perms = req.user.permissions || [];
    if (perms.includes("review.moderate_all") || perms.includes("review.moderate_own_hotel")) {
      return next();
    }
    const { sendError } = require("../../utils/apiResponse");
    return sendError(res, { statusCode: 403, message: "Insufficient permissions" });
  },
  validateSchema(updateReviewStatusSchema),
  reviewController.updateReviewStatus
);

module.exports = router;
