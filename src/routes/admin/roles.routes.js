const express = require("express");
const router = express.Router();
const rolesController = require("../../controllers/admin/roles.controller");
const { authenticate } = require("../../middlewares/auth.middleware");
const {
  validateRequest,
  validateSchema,
} = require("../../middlewares/validate.middleware");
const {
  createRoleSchema,
  updateRoleSchema,
  assignPermissionsSchema,
} = require("../../validations/schemaJoi/admin/roles.validation");

router.use(authenticate);

router.get("/", rolesController.listRoles);

router.post("/", validateSchema(createRoleSchema), rolesController.createRole);

router.get("/:id", rolesController.getRoleDetail);

router.put(
  "/:id",
  validateSchema(updateRoleSchema),
  rolesController.updateRole,
);

router.delete("/:id", rolesController.deleteRole);

router.put(
  "/:id/permissions",
  validateSchema(assignPermissionsSchema),
  rolesController.assignPermissions,
);

module.exports = router;
