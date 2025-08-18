const express = require("express");
const router = express.Router();

const authRoutes = require("./auth.routes");
const adminRoutes = require("./admin");

router.use("/auth", authRoutes);
router.use("/admin", adminRoutes);

module.exports = router;
