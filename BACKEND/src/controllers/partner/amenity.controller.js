const partnerAmenityService = require("../../services/partner/amenity.service");
const { sendSuccess, sendError } = require("../../utils/apiResponse");

const getAllAmenities = async (req, res, next) => {
  try {
    const amenities = await partnerAmenityService.getAllAmenities();

    return sendSuccess(res, {
      message: "Amenities retrieved successfully",
      data: amenities,
    });
  } catch (error) {
    console.error("Partner get amenities error:", error);
    next(error);
  }
};

const updateHotelAmenities = async (req, res, next) => {
  try {
    const result = await partnerAmenityService.updateHotelAmenities(
      req.params.id,
      req.body.amenity_ids,
      req.user,
    );

    return sendSuccess(res, {
      message: "Hotel amenities updated successfully",
      data: result,
    });
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, {
        statusCode: error.statusCode,
        message: error.message,
      });
    }
    console.error("Partner update hotel amenities error:", error);
    next(error);
  }
};

const updateRoomTypeAmenities = async (req, res, next) => {
  try {
    const result = await partnerAmenityService.updateRoomTypeAmenities(
      req.params.id,
      req.body.amenity_ids,
      req.user,
    );

    return sendSuccess(res, {
      message: "Room type amenities updated successfully",
      data: result,
    });
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, {
        statusCode: error.statusCode,
        message: error.message,
      });
    }
    console.error("Partner update room type amenities error:", error);
    next(error);
  }
};

module.exports = {
  getAllAmenities,
  updateHotelAmenities,
  updateRoomTypeAmenities,
};
