const express = require("express");
const router = express.Router();
const partnerBookingController = require("../../controllers/partner/booking.controller");
const { authenticateToken, requirePermission } = require("../../middlewares/auth.middleware");
const { validateSchema, validateQuery } = require("../../middlewares/validate.middleware");
const {
  listAdminBookingsQuerySchema,
  updateBookingStatusSchema,
} = require("../../validations/schemaJoi/booking.validation");

router.use(authenticateToken);

router.get(
  "/",
  requirePermission("booking.read_own_hotel"),
  validateQuery(listAdminBookingsQuerySchema),
  partnerBookingController.listBookings,
);

router.get(
  "/:id",
  requirePermission("booking.read_own_hotel"),
  partnerBookingController.getBookingDetail,
);

router.get(
  "/:id/invoice",
  requirePermission("booking.read_own_hotel"),
  partnerBookingController.getBookingInvoice,
);

router.post(
  "/:id/cancel",
  requirePermission("booking.cancel_own_hotel"),
  partnerBookingController.cancelBooking,
);

router.patch(
  "/:id/status",
  requirePermission("booking.update_status_own_hotel"),
  validateSchema(updateBookingStatusSchema),
  partnerBookingController.updateBookingStatus,
);

router.post(
  "/:id/no-show",
  requirePermission("booking.set_no_show"),
  partnerBookingController.setNoShow,
);

module.exports = router;
