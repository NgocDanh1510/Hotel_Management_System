const bookingService = require("../../services/booking.service");
const { sendSuccess, sendError } = require("../../utils/apiResponse");

/**
 * POST /api/v1/bookings
 * Create a booking for the authenticated user.
 */
const createBooking = async (req, res, next) => {
  try {
    const userId = req.user.user_id;
    const booking = await bookingService.createBooking(req.body, userId);

    return sendSuccess(res, {
      statusCode: 201,
      message: "Booking created successfully",
      data: { booking },
    });
  } catch (error) {
    // Known business errors: propagate with proper status code
    if (error.statusCode) {
      return sendError(res, {
        statusCode: error.statusCode,
        message: error.message,
      });
    }
    console.error("Create booking error:", error);
    next(error);
  }
};

/**
 * GET /api/v1/me/bookings
 * List all bookings for the authenticated user.
 */
const listMyBookings = async (req, res, next) => {
  try {
    const userId = req.user.user_id;
    const { bookings, meta } = await bookingService.listMyBookings(
      userId,
      req.query
    );

    return sendSuccess(res, {
      message: "Bookings retrieved successfully",
      data: bookings,
      meta,
    });
  } catch (error) {
    console.error("List my bookings error:", error);
    next(error);
  }
};

module.exports = {
  createBooking,
  listMyBookings,
};
