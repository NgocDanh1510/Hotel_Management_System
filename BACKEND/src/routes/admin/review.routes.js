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
 * @access Private (review.moderate_all)
 */
router.patch(
  "/:id",
  authenticateToken,
  requirePermission("review.moderate_all"),
  validateSchema(updateReviewStatusSchema),
  reviewController.updateReviewStatus
);

module.exports = router;
