const authService = require("../services/auth.service");

//[POST] /auth/register
module.exports.register = async (req, res) => {
  try {
    const result = await authService.registerUser(req.body);
    res.status(201).json(result);
  } catch (error) {
    if (error.statusCode === 409) {
      return res.status(409).json({ message: error.message });
    }
    console.error("Registration Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
