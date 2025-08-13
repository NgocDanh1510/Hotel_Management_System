const jwt = require("jsonwebtoken");
const jwtConfig = require("../config/jwt.config");

/**
 * Middleware to verify access token from Authorization header
 * Extracts token from "Authorization: Bearer <token>"
 * Attaches decoded user info to req.user
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Extract token after "Bearer "

  if (!token) {
    return res.status(401).json({ message: "Không tìm thấy access token" });
  }

  jwt.verify(token, jwtConfig.ACCESS_SECRET, (err, decoded) => {
    if (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({ message: "Access token đã hết hạn" });
      }
      return res.status(403).json({ message: "Access token không hợp lệ" });
    }

    // Attach decoded user info to req
    req.user = decoded;
    next();
  });
};

/**
 * Middleware factory: Require specific permission
 * @param {string} permissionCode - Permission code to check (e.g., 'hotel.read', 'hotel.create')
 * @returns {Function} Middleware function
 */
const requirePermission = (permissionCode) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Không tìm thấy access token" });
    }

    const userPermissions = req.user.permissions || [];

    if (!userPermissions.includes(permissionCode)) {
      return res.status(403).json({
        message: "Insufficient permissions",
        required: permissionCode,
      });
    }

    next();
  };
};

/**
 * Middleware factory: Require at least one permission from the list
 * @param {Array<string>} permissionCodes - Array of permission codes
 * @returns {Function} Middleware function
 */
const requireAnyPermission = (permissionCodes) => {
  if (!Array.isArray(permissionCodes) || permissionCodes.length === 0) {
    throw new Error(
      "requireAnyPermission requires non-empty array of permission codes",
    );
  }

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Không tìm thấy access token" });
    }

    const userPermissions = req.user.permissions || [];
    const hasAnyPermission = permissionCodes.some((code) =>
      userPermissions.includes(code),
    );

    if (!hasAnyPermission) {
      return res.status(403).json({
        message: "Insufficient permissions",
        required: permissionCodes,
      });
    }

    next();
  };
};

/**
 * Middleware factory: Require all permissions from the list
 * @param {Array<string>} permissionCodes - Array of permission codes
 * @returns {Function} Middleware function
 */
const requireAllPermissions = (permissionCodes) => {
  if (!Array.isArray(permissionCodes) || permissionCodes.length === 0) {
    throw new Error(
      "requireAllPermissions requires non-empty array of permission codes",
    );
  }

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Không tìm thấy access token" });
    }

    const userPermissions = req.user.permissions || [];
    const missingPermissions = permissionCodes.filter(
      (code) => !userPermissions.includes(code),
    );

    if (missingPermissions.length > 0) {
      return res.status(403).json({
        message: "Insufficient permissions",
        missing: missingPermissions,
      });
    }

    next();
  };
};

/**
 * Helper function: Check if user owns the resource
 * @param {string} resourceOwnerId - ID of the resource owner
 * @param {string} requestUserId - ID of the requesting user
 * @returns {boolean} True if user owns the resource
 */
const isOwner = (resourceOwnerId, requestUserId) => {
  return String(resourceOwnerId) === String(requestUserId);
};

/**
 * Middleware factory: Require permission OR ownership
 * Used for cases like 'hotel.manage_own' where you can manage your own resource
 * @param {string} permissionCode - Permission code for admin access
 * @param {string} resourceOwnerIdField - Field name to get owner ID from (e.g., 'hotel_id', 'user_id')
 * @returns {Function} Middleware function
 */
const requirePermissionOrOwnership = (permissionCode, resourceOwnerIdField) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Không tìm thấy access token" });
    }

    const userPermissions = req.user.permissions || [];
    const userId = req.user.user_id;

    // Check if user has explicit permission (admin)
    if (userPermissions.includes(permissionCode)) {
      return next();
    }

    // Check if user is the owner of the resource
    // Get owner ID from request (could be from params, body, or query)
    const resourceOwnerId =
      req.params[resourceOwnerIdField] ||
      req.body[resourceOwnerIdField] ||
      req.query[resourceOwnerIdField];

    if (resourceOwnerId && isOwner(resourceOwnerId, userId)) {
      return next();
    }

    return res.status(403).json({
      message: "Insufficient permissions or you do not own this resource",
      required: permissionCode,
    });
  };
};

module.exports = {
  authenticateToken,
  requirePermission,
  requireAnyPermission,
  requireAllPermissions,
  requirePermissionOrOwnership,
  isOwner,
};
