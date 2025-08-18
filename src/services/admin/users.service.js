const { User, Role, Booking, Review, sequelize } = require("../../models");
const { Op } = require("sequelize");

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
  const where = {};

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
    subQuery: false,
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

module.exports = {
  listUsers,
  getUserDetail,
  updateUser,
};
