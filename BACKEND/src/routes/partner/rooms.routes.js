const express = require("express");
const router = express.Router();
const partnerRoomController = require("../../controllers/partner/room.controller");
const { authenticateToken, requirePermission } = require("../../middlewares/auth.middleware");
const { validateSchema, validateQuery } = require("../../middlewares/validate.middleware");
const {
  listRoomsQuerySchema,
  bulkUpdateStatusSchema,
} = require("../../validations/schemaJoi/admin/room.validation");
const {
  updatePartnerRoomSchema,
  updateRoomAvailabilitySchema,
} = require("../../validations/schemaJoi/partner/room.validation");

router.use(authenticateToken);

router.get(
  "/",
  requirePermission("room.manage_own_hotel"),
  validateQuery(listRoomsQuerySchema),
  partnerRoomController.listRooms,
);

router.patch(
  "/bulk-status",
  requirePermission("room.set_availability"),
  validateSchema(bulkUpdateStatusSchema),
  partnerRoomController.bulkUpdateStatus,
);

router.patch(
  "/:id/availability",
  requirePermission("room.set_availability"),
  validateSchema(updateRoomAvailabilitySchema),
  partnerRoomController.updateAvailability,
);

router.put(
  "/:id",
  requirePermission("room.manage_own_hotel"),
  validateSchema(updatePartnerRoomSchema),
  partnerRoomController.updateRoom,
);

module.exports = router;
