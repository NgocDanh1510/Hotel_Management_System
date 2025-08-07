const bcrypt = require("bcrypt");
const { User, Role, UserRole } = require("../models");

const registerUser = async (userData) => {
  const { email, password, name, phone } = userData;

  // Check if email exists (including paranoid/soft-deleted records)
  const existingUser = await User.findOne({
    where: { email },
    paranoid: false, // Include soft-deleted records
  });

  if (existingUser) {
    const error = new Error("Email đã được đăng ký");
    error.statusCode = 409;
    throw error;
  }

  // Hash password
  const saltRounds = 12;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  // Create user
  const newUser = await User.create({
    name,
    email,
    password_hash: passwordHash,
    phone,
    is_active: true,
    failed_login_attempts: 0,
    locked_until: null,
  });

  // Sau khi tạo user, query role 'guest'
  const guestRole = await Role.findOne({ where: { name: "guest" } });

  if (!guestRole) {
    console.warn("Không tìm thấy role 'guest' trong database.");
    const error = new Error("Không tìm thấy role 'guest'");
    error.statusCode = 500;
    throw error;
  }

  // Assign 'guest' role
  await UserRole.create({
    user_id: newUser.id,
    role_id: guestRole.id,
  });

  // Return response
  return {
    user: {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      phone: newUser.phone,
      created_at: newUser.created_at,
    },
    roles: ["guest"],
  };
};

module.exports = {
  registerUser,
};
