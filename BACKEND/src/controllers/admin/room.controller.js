const adminRoomService = require("../../services/admin/room.service");
const imageService = require("../../services/image.service");
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

  async createRoom(req, res) {
    try {
      const room = await adminRoomService.createRoom(req.body, req.user);

      return sendSuccess(res, {
        statusCode: 201,
        message: "Room created successfully",
        data: room,
      });
    } catch (error) {
      console.error("Error in createRoom:", error);
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

  async deleteRoom(req, res) {
    try {
      await adminRoomService.deleteRoom(req.params.id, req.user);

      return sendSuccess(res, {
        message: "Room deleted successfully",
      });
    } catch (error) {
      console.error("Error in deleteRoom:", error);
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

  async getRoomImages(req, res) {
    try {
      const images = await imageService.getRoomImages(req.params.roomId, req.user);

      return sendSuccess(res, {
        message: "Room images retrieved successfully",
        data: images,
      });
    } catch (error) {
      console.error("Error in getRoomImages:", error);
      return sendError(res, {
        statusCode: error.statusCode || 500,
        message: error.message || "Internal Server Error",
      });
    }
  }

  async addRoomImage(req, res) {
    try {
      const image = await imageService.addRoomImage(
        req.params.roomId,
        req.file,
        req.body,
        req.user
      );

      return sendSuccess(res, {
        statusCode: 201,
        message: "Room image added successfully",
        data: image,
      });
    } catch (error) {
      console.error("Error in addRoomImage:", error);
      return sendError(res, {
        statusCode: error.statusCode || 500,
        message: error.message || "Internal Server Error",
      });
    }
  }

  async deleteRoomImage(req, res) {
    try {
      await imageService.deleteRoomImage(
        req.params.roomId,
        req.params.imageId,
        req.user
      );

      return sendSuccess(res, {
        message: "Room image deleted successfully",
      });
    } catch (error) {
      console.error("Error in deleteRoomImage:", error);
      return sendError(res, {
        statusCode: error.statusCode || 500,
        message: error.message || "Internal Server Error",
      });
    }
  }
}

module.exports = new AdminRoomController();
