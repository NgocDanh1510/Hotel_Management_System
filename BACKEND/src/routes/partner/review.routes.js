const express = require("express");
const router = express.Router();
const partnerReviewController = require("../../controllers/partner/review.controller");
const { authenticateToken, requirePermission } = require("../../middlewares/auth.middleware");
const { validateQuery } = require("../../middlewares/validate.middleware");
const {
  listAdminReviewsQuerySchema,
} = require("../../validations/schemaJoi/review.validation");

router.use(authenticateToken);

router.get(
  "/",
  requirePermission("review.read_all"),
  validateQuery(listAdminReviewsQuerySchema),
  partnerReviewController.listReviews,
);

module.exports = router;
