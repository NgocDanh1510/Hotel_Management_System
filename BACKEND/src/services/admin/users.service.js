const { User, Role, Booking, Review, sequelize } = require("../../models");
const { Op } = require("sequelize");
const bcrypt = require("bcrypt");

/**
 * List all users with filtering, searching, and pagination
 * @param {Object} query - Query parameters
 * @returns {Promise<Object>} - Users, count and pagination info
 */
const listUsers = async (query) => {
  const {
    q,
    role_id,
    role_name,
    is_active,
    from,
    to,
    sort = "created_at",
    page = 1,
    limit = 10,
  } = query;

  // Parse page and limit
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 10));
  const offset = (pageNum - 1) * limitNum;

  // Build where clause
  const where = { deleted_at: null };

  if (q) {
    where[Op.or] = [
      { name: { [Op.like]: `%${q}%` } },
      { email: { [Op.like]: `%${q}%` } },
      { phone: { [Op.like]: `%${q}%` } },
    ];
  }

  if (is_active !== undefined) {
    where.is_active = is_active === "true" || is_active === true;
  }

  if (from || to) {
    where.created_at = {};
    if (from) {
      where.created_at[Op.gte] = new Date(from);
    }
    if (to) {
      where.created_at[Op.lte] = new Date(to);
    }
  }

  // Build include for roles
  const include = [
    {
      model: Role,
      through: { attributes: [] },
      attributes: ["id", "name"],
    },
  ];

  if (role_id || role_name) {
    include[0].where = {};
    if (role_id) {
      include[0].where.id = role_id;
    }
    if (role_name) {
      include[0].where.name = role_name;
    }
    include[0].required = true;
  }

  // Build order clause
  let orderBy = [["created_at", "desc"]];
  if (sort) {
    const sortParts = sort.split("_");
    const field = sortParts[0];
    const direction = sort.includes("desc") ? "desc" : "asc";

    if (field === "created") {
      orderBy = [["created_at", direction]];
    } else if (field === "name" || field === "email") {
      orderBy = [[field, direction]];
    }
  }

  const { count, rows } = await User.findAndCountAll({
    where,
    include,
    order: orderBy,
    limit: limitNum,
    offset: offset,
    distinct: true,
    attributes: ["id", "name", "email", "phone", "is_active", "created_at"],
    // subQuery: false,
  });

  const data = rows.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    is_active: user.is_active,
    roles: user.Roles.map((r) => ({ id: r.id, name: r.name })),
    created_at: user.created_at,
  }));

  const hasNext = offset + limitNum < count;

  return {
    users: data,
    meta: {
      total: count,
      page: pageNum,
      limit: limitNum,
      has_next: hasNext,
    },
  };
};

/**
 * Get user detail with stats
 * @param {string} id - User ID
 * @returns {Promise<Object>} - User details and stats
 */
const getUserDetail = async (id) => {
  const user = await User.findByPk(id, {
    include: [
      {
        model: Role,
        through: { attributes: [] },
        attributes: ["id", "name"],
      },
    ],
    attributes: ["id", "name", "email", "phone", "is_active", "created_at"],
  });

  if (!user) {
    return null;
  }

  const bookings = await Booking.findAll({
    where: { user_id: id },
    attributes: ["id", "total_price", "status", "created_at"],
    raw: true,
  });

  const totalBookings = bookings.length;
  const totalSpent =
    bookings
      .filter((b) => b.status === "checked_out")
      .reduce((sum, b) => sum + parseFloat(b.total_price || 0), 0) || 0;
  const lastBookingAt =
    bookings.length > 0
      ? new Date(Math.max(...bookings.map((b) => new Date(b.created_at))))
      : null;

  const reviews = await Review.findAll({
    where: { user_id: id },
    attributes: ["rating_overall"],
    raw: true,
  });

  const avgRatingGiven =
    reviews.length > 0
      ? (
          reviews.reduce((sum, r) => sum + (r.rating_overall || 0), 0) /
          reviews.length
        ).toFixed(2)
      : null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    is_active: user.is_active,
    roles: user.Roles.map((r) => ({ id: r.id, name: r.name })),
    created_at: user.created_at,
    stats: {
      total_bookings: totalBookings,
      total_spent: parseFloat(totalSpent),
      last_booking_at: lastBookingAt,
      avg_rating_given: avgRatingGiven ? parseFloat(avgRatingGiven) : null,
    },
  };
};

/**
 * Create a new user
 * @param {Object} userData - User data (name, email, phone, password, role_ids)
 * @param {string} currentUserId - ID of the admin performing the creation
 * @returns {Promise<Object>} - Created user details
 */
const createUser = async (userData, currentUserId) => {
  const { name, email, phone, password, role_ids } = userData;

  // Check if email already exists
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    const error = new Error("Email đã tồn tại");
    error.statusCode = 400;
    throw error;
  }
  const hashedPassword = await bcrypt.hash(password, 12);

  // Create user
  const newUser = await User.create({
    name,
    email,
    phone,
    password_hash: hashedPassword,
    is_active: true,
    failed_login_attempts: 0,
    locked_until: null,
  });

  // Assign roles if provided
  if (role_ids && role_ids.length > 0) {
    const roles = await Role.findAll({
      where: { id: role_ids },
      attributes: ["id", "name"],
    });

    if (roles.length !== role_ids.length) {
      const error = new Error("One or more roles do not exist");
      error.statusCode = 400;
      throw error;
    }

    await newUser.addRoles(roles);
  }

  // Fetch created user with roles
  const createdUser = await User.findByPk(newUser.id, {
    include: [
      {
        model: Role,
        through: { attributes: [] },
        attributes: ["id", "name"],
      },
    ],
    attributes: ["id", "name", "email", "phone", "is_active", "created_at"],
  });

  return {
    id: createdUser.id,
    name: createdUser.name,
    email: createdUser.email,
    phone: createdUser.phone,
    is_active: createdUser.is_active,
    roles: createdUser.Roles.map((r) => ({ id: r.id, name: r.name })),
    created_at: createdUser.created_at,
  };
};

