const express = require("express");
const router = express.Router();
const partnerRoomController = require("../../controllers/partner/room.controller");
const upload = require("../../middlewares/upload.middleware");
const { authenticateToken, requirePermission } = require("../../middlewares/auth.middleware");
const { validateSchema, validateQuery } = require("../../middlewares/validate.middleware");
const {
  createRoomSchema,
  listRoomsQuerySchema,
  bulkUpdateStatusSchema,
} = require("../../validations/schemaJoi/admin/room.validation");
const {
  addHotelImageSchema,
} = require("../../validations/schemaJoi/image.validation");
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

router.post(
  "/",
  requirePermission("room.manage_own_hotel"),
  validateSchema(createRoomSchema),
  partnerRoomController.createRoom,
);

router.patch(
  "/bulk-status",
  requirePermission("room.set_availability"),
  validateSchema(bulkUpdateStatusSchema),
  partnerRoomController.bulkUpdateStatus,
);

router.get(
  "/:roomId/images",
  requirePermission("image.manage_own_hotel"),
  partnerRoomController.getRoomImages,
);

router.post(
  "/:roomId/images",
  requirePermission("image.manage_own_hotel"),
  upload.single("file"),
  validateSchema(addHotelImageSchema),
  partnerRoomController.addRoomImage,
);

router.delete(
  "/:roomId/images/:imageId",
  requirePermission("image.manage_own_hotel"),
  partnerRoomController.deleteRoomImage,
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

router.delete(
  "/:id",
  requirePermission("room.manage_own_hotel"),
  partnerRoomController.deleteRoom,
);

module.exports = router;
