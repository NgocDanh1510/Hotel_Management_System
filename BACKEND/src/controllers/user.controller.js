const bookingService = require("../services/booking.service");
const profileService = require("../services/profile.service");
const { sendError, sendSuccess } = require("../utils/apiResponse");

/**
 * GET /api/v1/user/
 * Get authenticated user's profile
 */
exports.getProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await profileService.getProfile(userId);

    return sendSuccess(res, {
      statusCode: 200,
      message: "User profile fetched successfully",
      data: user,
    });
  } catch (error) {
    if (error.statusCode == 404) {
      return sendError(res, { statusCode: 404, message: error.message });
    }
    console.error("Error fetching user profile:", error);
    next(error);
  }
};

/**
 * PUT /api/v1/user/
 * Update authenticated user's profile
 */
exports.updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const updatedUser = await profileService.updateProfile(userId, req.body);

    return sendSuccess(res, {
      statusCode: 200,
      message: "User profile updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    if (error.statusCode == 404) {
      return sendError(res, { statusCode: 404, message: error.message });
    }
    console.error("Error updating user profile:", error);
    next(error);
  }
};
/**
 * PUT /api/v1/user/password
 * Update authenticated user's password
 */
module.exports.updatePassword = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { current_password, new_password } = req.body;
    const result = await profileService.updatePassword(
      userId,
      current_password,
      new_password,
    );

    return sendSuccess(res, {
      statusCode: 200,
      message: "User password updated successfully",
      data: result,
    });
  } catch (error) {
    if (error.statusCode == 404) {
      return sendError(res, { statusCode: 404, message: error.message });
    }
    console.error("Error updating user password:", error);
    next(error);
  }
};
/**
 * PUT /api/v1/user/email
 * Update authenticated user's email
 */
module.exports.updateEmail = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const updatedUser = await profileService.updateEmail(
      userId,
      req.body.new_email,
    );

    return sendSuccess(res, {
      statusCode: 200,
      message: "User email updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    if (error.statusCode == 404) {
      return sendError(res, { statusCode: 404, message: error.message });
    }
    console.error("Error updating user email:", error);
    next(error);
  }
};

/**
 * GET /api/v1/user/bookings
 * List all bookings for the authenticated user.
 */
module.exports.listMyBookings = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { bookings, meta } = await bookingService.listMyBookings(
      userId,
      req.query,
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
