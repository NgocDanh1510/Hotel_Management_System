const permissionsService = require("../../services/admin/permissions.service");
const { sendSuccess, sendError } = require("../../utils/apiResponse");

/**
 * GET /api/v1/admin/permissions
 * List all permissions with filtering, searching, and pagination
 * Permission required: permission.read
 */
const listPermissions = async (req, res, next) => {
  try {
    const { permissions, meta } = await permissionsService.listPermissions(
      req.query,
    );

    return sendSuccess(res, {
      statusCode: 200,
      message: "Get permissions successfully",
      data: permissions,
      meta,
    });
  } catch (error) {
    console.error("List permissions error:", error);
    next(error);
  }
};

/**
 * GET /api/v1/admin/permissions/:id
 * Get permission detail
 * Permission required: permission.read
 */
const getPermissionDetail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const permission = await permissionsService.getPermissionDetail(id);

    return sendSuccess(res, {
      statusCode: 200,
      message: "Get permission detail successfully",
      data: permission,
    });
  } catch (error) {
    if (error.statusCode === 404) {
      return sendError(res, {
        statusCode: 404,
        message: error.message,
      });
    }
    console.error("Get permission detail error:", error);
    next(error);
  }
};

/**
 * PUT /api/v1/admin/permissions/:id
 * Update permission (code is immutable)
 * Permission required: permission.manage
 */
const updatePermission = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { description, module } = req.body;
    const permission = await permissionsService.updatePermission(id, {
      description,
      module,
    });

    return sendSuccess(res, {
      statusCode: 200,
      message: "Permission updated successfully",
      data: permission,
    });
  } catch (error) {
    if (error.statusCode === 404) {
      return sendError(res, {
        statusCode: 404,
        message: error.message,
      });
    }
    console.error("Update permission error:", error);
    next(error);
  }
};

module.exports = {
  listPermissions,
  getPermissionDetail,
  updatePermission,
};
