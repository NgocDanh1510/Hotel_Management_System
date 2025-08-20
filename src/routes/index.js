const express = require("express");
const router = express.Router();

const authController = require("../controllers/auth.controller");
const { authenticateToken } = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validate.middleware");
const updateProfileSchema = require("../validations/schemaJoi/updateProfile.validation");

const authRoutes = require("./auth.routes");
const adminRoutes = require("./admin");

router.use("/auth", authRoutes);
router.use("/admin", adminRoutes);

// Profile endpoints
router.get("/me", authenticateToken, authController.getProfile);
router.put(
  "/me",
  authenticateToken,
  validate(updateProfileSchema),
  authController.updateProfile,
);

module.exports = router;
