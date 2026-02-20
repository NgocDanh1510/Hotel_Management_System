const roomTypeService = require("../../services/admin/roomType.service");
const imageService = require("../../services/image.service");
const { sendSuccess, sendError } = require("../../utils/apiResponse");

class AdminRoomTypeController {
  async listAllRoomTypes(req, res) {
    try {
      const result = await roomTypeService.listRoomTypesByQuery(
        req.query,
        req.user
      );

      return sendSuccess(res, {
        message: "Room types retrieved successfully",
        data: result.room_types,
        meta: result.meta,
      });
    } catch (error) {
      console.error("Error in listAllRoomTypes:", error);
      return sendError(res, {
        statusCode: error.statusCode || 500,
        message: error.message || "Internal Server Error",
      });
    }
  }

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

  async updateRoomType(req, res) {
    try {
      const roomType = await roomTypeService.updateRoomType(
        req.params.id,
        req.body,
        req.user
      );

      return sendSuccess(res, {
        message: "Room type updated successfully",
        data: roomType,
      });
    } catch (error) {
      console.error("Error in updateRoomType:", error);
      return sendError(res, {
        statusCode: error.statusCode || 500,
        message: error.message || "Internal Server Error",
      });
    }
  }

  async deleteRoomType(req, res) {
    try {
      await roomTypeService.deleteRoomType(req.params.id, req.user);

      return sendSuccess(res, {
        message: "Room type deleted successfully",
      });
    } catch (error) {
      console.error("Error in deleteRoomType:", error);
      return sendError(res, {
        statusCode: error.statusCode || 500,
        message: error.message || "Internal Server Error",
      });
    }
  }

  async getRoomTypeImages(req, res) {
    try {
      const images = await imageService.getRoomTypeImages(
        req.params.roomTypeId,
        req.user
      );

      return sendSuccess(res, {
        message: "Room type images retrieved successfully",
        data: images,
      });
    } catch (error) {
      console.error("Error in getRoomTypeImages:", error);
      return sendError(res, {
        statusCode: error.statusCode || 500,
        message: error.message || "Internal Server Error",
      });
    }
  }

  async addRoomTypeImage(req, res) {
    try {
      const image = await imageService.addRoomTypeImage(
        req.params.roomTypeId,
        req.file,
        req.body,
        req.user
      );

      return sendSuccess(res, {
        statusCode: 201,
        message: "Room type image added successfully",
        data: image,
      });
    } catch (error) {
      console.error("Error in addRoomTypeImage:", error);
      return sendError(res, {
        statusCode: error.statusCode || 500,
        message: error.message || "Internal Server Error",
      });
    }
  }

  async deleteRoomTypeImage(req, res) {
    try {
      await imageService.deleteRoomTypeImage(
        req.params.roomTypeId,
        req.params.imageId,
        req.user
      );

      return sendSuccess(res, {
        message: "Room type image deleted successfully",
      });
    } catch (error) {
      console.error("Error in deleteRoomTypeImage:", error);
      return sendError(res, {
        statusCode: error.statusCode || 500,
        message: error.message || "Internal Server Error",
      });
    }
  }
}

module.exports = new AdminRoomTypeController();
