const express = require("express");
const router = express.Router();

const adminUsersRoutes = require("./users.routes");
const adminRolesRoutes = require("./roles.routes");
const adminPermissionsRoutes = require("./permissions.routes");

// Admin routes
router.use("/users", adminUsersRoutes);
router.use("/roles", adminRolesRoutes);
router.use("/permissions", adminPermissionsRoutes);

module.exports = router;
