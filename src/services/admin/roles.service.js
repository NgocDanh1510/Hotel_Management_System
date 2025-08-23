const {
  Role,
  Permission,
  RolePermission,
  User,
  UserRole,
} = require("../../models");
const { sequelize } = require("../../models");
const { Op } = require("sequelize");

/**
 * List all roles with filtering, searching, and pagination
 */
const listRoles = async (query) => {
  const {
    is_system,
    q,
    sort = "created_at",
    order = "DESC",
    page = 1,
    limit = 20,
  } = query;

  const where = {};

  if (is_system !== undefined) {
    where.is_system = is_system === "true" || is_system === true;
  }

  if (q) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${q}%` } },
      { description: { [Op.iLike]: `%${q}%` } },
    ];
  }

  const offset = (page - 1) * limit;

  const { count, rows } = await Role.findAndCountAll({
    where,
    order: [[sort, order]],
    limit: parseInt(limit),
    offset,
    distinct: true,
    raw: false,
  });

  // Get permission counts and user counts for each role
  const rolesWithCounts = await Promise.all(
    rows.map(async (role) => {
      const permissionCount = await RolePermission.count({
        where: { role_id: role.id },
      });

      const userCount = await UserRole.count({
        where: { role_id: role.id },
      });

      return {
        id: role.id,
        name: role.name,
        description: role.description,
        is_system: role.is_system,
        permission_count: permissionCount,
        user_count: userCount,
      };
    }),
  );

  const total = count;
  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;

  return {
    roles: rolesWithCounts,
    meta: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      has_next: hasNext,
    },
  };
};

/**
 * Get role detail with permissions
 */
const getRoleDetail = async (roleId) => {
  const role = await Role.findByPk(roleId, {
    include: {
      model: Permission,
      through: { attributes: [] },
      attributes: ["id", "code", "module"],
    },
  });

  if (!role) {
    const error = new Error("Role not found");
    error.statusCode = 404;
    throw error;
  }

  const userCount = await UserRole.count({
    where: { role_id: roleId },
  });

  return {
    id: role.id,
    name: role.name,
    description: role.description,
    is_system: role.is_system,
    permissions: role.Permissions || [],
    user_count: userCount,
  };
};

/**
 * Create new role
 */
const createRole = async (data) => {
  const { name, description } = data;

  // Check if role name already exists
  const existingRole = await Role.findOne({ where: { name } });
  if (existingRole) {
    const error = new Error("Role name already exists");
    error.statusCode = 409;
    throw error;
  }

  const role = await Role.create({
    name,
    description,
    is_system: false,
  });

  return {
    id: role.id,
    name: role.name,
    description: role.description,
    is_system: role.is_system,
  };
};

/**
 * Update role
 */
const updateRole = async (roleId, data) => {
  const role = await Role.findByPk(roleId);

  if (!role) {
    const error = new Error("Role not found");
    error.statusCode = 404;
    throw error;
  }

  // Block updating system roles
  if (role.is_system) {
    const error = new Error("Cannot modify system role");
    error.statusCode = 403;
    throw error;
  }

  const { name, description } = data;

  // Check if new name already exists
  if (name && name !== role.name) {
    const existingRole = await Role.findOne({ where: { name } });
    if (existingRole) {
      const error = new Error("Role name already exists");
      error.statusCode = 409;
      throw error;
    }
  }

  await role.update({
    ...(name && { name }),
    ...(description !== undefined && { description }),
  });

  return {
    id: role.id,
    name: role.name,
    description: role.description,
    is_system: role.is_system,
  };
};

/**
 * Delete role
 */
const deleteRole = async (roleId) => {
  const role = await Role.findByPk(roleId);

  if (!role) {
    const error = new Error("Role not found");
    error.statusCode = 404;
    throw error;
  }

  // Block deleting system roles
  if (role.is_system) {
    const error = new Error("Cannot delete system role");
    error.statusCode = 403;
    throw error;
  }

  // Check if role has users assigned
  const userCount = await UserRole.count({
    where: { role_id: roleId },
  });

  if (userCount > 0) {
    const error = new Error(
      `Cannot delete role with ${userCount} user(s) assigned`,
    );
    error.statusCode = 409;
    throw error;
  }

  // Delete all role permissions first
  await RolePermission.destroy({
    where: { role_id: roleId },
  });

  await role.destroy();

  return null;
};

/**
 * Assign permissions to role
 */
const assignPermissions = async (roleId, data) => {
  const { permission_ids, permission_codes } = data;

  const role = await Role.findByPk(roleId);

  if (!role) {
    const error = new Error("Role not found");
    error.statusCode = 404;
    throw error;
  }

  // Block assigning permissions to system roles
  if (role.is_system) {
    const error = new Error("Cannot modify permissions for system role");
    error.statusCode = 403;
    throw error;
  }

  let permIds = permission_ids || [];

  // If using permission codes, resolve them to IDs
  if (permission_codes && permission_codes.length > 0) {
    const permissions = await Permission.findAll({
      where: { code: { [Op.in]: permission_codes } },
      attributes: ["id"],
    });

    if (permissions.length !== permission_codes.length) {
      const error = new Error("One or more permission codes not found");
      error.statusCode = 400;
      throw error;
    }

    permIds = permissions.map((p) => p.id);
  }

  // Validate that all permission IDs exist
  if (permIds.length > 0) {
    const permissions = await Permission.findAll({
      where: { id: { [Op.in]: permIds } },
    });

    if (permissions.length !== permIds.length) {
      const error = new Error("One or more permissions not found");
      error.statusCode = 400;
      throw error;
    }
  }

  // Use transaction for atomic update
  const result = await sequelize.transaction(async (transaction) => {
    // Delete existing role permissions
    await RolePermission.destroy(
      { where: { role_id: roleId } },
      { transaction },
    );

    // Create new role permissions
    if (permIds.length > 0) {
      const rolePermissions = permIds.map((permId) => ({
        role_id: roleId,
        permission_id: permId,
      }));

      await RolePermission.bulkCreate(rolePermissions, { transaction });
    }

    // Fetch updated permissions
    const updatedRole = await Role.findByPk(roleId, {
      include: {
        model: Permission,
        through: { attributes: [] },
        attributes: ["id", "code", "module"],
      },
      transaction,
    });

    return updatedRole;
  });

  return {
    role_id: roleId,
    permissions: result.Permissions || [],
  };
};

module.exports = {
  listRoles,
  getRoleDetail,
  createRole,
  updateRole,
  deleteRole,
  assignPermissions,
};
