const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const validate = require("../middlewares/validate.middleware");
const registerSchema = require("../validations/schemaJoi/register.validation");

router.post("/register", validate(registerSchema), authController.register);

module.exports = router;
