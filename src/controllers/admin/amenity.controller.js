const amenityService = require("../../services/amenity.service");
const { sendSuccess, sendError } = require("../../utils/apiResponse");

/**
 * GET /api/v1/admin/amenities
 */
const getAllAmenities = async (req, res, next) => {
  try {
    const amenities = await amenityService.getAllAmenities();
    return sendSuccess(res, {
      message: "Amenities retrieved successfully",
      data: amenities,
    });
  } catch (error) {
    console.error("Get all amenities error:", error);
    next(error);
  }
};

/**
 * POST /api/v1/admin/amenities
 */
const createAmenity = async (req, res, next) => {
  try {
    const amenity = await amenityService.createAmenity(req.body);
    return sendSuccess(res, {
      statusCode: 201,
      message: "Amenity created successfully",
      data: amenity,
    });
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, { statusCode: error.statusCode, message: error.message });
    }
    console.error("Create amenity error:", error);
    next(error);
  }
};

/**
 * PUT /api/v1/admin/amenities/:id
 */
const updateAmenity = async (req, res, next) => {
  try {
    const { id } = req.params;
    const amenity = await amenityService.updateAmenity(id, req.body);
    return sendSuccess(res, {
      message: "Amenity updated successfully",
      data: amenity,
    });
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, { statusCode: error.statusCode, message: error.message });
    }
    console.error("Update amenity error:", error);
    next(error);
  }
};

/**
 * DELETE /api/v1/admin/amenities/:id
 */
const deleteAmenity = async (req, res, next) => {
  try {
    const { id } = req.params;
    await amenityService.deleteAmenity(id);
    return sendSuccess(res, { message: "Amenity deleted successfully" });
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, { 
        statusCode: error.statusCode, 
        message: error.message,
        errors: error.data 
      });
    }
    console.error("Delete amenity error:", error);
    next(error);
  }
};

/**
 * PUT /api/v1/admin/hotels/:id/amenities
 */
const updateHotelAmenities = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { amenity_ids } = req.body;
    const result = await amenityService.updateHotelAmenities(id, amenity_ids, req.user);
    return sendSuccess(res, {
      message: "Hotel amenities updated successfully",
      data: result,
    });
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, { statusCode: error.statusCode, message: error.message });
    }
    console.error("Update hotel amenities error:", error);
    next(error);
  }
};

/**
 * PUT /api/v1/admin/room-types/:id/amenities
 */
const updateRoomTypeAmenities = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { amenity_ids } = req.body;
    const result = await amenityService.updateRoomTypeAmenities(id, amenity_ids, req.user);
    return sendSuccess(res, {
      message: "Room type amenities updated successfully",
      data: result,
    });
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, { statusCode: error.statusCode, message: error.message });
    }
    console.error("Update room type amenities error:", error);
    next(error);
  }
};

module.exports = {
  getAllAmenities,
  createAmenity,
  updateAmenity,
  deleteAmenity,
  updateHotelAmenities,
  updateRoomTypeAmenities,
};
