const bcrypt = require("bcrypt");
const { User, Role, Booking } = require("../models");
const { Op } = require("sequelize");

/**
 * Get current user profile
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - User profile with roles and booking summary
 */
const getProfile = async (userId) => {
  const user = await User.findByPk(userId, {
    include: [
      {
        model: Role,
        through: { attributes: [] },
        attributes: ["id", "name"],
      },
    ],
    attributes: ["id", "name", "email", "phone"],
  });

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  // Get booking summary
  const bookings = await Booking.findAll({
    where: { user_id: userId },
    attributes: ["status", "check_out"],
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const total = bookings.length;
  const upcoming = bookings.filter((b) => {
    const checkOut = new Date(b.check_out);
    return checkOut >= today && b.status !== "cancelled";
  }).length;
  const completed = bookings.filter((b) => b.status === "checked_out").length;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    roles: user.Roles.map((r) => ({ id: r.id, name: r.name })),
    booking_summary: {
      total,
      upcoming,
      completed,
    },
  };
};

/**
 * Update user profile
 * @param {string} userId - User ID
 * @param {Object} updateData - Data to update { name?, phone?, current_password?, new_password? }
 * @returns {Promise<Object>} - Updated user profile
 */
const updateProfile = async (userId, updateData) => {
  const { name, phone } = updateData;

  const user = await User.findByPk(userId);

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  const dataToUpdate = {};

  // Update name if provided
  if (name !== undefined) {
    dataToUpdate.name = name;
  }

  // Update phone if provided
  if (phone !== undefined) {
    dataToUpdate.phone = phone;
  }

  // Update user
  await user.update(dataToUpdate);

  // Fetch updated user
  const updatedUser = await User.findByPk(userId, {
    attributes: ["id", "name", "email", "phone", "updated_at"],
  });

  return {
    user: {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      updated_at: updatedUser.updated_at,
    },
  };
};

/**
 * Update password
 * @param {string} userId - User ID
 * @param {Object} updateData - Data to update { current_password, new_password }
 * @returns {Promise<Object>} - Updated user profile
 */
const updatePassword = async (userId, updateData) => {
  const { current_password, new_password } = updateData;

  const user = await User.findByPk(userId, {
    attributes: ["id", "password_hash"],
  });

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  if (!current_password || !new_password) {
    const error = new Error("Current password and new password are required");
    error.statusCode = 400;
    throw error;
  }

  // Verify current password
  const isPasswordValid = await bcrypt.compare(
    current_password,
    user.password_hash,
  );

  if (!isPasswordValid) {
    const error = new Error("Current password is incorrect");
    error.statusCode = 400;
    throw error;
  }

  // Hash new password
  const saltRounds = 12;
  const passwordHash = await bcrypt.hash(new_password, saltRounds);

  // Update user
  await user.update({ password_hash: passwordHash });

  return {
    message: "Password updated successfully",
  };
};

module.exports = {
  getProfile,
  updateProfile,
  updatePassword,
};
