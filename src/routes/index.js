const express = require("express");
const router = express.Router();

const authController = require("../controllers/auth.controller");
const { authenticateToken } = require("../middlewares/auth.middleware");
const { validateSchema } = require("../middlewares/validate.middleware");
const updateProfileSchema = require("../validations/schemaJoi/updateProfile.validation");

const authRoutes = require("./auth.routes");
const adminRoutes = require("./admin");
const hotelRoutes = require("./hotel.routes");

router.use("/auth", authRoutes);
router.use("/admin", adminRoutes);
router.use("/hotels", hotelRoutes);

// Profile endpoints
router.get("/me", authenticateToken, authController.getProfile);
router.put(
  "/me",
  authenticateToken,
  validateSchema(updateProfileSchema),
  authController.updateProfile,
);

module.exports = router;
