const bookingService = require("../../services/booking.service");
const { sendSuccess, sendError } = require("../../utils/apiResponse");

/**
 * GET /api/v1/admin/bookings
 * List all bookings (admin).
 */
const listAllBookings = async (req, res, next) => {
  try {
    const { bookings, meta } = await bookingService.listAllBookings(req.query);

    return sendSuccess(res, {
      message: "Bookings retrieved successfully",
      data: bookings,
      meta,
    });
  } catch (error) {
    console.error("Admin list bookings error:", error);
    next(error);
  }
};

/**
 * PATCH /api/v1/admin/bookings/:id/status
 * Update booking status (admin).
 */
const updateBookingStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const result = await bookingService.updateBookingStatus(id, status, req.user);

    return sendSuccess(res, {
      message: `Booking status updated to '${result.status}'`,
      data: result,
    });
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, {
        statusCode: error.statusCode,
        message: error.message,
      });
    }
    console.error("Admin update booking status error:", error);
    next(error);
  }
};

module.exports = {
  listAllBookings,
  updateBookingStatus,
};
