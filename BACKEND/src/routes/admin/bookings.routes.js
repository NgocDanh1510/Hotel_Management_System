const express = require("express");
const router = express.Router();
const adminBookingController = require("../../controllers/admin/booking.controller");
const {
  authenticateToken,
  requirePermission,
  requireAnyPermission,
} = require("../../middlewares/auth.middleware");
const { validateSchema, validateQuery } = require("../../middlewares/validate.middleware");
const {
  listAdminBookingsQuerySchema,
  updateBookingStatusSchema,
} = require("../../validations/schemaJoi/booking.validation");

// All routes require authentication
router.use(authenticateToken);

/**
 * GET /api/v1/admin/bookings
 * List all bookings with advanced filtering
 * Permission: booking.read_all
 */
router.get(
  "/",
  requirePermission("booking.read_all"),
  validateQuery(listAdminBookingsQuerySchema),
  adminBookingController.listAllBookings
);

/**
 * PATCH /api/v1/admin/bookings/:id/status
 * Update booking status
 * Permission: booking.update_status_own_hotel OR booking.update_status_all
 */
router.patch(
  "/:id/status",
  requireAnyPermission([
    "booking.update_status_own_hotel",
    "booking.update_status_all",
  ]),
  validateSchema(updateBookingStatusSchema),
  adminBookingController.updateBookingStatus
);

module.exports = router;
