const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const validate = require("../middlewares/validate.middleware");
const registerSchema = require("../validations/schemaJoi/register.validation");
const loginSchema = require("../validations/schemaJoi/login.validation");

router.post("/register", validate(registerSchema), authController.register);
router.post("/login", validate(loginSchema), authController.login);

module.exports = router;
