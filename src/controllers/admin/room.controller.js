const adminRoomService = require("../../services/admin/room.service");
const { sendSuccess, sendError } = require("../../utils/apiResponse");

class AdminRoomController {
  /**
   * GET /api/v1/admin/rooms
   * List all rooms with filtering, search, sort, and pagination
   */
  async listRooms(req, res) {
    try {
      const result = await adminRoomService.listRooms(req.query, req.user);

      return sendSuccess(res, {
        message: "Rooms retrieved successfully",
        data: result.rooms,
        meta: result.meta,
      });
    } catch (error) {
      console.error("Error in listRooms:", error);
      return sendError(res, {
        statusCode: error.statusCode || 500,
        message: error.message || "Internal Server Error",
      });
    }
  }

  /**
   * PUT /api/v1/admin/rooms/:id
   * Update a specific room
   */
  async updateRoom(req, res) {
    try {
      const { id } = req.params;
      const room = await adminRoomService.updateRoom(id, req.body, req.user);

      return sendSuccess(res, {
        message: "Room updated successfully",
        data: room,
      });
    } catch (error) {
      console.error("Error in updateRoom:", error);
      return sendError(res, {
        statusCode: error.statusCode || 500,
        message: error.message || "Internal Server Error",
      });
    }
  }

  /**
   * PATCH /api/v1/admin/rooms/bulk-status
   * Bulk update status of multiple rooms
   */
  async bulkUpdateStatus(req, res) {
    try {
      const result = await adminRoomService.bulkUpdateStatus(req.body, req.user);

      return sendSuccess(res, {
        message: "Bulk status update successful",
        data: result,
      });
    } catch (error) {
      console.error("Error in bulkUpdateStatus:", error);
      return sendError(res, {
        statusCode: error.statusCode || 500,
        message: error.message || "Internal Server Error",
        errors: error.conflicting_room_ids ? { conflicting_room_ids: error.conflicting_room_ids } : undefined
      });
    }
  }
}

module.exports = new AdminRoomController();
