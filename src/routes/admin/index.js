const express = require("express");
const router = express.Router();

const adminUsersRoutes = require("./users.routes");
const adminRolesRoutes = require("./roles.routes");
const adminPermissionsRoutes = require("./permissions.routes");
const adminHotelsRoutes = require("./hotels.routes");

// Admin routes
router.use("/users", adminUsersRoutes);
router.use("/roles", adminRolesRoutes);
router.use("/permissions", adminPermissionsRoutes);
router.use("/hotels", adminHotelsRoutes);

module.exports = router;
