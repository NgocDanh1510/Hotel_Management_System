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
 * GET /api/v1/bookings/:id
 * Get full booking detail.
 */
const getBookingDetail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const booking = await bookingService.getBookingDetail(id, req.user);

    return sendSuccess(res, {
      message: "Booking detail retrieved successfully",
      data: booking,
    });
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, {
        statusCode: error.statusCode,
        message: error.message,
      });
    }
    console.error("Get booking detail error:", error);
    next(error);
  }
};

/**
 * POST /api/v1/bookings/:id/cancel
 * Cancel a booking (user-facing).
 */
const cancelBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await bookingService.cancelBooking(id, req.user);

    return sendSuccess(res, {
      message: result.refund_triggered
        ? "Booking set to cancellation_pending — refund initiated"
        : "Booking cancelled successfully",
      data: result,
    });
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, {
        statusCode: error.statusCode,
        message: error.message,
      });
    }
    console.error("Cancel booking error:", error);
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
  getBookingDetail,
  cancelBooking,
  listMyBookings,
};
