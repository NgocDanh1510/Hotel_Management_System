const express = require("express");
const router = express.Router();
const adminRoomController = require("../../controllers/admin/room.controller");
const {
  authenticateToken,
  requireAnyPermission,
} = require("../../middlewares/auth.middleware");
const { validateSchema } = require("../../middlewares/validate.middleware");
const {
  updateRoomSchema,
  bulkUpdateStatusSchema,
} = require("../../validations/schemaJoi/admin/room.validation");

// All routes require authentication
router.use(authenticateToken);

/**
 * GET /api/v1/admin/rooms
 * List all rooms with filters, search, sort, and pagination
 */
router.get(
  "/",
  requireAnyPermission(["room.manage_own_hotel", "room.manage_all"]),
  adminRoomController.listRooms
);

/**
 * PATCH /api/v1/admin/rooms/bulk-status
 * Bulk update status of multiple rooms
 */
router.patch(
  "/bulk-status",
  requireAnyPermission(["room.manage_own_hotel", "room.manage_all"]),
  validateSchema(bulkUpdateStatusSchema),
  adminRoomController.bulkUpdateStatus
);

/**
 * PUT /api/v1/admin/rooms/:id
 * Update a specific room
 */
router.put(
  "/:id",
  requireAnyPermission(["room.manage_own_hotel", "room.manage_all"]),
  validateSchema(updateRoomSchema),
  adminRoomController.updateRoom
);

module.exports = router;
