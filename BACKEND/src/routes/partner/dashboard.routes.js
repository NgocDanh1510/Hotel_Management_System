const express = require("express");
const router = express.Router();
const partnerDashboardController = require("../../controllers/partner/dashboard.controller");
const { authenticateToken, requirePermission } = require("../../middlewares/auth.middleware");

router.use(authenticateToken);

router.get(
  "/",
  requirePermission("dashboard.read"),
  partnerDashboardController.getDashboard,
);

module.exports = router;
