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

const { authenticateToken } = require("../middlewares/auth.middleware");
const {
  validate,
  validateSchema,
} = require("../middlewares/validate.middleware");

router.use(authenticateToken);

/**
 * GET /api/v1/user/
 * Get authenticated user's profile
 */
router.get("/user", userController.getProfile);

/**
 * PUT /api/v1/user/
 * Update authenticated user's profile
 */
router.put(
  "/user",
  validateSchema(updateProfileSchema),
  userController.updateProfile,
);

/**
 * PUT /api/v1/user/password
 * Update authenticated user's password
 */
router.put(
  "/user/password",
  validateSchema(updatePasswordSchema),
  userController.updatePassword,
);

/**
 * PUT /api/v1/user/email
 * Update authenticated user's email
 */
router.put(
  "/user/email",
  validateSchema(updateEmailSchema),
  userController.updateEmail,
);

/**
 * GET /api/v1/user/bookings
 * List bookings for the authenticated user
 * Permission: booking.read_own
 */
router.get(
  "/user/bookings",
  authenticateToken,
  requirePermission("booking.read_own"),
  validateQuery(listMyBookingsQuerySchema),
  userController.listMyBookings,
);
