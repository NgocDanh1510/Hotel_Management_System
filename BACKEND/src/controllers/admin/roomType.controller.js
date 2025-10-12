const roomTypeService = require("../../services/admin/roomType.service");
const { sendSuccess, sendError } = require("../../utils/apiResponse");

class AdminRoomTypeController {
  /**
   * List room types for a specific hotel
   * GET /api/v1/admin/hotels/:hotelId/room-types
   */
  async listRoomTypes(req, res) {
    try {
      const { hotelId } = req.params;
      const result = await roomTypeService.listRoomTypes(
        hotelId,
        req.query,
        req.user
      );

      return sendSuccess(res, {
        message: "Room types retrieved successfully",
        data: result.room_types,
        meta: result.meta,
      });
    } catch (error) {
      console.error("Error in listRoomTypes:", error);
      return sendError(res, {
        statusCode: error.statusCode || 500,
        message: error.message || "Internal Server Error",
      });
    }
  }

  /**
   * Create a new room type for a hotel
   * POST /api/v1/admin/hotels/:hotelId/room-types
   */
  async createRoomType(req, res) {
    try {
      const { hotelId } = req.params;
      const roomType = await roomTypeService.createRoomType(
        hotelId,
        req.body,
        req.user
      );

      return sendSuccess(res, {
        statusCode: 201,
        message: "Room type created successfully",
        data: roomType,
      });
    } catch (error) {
      console.error("Error in createRoomType:", error);
      return sendError(res, {
        statusCode: error.statusCode || 500,
        message: error.message || "Internal Server Error",
      });
    }
  }
}

module.exports = new AdminRoomTypeController();