/**
 * Update user profile
 * @param {string} id - User ID
 * @param {Object} updateData - Data to update
 * @param {string} currentUserId - ID of the admin performing the update
 * @returns {Promise<Object>} - Updated user and warning flag
 */
const updateUser = async (id, updateData, currentUserId) => {
  const { is_active, name, phone } = updateData;

  // Validation: cannot deactivate self
  if (id === currentUserId && is_active === false) {
    const error = new Error("Không thể deactivate chính mình");
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findByPk(id);
  if (!user) {
    return null;
  }

  // Check for active bookings if deactivating
  let hasActiveBookings = false;
  if (is_active === false && user.is_active === true) {
    const activeBookings = await Booking.count({
      where: {
        user_id: id,
        status: { [Op.in]: ["pending", "confirmed", "checked_in"] },
      },
    });
    hasActiveBookings = activeBookings > 0;
  }

  const dataToUpdate = {};
  if (name !== undefined) dataToUpdate.name = name;
  if (phone !== undefined) dataToUpdate.phone = phone;
  if (is_active !== undefined) dataToUpdate.is_active = is_active;

  await user.update(dataToUpdate);

  const updatedUser = await User.findByPk(id, {
    include: [
      {
        model: Role,
        through: { attributes: [] },
        attributes: ["id", "name"],
      },
    ],
    attributes: ["id", "name", "email", "phone", "is_active"],
  });

  return {
    user: {
      id: updatedUser.id,
      name: updatedUser.name,
      phone: updatedUser.phone,
      is_active: updatedUser.is_active,
      roles: updatedUser.Roles.map((r) => ({ id: r.id, name: r.name })),
    },
    hasActiveBookings,
  };
};

/**
 * Assign roles to a user
 * @param {string} targetUserId - User ID to assign roles to
 * @param {Object} roleData - Either { role_ids: string[] } or { role_names: string[] }
 * @param {string} currentUserId - ID of the admin performing the assignment
 * @returns {Promise<Object>} - Updated user with roles
 */
const assignRoles = async (targetUserId, roleData, currentUserId) => {
  const { role_ids } = roleData;

  // Get target user with current roles
  const targetUser = await User.findByPk(targetUserId, {
    include: [
      {
        model: Role,
        through: { attributes: [] },
        attributes: ["id", "name"],
      },
    ],
  });

  if (!targetUser) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  // Fetch roles from DB
  let rolesToAssign;
  if (role_ids && role_ids.length > 0) {
    rolesToAssign = await Role.findAll({
      where: { id: role_ids },
      attributes: ["id", "name"],
    });

    if (rolesToAssign.length !== role_ids.length) {
      const error = new Error("One or more roles do not exist");
      error.statusCode = 400;
      throw error;
    }
  } else {
    rolesToAssign = [];
  }

  // Check if user is trying to remove all roles from themselves
  if (targetUserId === currentUserId && rolesToAssign.length === 0) {
    const error = new Error("Cannot remove all roles from yourself");
    error.statusCode = 403;
    throw error;
  }

  // Check if user is trying to remove admin role from themselves
  const currentUserRoles = targetUser.Roles.map((r) => r.name);
  const newRoleNames = rolesToAssign.map((r) => r.name);
  if (
    targetUserId === currentUserId &&
    currentUserRoles.includes("admin") &&
    !newRoleNames.includes("admin")
  ) {
    const error = new Error("Cannot remove admin role from yourself");
    error.statusCode = 403;
    throw error;
  }

  // Use transaction for atomicity
  const transaction = await sequelize.transaction();

  try {
    // Get current role IDs
    const currentRoleIds = targetUser.Roles.map((r) => r.id);

    // Remove old roles
    await targetUser.removeRoles(currentRoleIds, { transaction });

    // Add new roles
    await targetUser.addRoles(rolesToAssign, { transaction });

    await transaction.commit();

    // Fetch updated user with roles
    const updatedUser = await User.findByPk(targetUserId, {
      include: [
        {
          model: Role,
          through: { attributes: [] },
          attributes: ["id", "name"],
        },
      ],
      attributes: ["id", "updated_at"],
    });

    return {
      user_id: updatedUser.id,
      roles: updatedUser.Roles.map((r) => ({ id: r.id, name: r.name })),
      updated_by: currentUserId,
      updated_at: updatedUser.updated_at,
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};
//[DELETE] /api/v1/admin/users/delete/:id
//Soft delete a user (set deleted_at)
const deleteUser = async (id, currentUserId) => {
  if (String(id) === String(currentUserId)) {
    const error = new Error("Cannot delete yourself");
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findOne({
    where: {
      id,
      deleted_at: null,
    },
  });

  if (!user) {
    const error = new Error("User not found or already deleted");
    error.statusCode = 404;
    throw error;
  }

  await user.destroy();

  return user;
};

module.exports = {
  listUsers,
  getUserDetail,
  updateUser,
  assignRoles,
  deleteUser,
  createUser,
};
