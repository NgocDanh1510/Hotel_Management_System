const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const {
  listMyBookingsQuerySchema,
} = require("../validations/schemaJoi/booking.validation");
const {
  updateProfileSchema,
  updatePasswordSchema,
  updateEmailSchema,
} = require("../validations/schemaJoi/profile.validation");

const { authenticateToken, requirePermission } = require("../middlewares/auth.middleware");
const {
  validate,
  validateSchema,
  validateQuery,
} = require("../middlewares/validate.middleware");

router.use(authenticateToken);

/**
 * GET /api/v1/user/profile
 * Get authenticated user's profile
 */
router.get("/profile", requirePermission("account.read_own"), userController.getProfile);

/**
 * PUT /api/v1/user/profile
 * Update authenticated user's profile
 */
router.put(
  "/profile",
  requirePermission("account.update_own"),
  validateSchema(updateProfileSchema),
  userController.updateProfile,
);

/**
 * PUT /api/v1/user/password
 * Update authenticated user's password
 */
router.put(
  "/password",
  requirePermission("account.update_own"),
  validateSchema(updatePasswordSchema),
  userController.updatePassword,
);

/**
 * PUT /api/v1/user/email
 * Update authenticated user's email
 */
router.put(
  "/email",
  requirePermission("account.update_own"),
  validateSchema(updateEmailSchema),
  userController.updateEmail,
);

/**
 * GET /api/v1/user/bookings
 * List bookings for the authenticated user
 * Permission: booking.read_own
 */
router.get(
  "/bookings",
  requirePermission("booking.read_own"),
  validateQuery(listMyBookingsQuerySchema),
  userController.listMyBookings,
);

/**
 * GET /api/v1/user/payments
 * List payments for the authenticated user
 */
router.get(
  "/payments",
  requirePermission("payment.read_own"),
  userController.listMyPayments,
);

/**
 * GET /api/v1/user/reviews
 * List reviews written by the authenticated user
 */
router.get(
  "/reviews",
  requirePermission("review.read_all"),
  userController.listMyReviews,
);

/**
 * GET /api/v1/user/reviews/:id
 * Get detail of a specific review
 */
router.get(
  "/reviews/:id",
  requirePermission("review.read_all"),
  userController.getMyReviewDetail,
);

/**
 * PUT /api/v1/user/reviews/:id
 * Update a specific review
 */
router.put(
  "/reviews/:id",
  requirePermission("review.edit_own"),
  userController.updateMyReview,
);

/**
 * DELETE /api/v1/user/reviews/:id
 * Delete a specific review
 */
router.delete(
  "/reviews/:id",
  requirePermission("review.delete_own"),
  userController.deleteMyReview,
);

module.exports = router;
