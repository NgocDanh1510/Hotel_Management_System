const authService = require("../services/auth.service");
const jwtConfig = require("../config/jwt.config");

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

//[POST] /auth/login
module.exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await authService.loginUser(email, password);

    // Set refresh token in httpOnly cookie
    const isProduction = process.env.NODE_ENV === "production";
    res.cookie("refresh_token", result.refresh_token, {
      httpOnly: true,
      secure: isProduction, // HTTPS only in production
      sameSite: "strict",
      maxAge: jwtConfig.REFRESH_EXPIRES_MS, // 7 days in milliseconds
    });

    // Return response without refresh_token in body (it's in cookie)
    res.status(200).json({
      access_token: result.access_token,
      expires_in: result.expires_in,
      user: result.user,
    });
  } catch (error) {
    if (error.statusCode === 401) {
      return res.status(401).json({ message: error.message });
    }
    if (error.statusCode === 403) {
      return res.status(403).json({ message: error.message });
    }
    if (error.statusCode === 423) {
      return res.status(423).json({
        message: error.message,
        locked_until: error.locked_until,
      });
    }
    console.error("Login Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
