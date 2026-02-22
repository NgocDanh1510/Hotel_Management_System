const partnerRoomTypeService = require("../../services/partner/roomType.service");
const imageService = require("../../services/image.service");
const { sendSuccess, sendError } = require("../../utils/apiResponse");
const { toPartnerScopedUser } = require("../../utils/partnerScope");

class PartnerRoomTypeController {
  async listAllRoomTypes(req, res) {
    try {
      const result = await partnerRoomTypeService.listRoomTypesByQuery(
        req.query,
        req.user,
      );

      return sendSuccess(res, {
        message: "Room types retrieved successfully",
        data: result.room_types,
        meta: result.meta,
      });
    } catch (error) {
      console.error("Partner list all room types error:", error);
      return sendError(res, {
        statusCode: error.statusCode || 500,
        message: error.message || "Internal Server Error",
      });
    }
  }

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

  async updateRoomType(req, res) {
    try {
      const roomType = await partnerRoomTypeService.updateRoomType(
        req.params.id,
        req.body,
        req.user,
      );

      return sendSuccess(res, {
        message: "Room type updated successfully",
        data: roomType,
      });
    } catch (error) {
      console.error("Partner update room type error:", error);
      return sendError(res, {
        statusCode: error.statusCode || 500,
        message: error.message || "Internal Server Error",
      });
    }
  }

  async deleteRoomType(req, res) {
    try {
      await partnerRoomTypeService.deleteRoomType(req.params.id, req.user);

      return sendSuccess(res, {
        message: "Room type deleted successfully",
      });
    } catch (error) {
      console.error("Partner delete room type error:", error);
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
        toPartnerScopedUser(req.user),
      );

      return sendSuccess(res, {
        message: "Room type images retrieved successfully",
        data: images,
      });
    } catch (error) {
      console.error("Partner get room type images error:", error);
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
        toPartnerScopedUser(req.user),
      );

      return sendSuccess(res, {
        statusCode: 201,
        message: "Room type image added successfully",
        data: image,
      });
    } catch (error) {
      console.error("Partner add room type image error:", error);
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
        toPartnerScopedUser(req.user),
      );

      return sendSuccess(res, {
        message: "Room type image deleted successfully",
      });
    } catch (error) {
      console.error("Partner delete room type image error:", error);
      return sendError(res, {
        statusCode: error.statusCode || 500,
        message: error.message || "Internal Server Error",
      });
    }
  }
}

module.exports = new PartnerRoomTypeController();
