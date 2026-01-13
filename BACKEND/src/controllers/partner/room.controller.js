const partnerRoomService = require("../../services/partner/room.service");
const { sendSuccess, sendError } = require("../../utils/apiResponse");

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
}

module.exports = new PartnerRoomController();
