const adminHotelService = require("../../services/admin/hotels.service");
const { sendSuccess, sendError } = require("../../utils/apiResponse");

/**
 * POST /api/v1/admin/hotels
 * Create a new hotel
 * Permission required: hotel.create or hotel.manage_all
 */
const createHotel = async (req, res, next) => {
  try {
    const {
      name,
      description,
      address,
      city,
      country,
      star_rating,
      contact_email,
      contact_phone,
      owner_id,
      slug,
    } = req.body;

    const hotelData = {
      name,
      owner_id,
    };

    // Optional fields
    if (description !== undefined) hotelData.description = description;
    if (address !== undefined) hotelData.address = address;
    if (city !== undefined) hotelData.city = city;
    if (country !== undefined) hotelData.country = country;
    if (star_rating !== undefined) hotelData.star_rating = star_rating;
    if (contact_email !== undefined) hotelData.contact_email = contact_email;
    if (contact_phone !== undefined) hotelData.contact_phone = contact_phone;
    if (slug !== undefined) hotelData.slug = slug;

    const hotel = await adminHotelService.createHotel(hotelData);

    return sendSuccess(res, {
      statusCode: 201,
      message: "Hotel created successfully",
      data: hotel,
    });
  } catch (error) {
    if (error.statusCode === 404) {
      return sendError(res, {
        statusCode: 404,
        message: error.message,
      });
    }
    if (error.statusCode === 400) {
      return sendError(res, {
        statusCode: 400,
        message: error.message,
      });
    }
    console.error("Create hotel error:", error);
    next(error);
  }
};

/**
 * GET /api/v1/admin/hotels
 * List all hotels with filters, search, sort, and pagination
 * Permission required: hotel.read_all
 */
const listHotels = async (req, res, next) => {
  try {
    const { hotels, meta } = await adminHotelService.listHotels(req.query);

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
 * PUT /api/v1/admin/hotels/:id
 * Update a hotel
 * Permission required: hotel.manage_own or hotel.manage_all
 */
const updateHotel = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.user_id;
    const userPermissions = req.user.permissions || [];

    const hotel = await adminHotelService.updateHotel(
      id,
      req.body,
      userId,
      userPermissions,
    );

    return sendSuccess(res, {
      statusCode: 200,
      message: "Hotel updated successfully",
      data: hotel,
    });
  } catch (error) {
    if (error.statusCode === 404) {
      return sendError(res, {
        statusCode: 404,
        message: error.message,
      });
    }
    if (error.statusCode === 403) {
      return sendError(res, {
        statusCode: 403,
        message: error.message,
      });
    }
    if (error.statusCode === 409) {
      return sendError(res, {
        statusCode: 409,
        message: error.message,
        errors: error.bookings,
      });
    }
    console.error("Update hotel error:", error);
    next(error);
  }
};

/**
 * DELETE /api/v1/admin/hotels/:id
 * Soft delete a hotel
 * Permission required: hotel.manage_all
 */
const deleteHotel = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await adminHotelService.deleteHotel(id);

    return sendSuccess(res, {
      statusCode: 200,
      message: result.message,
      data: { id: result.id },
    });
  } catch (error) {
    if (error.statusCode === 404) {
      return sendError(res, {
        statusCode: 404,
        message: error.message,
      });
    }
    if (error.statusCode === 409) {
      return sendError(res, {
        statusCode: 409,
        message: error.message,
        errors: error.bookings,
      });
    }
    console.error("Delete hotel error:", error);
    next(error);
  }
};

module.exports = {
  createHotel,
  listHotels,
  updateHotel,
  deleteHotel,
};
