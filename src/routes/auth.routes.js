const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const { authenticateToken } = require("../middlewares/auth.middleware");
const { validateSchema } = require("../middlewares/validate.middleware");
const registerSchema = require("../validations/schemaJoi/register.validation");
const loginSchema = require("../validations/schemaJoi/login.validation");

router.post(
  "/register",
  validateSchema(registerSchema),
  authController.register,
);
router.post("/login", validateSchema(loginSchema), authController.login);
router.post("/refresh", authController.refresh);
router.post("/logout", authController.logout);
router.post("/logout-all", authenticateToken, authController.logoutAll);

module.exports = router;
