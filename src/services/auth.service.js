const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const {
  User,
  Role,
  UserRole,
  RolePermission,
  Permission,
  RefreshToken,
} = require("../models");
const jwtConfig = require("../config/jwt.config");

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

/**
 * Login user with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {object} { access_token, refresh_token, user }
 */
const loginUser = async (email, password) => {
  // 1. Find user by email with relations (user_roles → roles → role_permissions → permissions)
  const user = await User.findOne({
    where: { email },
    include: [
      {
        model: Role,
        through: { attributes: [] }, // Don't include join table attributes
        attributes: ["id", "name"],
        include: [
          {
            model: Permission,
            through: { attributes: [] }, // Don't include join table attributes
            attributes: ["id", "code", "module"],
          },
        ],
      },
    ],
  });

  if (!user) {
    const error = new Error("Email hoặc mật khẩu không chính xác");
    error.statusCode = 401;
    throw error;
  }

  // 2. Check account status (is_active and not deleted)
  if (!user.is_active) {
    const error = new Error("Tài khoản của bạn đã bị vô hiệu hóa");
    error.statusCode = 403;
    throw error;
  }

  if (user.deleted_at !== null) {
    const error = new Error("Tài khoản của bạn đã bị xóa");
    error.statusCode = 403;
    throw error;
  }

  // 3. Check if account is locked
  const now = new Date();
  if (user.locked_until && user.locked_until > now) {
    const error = new Error("Tài khoản đã bị khóa");
    error.statusCode = 423;
    error.locked_until = user.locked_until;
    throw error;
  }

  // 4. Compare password using bcrypt
  const isPasswordValid = await bcrypt.compare(password, user.password_hash);

  if (!isPasswordValid) {
    // 5a. Invalid password: increment failed_login_attempts
    let failedAttempts = user.failed_login_attempts + 1;
    let lockedUntil = null;

    // If failed attempts reach 5, lock account for 15 minutes
    if (failedAttempts >= 5) {
      lockedUntil = new Date(now.getTime() + 15 * 60 * 1000); // 15 minutes from now
    }

    await user.update({
      failed_login_attempts: failedAttempts,
      locked_until: lockedUntil,
    });

    if (failedAttempts >= 5) {
      const error = new Error(
        "Tài khoản đã bị khóa do đăng nhập sai quá nhiều lần",
      );
      error.statusCode = 423;
      error.locked_until = lockedUntil;
      throw error;
    }

    const error = new Error("Email hoặc mật khẩu không chính xác");
    error.statusCode = 401;
    throw error;
  }

  // 5f. Correct password: reset failed_login_attempts and locked_until
  await user.update({
    failed_login_attempts: 0,
    locked_until: null,
  });

  // 6. Create tokens
  // Extract roles and permissions from user
  const roles = user.Roles.map((role) => role.name);
  const permissions = [];
  user.Roles.forEach((role) => {
    if (role.Permissions) {
      role.Permissions.forEach((permission) => {
        if (!permissions.find((p) => p.code === permission.code)) {
          permissions.push({
            id: permission.id,
            code: permission.code,
            module: permission.module,
          });
        }
      });
    }
  });

  // Access token payload
  const accessTokenPayload = {
    user_id: user.id,
    email: user.email,
    roles,
    permissions: permissions.map((p) => p.code),
  };

  // Create access token (15 minutes)
  const accessToken = jwt.sign(accessTokenPayload, jwtConfig.ACCESS_SECRET, {
    expiresIn: jwtConfig.ACCESS_EXPIRES_IN,
  });

  // Create refresh token
  const refreshTokenValue = crypto.randomBytes(40).toString("hex");

  // Hash refresh token using SHA-256 before storing
  const tokenHash = crypto
    .createHash("sha256")
    .update(refreshTokenValue)
    .digest("hex");

  // Calculate expires_at (7 days from now)
  const expiresAt = new Date(now.getTime() + jwtConfig.REFRESH_EXPIRES_MS);

  // Save refresh token to database
  await RefreshToken.create({
    user_id: user.id,
    token_hash: tokenHash,
    expires_at: expiresAt,
  });

  // Return tokens and user info
  return {
    access_token: accessToken,
    refresh_token: refreshTokenValue, // Return unhashed value to client
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      roles,
      permissions: permissions.map((p) => ({ code: p.code, module: p.module })),
    },
    expires_in: 15 * 60, // 15 minutes in seconds
    refresh_expires_in: jwtConfig.REFRESH_EXPIRES_MS / 1000, // 7 days in seconds
  };
};

module.exports = {
  registerUser,
  loginUser,
};
