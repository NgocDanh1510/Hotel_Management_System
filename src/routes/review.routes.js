const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/review.controller");
const {
  authenticateToken,
  requirePermission,
} = require("../middlewares/auth.middleware");
const { validateSchema } = require("../middlewares/validate.middleware");
const { createReviewSchema } = require("../validations/schemaJoi/review.validation");

/**
 * @route POST /api/v1/reviews
 * @desc Submit a review for a booking
 * @access Private (review.create)
 */
router.post(
  "/",
  authenticateToken,
  requirePermission("review.create"),
  validateSchema(createReviewSchema),
  reviewController.createReview
);

module.exports = router;
