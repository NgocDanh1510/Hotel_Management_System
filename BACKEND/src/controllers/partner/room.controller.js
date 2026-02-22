const partnerRoomService = require("../../services/partner/room.service");
const imageService = require("../../services/image.service");
const { sendSuccess, sendError } = require("../../utils/apiResponse");
const { toPartnerScopedUser } = require("../../utils/partnerScope");

class PartnerRoomController {
  async listRooms(req, res) {
    try {
      const result = await partnerRoomService.listRooms(req.query, req.user);

      return sendSuccess(res, {
        message: "Rooms retrieved successfully",
        data: result.rooms,
        meta: result.meta,
      });
    } catch (error) {
      console.error("Partner list rooms error:", error);
      return sendError(res, {
        statusCode: error.statusCode || 500,
        message: error.message || "Internal Server Error",
      });
    }
  }

  async createRoom(req, res) {
    try {
      const room = await partnerRoomService.createRoom(req.body, req.user);

      return sendSuccess(res, {
        statusCode: 201,
        message: "Room created successfully",
        data: room,
      });
    } catch (error) {
      console.error("Partner create room error:", error);
      return sendError(res, {
        statusCode: error.statusCode || 500,
        message: error.message || "Internal Server Error",
      });
    }
  }

  async updateRoom(req, res) {
    try {
      const room = await partnerRoomService.updateRoom(
        req.params.id,
        req.body,
        req.user,
      );

      return sendSuccess(res, {
        message: "Room updated successfully",
        data: room,
      });
    } catch (error) {
      console.error("Partner update room error:", error);
      return sendError(res, {
        statusCode: error.statusCode || 500,
        message: error.message || "Internal Server Error",
      });
    }
  }

  async deleteRoom(req, res) {
    try {
      await partnerRoomService.deleteRoom(req.params.id, req.user);

      return sendSuccess(res, {
        message: "Room deleted successfully",
      });
    } catch (error) {
      console.error("Partner delete room error:", error);
      return sendError(res, {
        statusCode: error.statusCode || 500,
        message: error.message || "Internal Server Error",
      });
    }
  }

  async bulkUpdateStatus(req, res) {
    try {
      const result = await partnerRoomService.bulkUpdateStatus(req.body, req.user);

      return sendSuccess(res, {
        message: "Bulk room availability updated successfully",
        data: result,
      });
    } catch (error) {
      console.error("Partner bulk update room status error:", error);
      return sendError(res, {
        statusCode: error.statusCode || 500,
        message: error.message || "Internal Server Error",
        errors: error.conflicting_room_ids
          ? { conflicting_room_ids: error.conflicting_room_ids }
          : undefined,
      });
    }
  }

  async updateAvailability(req, res) {
    try {
      const result = await partnerRoomService.updateAvailability(
        req.params.id,
        req.body.status,
        req.user,
      );

      return sendSuccess(res, {
        message: "Room availability updated successfully",
        data: result,
      });
    } catch (error) {
      console.error("Partner update room availability error:", error);
      return sendError(res, {
        statusCode: error.statusCode || 500,
        message: error.message || "Internal Server Error",
        errors: error.conflicting_room_ids
          ? { conflicting_room_ids: error.conflicting_room_ids }
          : undefined,
      });
    }
  }

  async getRoomImages(req, res) {
    try {
      const images = await imageService.getRoomImages(
        req.params.roomId,
        toPartnerScopedUser(req.user),
      );

      return sendSuccess(res, {
        message: "Room images retrieved successfully",
        data: images,
      });
    } catch (error) {
      console.error("Partner get room images error:", error);
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
        toPartnerScopedUser(req.user),
      );

      return sendSuccess(res, {
        statusCode: 201,
        message: "Room image added successfully",
        data: image,
      });
    } catch (error) {
      console.error("Partner add room image error:", error);
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
        toPartnerScopedUser(req.user),
      );

      return sendSuccess(res, {
        message: "Room image deleted successfully",
      });
    } catch (error) {
      console.error("Partner delete room image error:", error);
      return sendError(res, {
        statusCode: error.statusCode || 500,
        message: error.message || "Internal Server Error",
      });
    }
  }
}

module.exports = new PartnerRoomController();
