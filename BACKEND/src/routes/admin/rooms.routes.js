const express = require("express");
const router = express.Router();
const adminRoomController = require("../../controllers/admin/room.controller");
const upload = require("../../middlewares/upload.middleware");
const {
  authenticateToken,
  requirePermission,
} = require("../../middlewares/auth.middleware");
const { validateQuery, validateSchema } = require("../../middlewares/validate.middleware");
const {
  createRoomSchema,
  listRoomsQuerySchema,
  updateRoomSchema,
  bulkUpdateStatusSchema,
} = require("../../validations/schemaJoi/admin/room.validation");
const {
  addHotelImageSchema,
} = require("../../validations/schemaJoi/image.validation");

// All routes require authentication
router.use(authenticateToken);

/**
 * GET /api/v1/admin/rooms
 * List all rooms with filters, search, sort, and pagination
 */
router.get(
  "/",
  requirePermission("room.manage_all"),
  validateQuery(listRoomsQuerySchema),
  adminRoomController.listRooms
);

router.post(
  "/",
  requirePermission("room.manage_all"),
  validateSchema(createRoomSchema),
  adminRoomController.createRoom,
);

/**
 * PATCH /api/v1/admin/rooms/bulk-status
 * Bulk update status of multiple rooms
 */
router.patch(
  "/bulk-status",
  requirePermission("room.manage_all"),
  validateSchema(bulkUpdateStatusSchema),
  adminRoomController.bulkUpdateStatus
);

router.get(
  "/:roomId/images",
  requirePermission("image.manage_all"),
  adminRoomController.getRoomImages,
);

router.post(
  "/:roomId/images",
  requirePermission("image.manage_all"),
  upload.single("file"),
  validateSchema(addHotelImageSchema),
  adminRoomController.addRoomImage,
);

router.delete(
  "/:roomId/images/:imageId",
  requirePermission("image.manage_all"),
  adminRoomController.deleteRoomImage,
);

/**
 * PUT /api/v1/admin/rooms/:id
 * Update a specific room
 */
router.put(
  "/:id",
  requirePermission("room.manage_all"),
  validateSchema(updateRoomSchema),
  adminRoomController.updateRoom
);

router.delete(
  "/:id",
  requirePermission("room.manage_all"),
  adminRoomController.deleteRoom,
);

module.exports = router;
