const partnerHotelService = require("../../services/partner/hotels.service");
const imageService = require("../../services/image.service");
const { sendSuccess, sendError } = require("../../utils/apiResponse");
const { toPartnerScopedUser } = require("../../utils/partnerScope");

const createHotel = async (req, res, next) => {
  try {
    const hotel = await partnerHotelService.createHotel(req.body, req.user);

    return sendSuccess(res, {
      statusCode: 201,
      message: "Hotel created successfully and is waiting for admin review",
      data: hotel,
    });
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, {
        statusCode: error.statusCode,
        message: error.message,
      });
    }
    console.error("Partner create hotel error:", error);
    next(error);
  }
};

const listHotels = async (req, res, next) => {
  try {
    const { hotels, meta } = await partnerHotelService.listHotels(req.query, req.user);

    return sendSuccess(res, {
      message: "Hotels retrieved successfully",
      data: hotels,
      meta,
    });
  } catch (error) {
    console.error("Partner list hotels error:", error);
    next(error);
  }
};

const updateHotel = async (req, res, next) => {
  try {
    const hotel = await partnerHotelService.updateHotel(req.params.id, req.body, req.user);

    return sendSuccess(res, {
      message: "Hotel updated successfully",
      data: hotel,
    });
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, {
        statusCode: error.statusCode,
        message: error.message,
        errors: error.bookings,
      });
    }
    console.error("Partner update hotel error:", error);
    next(error);
  }
};

const submitForReview = async (req, res, next) => {
  try {
    const hotel = await partnerHotelService.submitForReview(req.params.id, req.user);

    return sendSuccess(res, {
      message: "Hotel submitted for review successfully",
      data: hotel,
    });
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, {
        statusCode: error.statusCode,
        message: error.message,
      });
    }
    console.error("Partner submit hotel for review error:", error);
    next(error);
  }
};

const getHotelImages = async (req, res, next) => {
  try {
    const images = await imageService.getHotelImages(
      req.params.hotelId,
      toPartnerScopedUser(req.user),
    );

    return sendSuccess(res, {
      message: "Hotel images retrieved successfully",
      data: images,
    });
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, {
        statusCode: error.statusCode,
        message: error.message,
      });
    }
    console.error("Partner get hotel images error:", error);
    next(error);
  }
};

const addHotelImage = async (req, res, next) => {
  try {
    const image = await imageService.addHotelImage(
      req.params.hotelId,
      req.file,
      req.body,
      toPartnerScopedUser(req.user),
    );

    return sendSuccess(res, {
      statusCode: 201,
      message: "Hotel image added successfully",
      data: image,
    });
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, {
        statusCode: error.statusCode,
        message: error.message,
      });
    }
    console.error("Partner add hotel image error:", error);
    next(error);
  }
};

const deleteHotelImage = async (req, res, next) => {
  try {
    await imageService.deleteHotelImage(
      req.params.hotelId,
      req.params.imageId,
      toPartnerScopedUser(req.user),
    );

    return sendSuccess(res, {
      message: "Hotel image deleted successfully",
    });
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, {
        statusCode: error.statusCode,
        message: error.message,
      });
    }
    console.error("Partner delete hotel image error:", error);
    next(error);
  }
};

module.exports = {
  createHotel,
  listHotels,
  updateHotel,
  submitForReview,
  getHotelImages,
  addHotelImage,
  deleteHotelImage,
};
