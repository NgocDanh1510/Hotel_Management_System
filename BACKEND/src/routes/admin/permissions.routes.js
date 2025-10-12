const express = require("express");
const router = express.Router();
const permissionsController = require("../../controllers/admin/permissions.controller");
const {
  authenticate,
  requirePermission,
} = require("../../middlewares/auth.middleware");
const { validateSchema } = require("../../middlewares/validate.middleware");
const {
  updatePermissionSchema,
} = require("../../validations/schemaJoi/admin/permissions.validation");

// Apply authentication
router.use(authenticate);
router.use(requirePermission("permission.read"));

router.get("/", permissionsController.listPermissions);

router.get("/:id", permissionsController.getPermissionDetail);

router.use(requirePermission("permission.manage"));
router.put(
  "/:id",
  validateSchema(updatePermissionSchema),
  permissionsController.updatePermission,
);

module.exports = router;
