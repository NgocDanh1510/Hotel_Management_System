const partnerRoomTypeService = require("../../services/partner/roomType.service");
const { sendSuccess, sendError } = require("../../utils/apiResponse");

class PartnerRoomTypeController {
  async listRoomTypes(req, res) {
    try {
      const result = await partnerRoomTypeService.listRoomTypes(
        req.params.hotelId,
        req.query,
        req.user,
      );

      return sendSuccess(res, {
        message: "Room types retrieved successfully",
        data: result.room_types,
        meta: result.meta,
      });
    } catch (error) {
      console.error("Partner list room types error:", error);
      return sendError(res, {
        statusCode: error.statusCode || 500,
        message: error.message || "Internal Server Error",
      });
    }
  }

  async createRoomType(req, res) {
    try {
      const roomType = await partnerRoomTypeService.createRoomType(
        req.params.hotelId,
        req.body,
        req.user,
      );

      return sendSuccess(res, {
        statusCode: 201,
        message: "Room type created successfully",
        data: roomType,
      });
    } catch (error) {
      console.error("Partner create room type error:", error);
      return sendError(res, {
        statusCode: error.statusCode || 500,
        message: error.message || "Internal Server Error",
      });
    }
  }

  async updateRoomTypePrice(req, res) {
    try {
      const roomType = await partnerRoomTypeService.updateRoomTypePrice(
        req.params.id,
        req.body,
        req.user,
      );

      return sendSuccess(res, {
        message: "Room type price updated successfully",
        data: roomType,
      });
    } catch (error) {
      console.error("Partner update room type price error:", error);
      return sendError(res, {
        statusCode: error.statusCode || 500,
        message: error.message || "Internal Server Error",
      });
    }
  }
}

module.exports = new PartnerRoomTypeController();
