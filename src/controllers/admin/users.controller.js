const adminUserService = require("../../services/admin/users.service");

/**
 * GET /api/v1/admin/users
 * List all users with filtering, searching, and pagination
 * Permission required: user.manage
 */
const listUsers = async (req, res, next) => {
  try {
    const { users, meta } = await adminUserService.listUsers(req.query);

    return res.status(200).json({
      message: "Get users successfully",
      statusCode: 200,
      data: users,
      meta,
    });
  } catch (error) {
    console.error("List users error:", error);
    next(error);
  }
};

/**
 * GET /api/v1/admin/users/:id
 * Get user detail with stats
 * Permission required: user.manage
 */
const getUserDetail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await adminUserService.getUserDetail(id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
        statusCode: 404,
        data: null,
      });
    }

    return res.status(200).json({
      message: "Get user detail successfully",
      statusCode: 200,
      data: user,
    });
  } catch (error) {
    console.error("Get user detail error:", error);
    next(error);
  }
};

/**
 * PUT /api/v1/admin/users/:id
 * Update user (is_active, name, phone)
 * Permission required: user.manage
 */
const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { is_active, name, phone } = req.body;
    const currentUserId = req.user.user_id;

    const result = await adminUserService.updateUser(
      id,
      { is_active, name, phone },
      currentUserId,
    );

    if (!result) {
      return res.status(404).json({
        message: "User not found",
        statusCode: 404,
        data: null,
      });
    }

    const { user, hasActiveBookings } = result;

    const message = hasActiveBookings
      ? "Update user successfully (cảnh báo: user có booking đang pending/confirmed/check_in)"
      : "Update user successfully";

    return res.status(200).json({
      message,
      statusCode: 200,
      data: user,
    });
  } catch (error) {
    if (error.statusCode === 400) {
      return res.status(400).json({
        message: error.message,
        statusCode: 400,
        data: null,
      });
    }
    console.error("Update user error:", error);
    next(error);
  }
};

module.exports = {
  listUsers,
  getUserDetail,
  updateUser,
};
