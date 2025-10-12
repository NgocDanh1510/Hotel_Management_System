const express = require("express");
const router = express.Router();

const authController = require("../controllers/auth.controller");
const bookingController = require("../controllers/booking.controller");
const {
  authenticateToken,
  requirePermission,
} = require("../middlewares/auth.middleware");
const { validateSchema, validateQuery } = require("../middlewares/validate.middleware");
const updateProfileSchema = require("../validations/schemaJoi/updateProfile.validation");
const {
  listMyBookingsQuerySchema,
} = require("../validations/schemaJoi/booking.validation");

const authRoutes = require("./auth.routes");
const adminRoutes = require("./admin");
const hotelRoutes = require("./hotel.routes");
const bookingRoutes = require("./booking.routes");
const reviewRoutes = require("./review.routes");

router.use("/auth", authRoutes);
router.use("/admin", adminRoutes);
router.use("/hotels", hotelRoutes);
router.use("/bookings", bookingRoutes);
router.use("/reviews", reviewRoutes);

// Profile endpoints
router.get("/me", authenticateToken, authController.getProfile);
router.put(
  "/me",
  authenticateToken,
  validateSchema(updateProfileSchema),
  authController.updateProfile,
);

/**
 * GET /api/v1/me/bookings
 * List bookings for the authenticated user
 * Permission: booking.read_own
 */
router.get(
  "/me/bookings",
  authenticateToken,
  requirePermission("booking.read_own"),
  validateQuery(listMyBookingsQuerySchema),
  bookingController.listMyBookings,
);

module.exports = router;
