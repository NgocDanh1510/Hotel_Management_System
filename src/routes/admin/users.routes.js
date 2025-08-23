const express = require("express");
const router = express.Router();
const adminUsersController = require("../../controllers/admin/users.controller");
const {
  authenticateToken,
  requirePermission,
} = require("../../middlewares/auth.middleware");
const { validateSchema } = require("../../middlewares/validate.middleware");
const updateUserSchema = require("../../validations/schemaJoi/admin/updateUser.validation");
const assignRolesSchema = require("../../validations/schemaJoi/admin/assignRoles.validation");

// All routes require authentication and user.manage permission
router.use(authenticateToken);
router.use(requirePermission("user.manage"));

/**
 * GET /api/v1/admin/users
 * List all users with filtering, searching, and pagination
 */
router.get("/", adminUsersController.listUsers);

/**
 * GET /api/v1/admin/users/:id
 * Get user detail with stats
 */
router.get("/:id", adminUsersController.getUserDetail);

/**
 * PUT /api/v1/admin/users/:id/roles
 * Assign roles to a user
 * Additional permission required: role.manage
 */
router.put(
  "/:id/roles",
  requirePermission("role.manage"),
  validateSchema(assignRolesSchema),
  adminUsersController.assignRoles,
);

/**
 * PUT /api/v1/admin/users/:id
 * Update user (is_active, name, phone)
 */
router.put(
  "/:id",
  validateSchema(updateUserSchema),
  adminUsersController.updateUser,
);

module.exports = router;
