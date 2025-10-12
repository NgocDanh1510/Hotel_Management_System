const adminUserService = require("../../services/admin/users.service");
const { sendSuccess, sendError } = require("../../utils/apiResponse");

/**
 * PUT /api/v1/admin/users/:id/roles
 * Assign roles to a user
 * Permission required: user.manage, role.manage
 */
const assignRoles = async (req, res, next) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user.user_id;
    const { role_ids, role_names } = req.body;

    const result = await adminUserService.assignRoles(
      id,
      { role_ids, role_names },
      currentUserId,
    );

    return sendSuccess(res, {
      statusCode: 200,
      message: "Roles updated successfully",
      data: result,
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
    if (error.statusCode === 403) {
      return sendError(res, {
        statusCode: 403,
        message: error.message,
      });
    }
    console.error("Assign roles error:", error);
    next(error);
  }
};

/**
 * GET /api/v1/admin/users
 * List all users with filtering, searching, and pagination
 * Permission required: user.manage
 */
const listUsers = async (req, res, next) => {
  try {
    const { users, meta } = await adminUserService.listUsers(req.query);

    return sendSuccess(res, {
      statusCode: 200,
      message: "Get users successfully",
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
      return sendError(res, {
        statusCode: 404,
        message: "User not found",
      });
    }

    return sendSuccess(res, {
      statusCode: 200,
      message: "Get user detail successfully",
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
      return sendError(res, {
        statusCode: 404,
        message: "User not found",
      });
    }

    const { user, hasActiveBookings } = result;

    const message = hasActiveBookings
      ? "Update user successfully (cảnh báo: user có booking đang pending/confirmed/check_in)"
      : "Update user successfully";

    return sendSuccess(res, {
      statusCode: 200,
      message,
      data: user,
    });
  } catch (error) {
    if (error.statusCode === 400) {
      return sendError(res, {
        statusCode: 400,
        message: error.message,
      });
    }
    console.error("Update user error:", error);
    next(error);
  }
};

module.exports = {
  assignRoles,
  listUsers,
  getUserDetail,
  updateUser,
};
