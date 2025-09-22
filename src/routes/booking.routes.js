const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/booking.controller");
const {
  authenticateToken,
  requirePermission,
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

module.exports = router;
