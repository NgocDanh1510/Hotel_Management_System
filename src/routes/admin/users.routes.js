const express = require("express");
const router = express.Router();
const adminUsersController = require("../../controllers/admin/users.controller");
const {
  authenticateToken,
  requirePermission,
} = require("../../middlewares/auth.middleware");
const validate = require("../../middlewares/validate.middleware");
const updateUserSchema = require("../../validations/schemaJoi/admin/updateUser.validation");

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
 * PUT /api/v1/admin/users/:id
 * Update user (is_active, name, phone)
 */
router.put("/:id", validate(updateUserSchema), adminUsersController.updateUser);

module.exports = router;
