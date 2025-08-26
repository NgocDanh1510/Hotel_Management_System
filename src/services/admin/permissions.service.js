const { Permission, RolePermission } = require("../../models");
const { Op } = require("sequelize");

class PermissionService {
  /**
   * List all permissions with filtering, searching, and pagination
   */
  async listPermissions(query) {
    const {
      module,
      q,
      sort = "module",
      order = "ASC",
      page = 1,
      limit = 50,
    } = query;

    const where = {};

    if (module) {
      where.module = module;
    }

    if (q) {
      where[Op.or] = [
        { code: { [Op.iLike]: `%${q}%` } },
        { description: { [Op.iLike]: `%${q}%` } },
      ];
    }

    // Validate sort field
    const validSortFields = ["module", "code", "created_at"];
    const sortField = validSortFields.includes(sort) ? sort : "module";

    const offset = (page - 1) * limit;

    const { count, rows } = await Permission.findAndCountAll({
      where,
      order: [[sortField, order]],
      limit: parseInt(limit),
      offset,
      distinct: true,
      raw: false,
    });

    // Get role counts for each permission
    const permissionsWithCounts = await Promise.all(
      rows.map(async (permission) => {
        const roleCount = await RolePermission.count({
          where: { permission_id: permission.id },
        });

        return {
          id: permission.id,
          code: permission.code,
          module: permission.module,
          description: permission.description,
          role_count: roleCount,
        };
      }),
    );

    const total = count;
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;

    return {
      permissions: permissionsWithCounts,
      meta: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        has_next: hasNext,
      },
    };
  }

  /**
   * Get permission detail
   */
  async getPermissionDetail(permissionId) {
    const permission = await Permission.findByPk(permissionId);

    if (!permission) {
      const error = new Error("Permission not found");
      error.statusCode = 404;
      throw error;
    }

    const roleCount = await RolePermission.count({
      where: { permission_id: permissionId },
    });

    return {
      id: permission.id,
      code: permission.code,
      module: permission.module,
      description: permission.description,
      role_count: roleCount,
    };
  }

  /**
   * Update permission (code is immutable)
   */
  async updatePermission(permissionId, data) {
    const permission = await Permission.findByPk(permissionId);

    if (!permission) {
      const error = new Error("Permission not found");
      error.statusCode = 404;
      throw error;
    }

    const { description, module } = data;

    // Update only allowed fields (code is immutable)
    await permission.update({
      ...(description !== undefined && { description }),
      ...(module && { module }),
    });

    return {
      id: permission.id,
      code: permission.code,
      module: permission.module,
      description: permission.description,
    };
  }
}

module.exports = new PermissionService();
