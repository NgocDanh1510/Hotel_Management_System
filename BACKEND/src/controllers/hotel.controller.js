const hotelService = require("../services/hotel.service");
const { sendSuccess, sendError } = require("../utils/apiResponse");

/**
 * GET /api/v1/hotels
 * List all public hotels with advanced filtering
 * @access Public (no auth required)
 */
const listHotels = async (req, res, next) => {
  try {
    // Validate check_in and check_out together
    const { check_in, check_out, price_min, price_max } = req.query;

    if ((check_in && !check_out) || (!check_in && check_out)) {
      return sendError(res, {
        statusCode: 400,
        message:
          "Both check_in and check_out are required for availability filtering",
      });
    }

    if (
      price_min &&
      price_max &&
      parseFloat(price_min) > parseFloat(price_max)
    ) {
      return sendError(res, {
        statusCode: 400,
        message: "price_min cannot be greater than price_max",
      });
    }

    const { hotels, meta } = await hotelService.listHotels(req.query);

    return sendSuccess(res, {
      statusCode: 200,
      message: "Get hotels successfully",
      data: hotels,
      meta,
    });
  } catch (error) {
    console.error("List hotels error:", error);
    next(error);
  }
};

/**
 * GET /api/v1/hotels/:slug
 * Get hotel detail with room types, amenities, images, and ratings
 * @access Public (no auth required)
 */
const getHotelDetail = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const hotelDetail = await hotelService.getHotelDetail(slug);

    return sendSuccess(res, {
      statusCode: 200,
      message: "Get hotel detail successfully",
      data: hotelDetail,
    });
  } catch (error) {
    if (error.statusCode === 404) {
      return sendError(res, {
        statusCode: 404,
        message: error.message,
      });
    }
    console.error("Get hotel detail error:", error);
    next(error);
  }
};

/**
 * GET /api/v1/hotels/:hotelId/rooms/availability
 * Check room availability for a specific hotel
 * @access Public (no auth required)
 */
const checkAvailability = async (req, res, next) => {
  try {
    const { hotelId } = req.params;
    const { check_in, check_out } = req.query;

    // Additional check for dates
    const today = new Date().toISOString().split("T")[0];
    if (check_in < today) {
      return sendError(res, {
        statusCode: 400,
        message: "check_in date cannot be in the past",
      });
    }

    if (check_out <= check_in) {
      return sendError(res, {
        statusCode: 400,
        message: "check_out date must be after check_in date",
      });
    }

    const availability = await hotelService.checkAvailability(
      hotelId,
      req.query
    );

    return sendSuccess(res, {
      statusCode: 200,
      message: "Availability checked successfully",
      data: availability,
    });
  } catch (error) {
    console.error("Check availability error:", error);
    next(error);
  }
};

module.exports = {
  listHotels,
  getHotelDetail,
  checkAvailability,
};
