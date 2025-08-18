const express = require("express");
const router = express.Router();

const adminUsersRoutes = require("./users.routes");

// Admin routes
router.use("/users", adminUsersRoutes);

module.exports = router;
