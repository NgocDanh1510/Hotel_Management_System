const partnerBookingService = require("../../services/partner/booking.service");
const { sendSuccess, sendError } = require("../../utils/apiResponse");

const listBookings = async (req, res, next) => {
  try {
    const { bookings, meta } = await partnerBookingService.listBookings(
      req.query,
      req.user,
    );

    return sendSuccess(res, {
      message: "Bookings retrieved successfully",
      data: bookings,
      meta,
    });
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, {
        statusCode: error.statusCode,
        message: error.message,
      });
    }
    console.error("Partner list bookings error:", error);
    next(error);
  }
};

const getBookingDetail = async (req, res, next) => {
  try {
    const booking = await partnerBookingService.getBookingDetail(
      req.params.id,
      req.user,
    );

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
    console.error("Partner get booking detail error:", error);
    next(error);
  }
};

const getBookingInvoice = async (req, res, next) => {
  try {
    const invoice = await partnerBookingService.getBookingInvoice(
      req.params.id,
      req.user,
    );

    return sendSuccess(res, {
      message: "Booking invoice retrieved successfully",
      data: invoice,
    });
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, {
        statusCode: error.statusCode,
        message: error.message,
      });
    }
    console.error("Partner get booking invoice error:", error);
    next(error);
  }
};

const cancelBooking = async (req, res, next) => {
  try {
    const result = await partnerBookingService.cancelBooking(req.params.id, req.user);

    return sendSuccess(res, {
      message: result.refund_triggered
        ? "Booking set to cancellation_pending and refund initiated"
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
    console.error("Partner cancel booking error:", error);
    next(error);
  }
};

const updateBookingStatus = async (req, res, next) => {
  try {
    const result = await partnerBookingService.updateBookingStatus(
      req.params.id,
      req.body.status,
      req.user,
    );

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
    console.error("Partner update booking status error:", error);
    next(error);
  }
};

const setNoShow = async (req, res, next) => {
  try {
    const result = await partnerBookingService.setNoShow(req.params.id, req.user);

    return sendSuccess(res, {
      message: "Booking marked as no-show successfully",
      data: result,
    });
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, {
        statusCode: error.statusCode,
        message: error.message,
      });
    }
    console.error("Partner set booking no-show error:", error);
    next(error);
  }
};

module.exports = {
  listBookings,
  getBookingDetail,
  getBookingInvoice,
  cancelBooking,
  updateBookingStatus,
  setNoShow,
};
