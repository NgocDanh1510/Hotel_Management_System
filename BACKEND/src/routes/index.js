const express = require("express");
const router = express.Router();

const authController = require("../controllers/auth.controller");
const bookingController = require("../controllers/booking.controller");
const {
  authenticateToken,
  requirePermission,
} = require("../middlewares/auth.middleware");
const {
  validateSchema,
  validateQuery,
} = require("../middlewares/validate.middleware");
const updateProfileSchema = require("../validations/schemaJoi/updateProfile.validation");
const {
  listMyBookingsQuerySchema,
} = require("../validations/schemaJoi/booking.validation");

const authRoutes = require("./auth.routes");
const adminRoutes = require("./admin");
const hotelRoutes = require("./hotel.routes");
const bookingRoutes = require("./booking.routes");
const reviewRoutes = require("./review.routes");
const paymentRoutes = require("./payment.routes");
const webhookRoutes = require("./webhook.routes");
const locationRoutes = require("./location.route");
const userRoutes = require("./user.routes");

router.use("/auth", authRoutes);
router.use("/admin", adminRoutes);
router.use("/hotels", hotelRoutes);
router.use("/bookings", bookingRoutes);
router.use("/reviews", reviewRoutes);
router.use("/payments", paymentRoutes);
router.use("/webhooks", webhookRoutes);
router.use("/locations", locationRoutes);
router.use("/user", userRoutes);

/**
 * GET /api/v1/account
 * Get authenticated user's profile
 */
router.get("/account", authenticateToken, authController.getProfile);
router.put(
  "/account",
  authenticateToken,
  validateSchema(updateProfileSchema),
  authController.updateProfile,
);

module.exports = router;
