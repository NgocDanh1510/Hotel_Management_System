const express = require("express");
const router = express.Router();

const adminUsersRoutes = require("./users.routes");
const adminRolesRoutes = require("./roles.routes");

// Admin routes
router.use("/users", adminUsersRoutes);
router.use("/roles", adminRolesRoutes);

module.exports = router;
