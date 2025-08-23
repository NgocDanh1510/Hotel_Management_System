const rolesService = require("../../services/admin/roles.service");
const { sendSuccess, sendError } = require("../../utils/apiResponse");

/**
 * GET /api/v1/admin/roles
 * List all roles with filtering, searching, and pagination
 * Permission required: role.manage
 */
const listRoles = async (req, res, next) => {
  try {
    const { roles, meta } = await rolesService.listRoles(req.query);

    return sendSuccess(res, {
      statusCode: 200,
      message: "Get roles successfully",
      data: roles,
      meta,
    });
  } catch (error) {
    console.error("List roles error:", error);
    next(error);
  }
};

/**
 * GET /api/v1/admin/roles/:id
 * Get role detail with permissions
 * Permission required: role.manage
 */
const getRoleDetail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const role = await rolesService.getRoleDetail(id);

    return sendSuccess(res, {
      statusCode: 200,
      message: "Get role detail successfully",
      data: role,
    });
  } catch (error) {
    if (error.statusCode === 404) {
      return sendError(res, {
        statusCode: 404,
        message: error.message,
      });
    }
    console.error("Get role detail error:", error);
    next(error);
  }
};

/**
 * POST /api/v1/admin/roles
 * Create new role
 * Permission required: role.manage
 */
const createRole = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const role = await rolesService.createRole({ name, description });

    return sendSuccess(res, {
      statusCode: 201,
      message: "Role created successfully",
      data: role,
    });
  } catch (error) {
    if (error.statusCode === 409) {
      return sendError(res, {
        statusCode: 409,
        message: error.message,
      });
    }
    console.error("Create role error:", error);
    next(error);
  }
};

/**
 * PUT /api/v1/admin/roles/:id
 * Update role
 * Permission required: role.manage
 */
const updateRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const role = await rolesService.updateRole(id, { name, description });

    return sendSuccess(res, {
      statusCode: 200,
      message: "Role updated successfully",
      data: role,
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
      });
    }
    console.error("Update role error:", error);
    next(error);
  }
};

/**
 * DELETE /api/v1/admin/roles/:id
 * Delete role
 * Permission required: role.manage
 */
const deleteRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    await rolesService.deleteRole(id);

    return sendSuccess(res, {
      statusCode: 200,
      message: "Role deleted successfully",
      data: null,
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
      });
    }
    console.error("Delete role error:", error);
    next(error);
  }
};

/**
 * PUT /api/v1/admin/roles/:id/permissions
 * Assign permissions to role
 * Permission required: role.manage + permission.manage
 */
const assignPermissions = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { permission_ids, permission_codes } = req.body;

    const result = await rolesService.assignPermissions(id, {
      permission_ids,
      permission_codes,
    });

    return sendSuccess(res, {
      statusCode: 200,
      message: "Permissions assigned successfully",
      data: result,
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
    if (error.statusCode === 400) {
      return sendError(res, {
        statusCode: 400,
        message: error.message,
      });
    }
    console.error("Assign permissions error:", error);
    next(error);
  }
};

module.exports = {
  listRoles,
  getRoleDetail,
  createRole,
  updateRole,
  deleteRole,
  assignPermissions,
};
