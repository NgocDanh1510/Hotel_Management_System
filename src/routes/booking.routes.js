const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/booking.controller");
const {
  authenticateToken,
  requirePermission,
  requireAnyPermission,
} = require("../middlewares/auth.middleware");
const { validateSchema } = require("../middlewares/validate.middleware");
const {
  createBookingSchema,
} = require("../validations/schemaJoi/booking.validation");

/**
 * POST /api/v1/bookings
 * Create a new booking
 * Permission: booking.create
 */
router.post(
  "/",
  authenticateToken,
  requirePermission("booking.create"),
  validateSchema(createBookingSchema),
  bookingController.createBooking
);

/**
 * GET /api/v1/bookings/:id
 * Get booking detail
 * Permission: booking.read_own OR booking.read_all
 */
router.get(
  "/:id",
  authenticateToken,
  requireAnyPermission(["booking.read_own", "booking.read_all"]),
  bookingController.getBookingDetail
);

/**
 * POST /api/v1/bookings/:id/cancel
 * Cancel a booking
 * Permission: booking.cancel_own OR booking.cancel_all
 */
router.post(
  "/:id/cancel",
  authenticateToken,
  requireAnyPermission(["booking.cancel_own", "booking.cancel_all"]),
  bookingController.cancelBooking
);

module.exports = router;
