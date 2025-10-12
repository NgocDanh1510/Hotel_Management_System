const authService = require("../services/auth.service");
const profileService = require("../services/profile.service");
const jwtConfig = require("../config/jwt.config");
const { sendSuccess, sendError } = require("../utils/apiResponse");

//[POST] /auth/register
module.exports.register = async (req, res) => {
  try {
    const result = await authService.registerUser(req.body);
    sendSuccess(res, {
      statusCode: 201,
      message: "User registered successfully",
      data: result,
    });
  } catch (error) {
    if (error.statusCode === 409) {
      return sendError(res, { statusCode: 409, message: error.message });
    }
    console.error("Registration Error:", error);
    sendError(res, { statusCode: 500, message: "Internal server error" });
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
    sendSuccess(res, {
      statusCode: 200,
      message: "Login successful",
      data: {
        access_token: result.access_token,
        expires_in: result.expires_in,
        user: result.user,
      },
    });
  } catch (error) {
    if (error.statusCode === 401) {
      return sendError(res, { statusCode: 401, message: error.message });
    }
    if (error.statusCode === 403) {
      return sendError(res, { statusCode: 403, message: error.message });
    }
    if (error.statusCode === 423) {
      return sendError(res, {
        statusCode: 423,
        message: error.message,
      });
    }
    console.error("Login Error:", error);
    sendError(res, { statusCode: 500, message: "Internal server error" });
  }
};

//[POST] /auth/refresh
module.exports.refresh = async (req, res) => {
  try {
    const refreshToken = req.cookies.refresh_token;
    const result = await authService.refreshAccessToken(refreshToken);

    sendSuccess(res, {
      statusCode: 200,
      message: "Token refreshed successfully",
      data: {
        access_token: result.access_token,
        expires_in: result.expires_in,
        user: result.user,
      },
    });
  } catch (error) {
    if (error.statusCode === 401) {
      return sendError(res, { statusCode: 401, message: error.message });
    }
    if (error.statusCode === 404) {
      return sendError(res, { statusCode: 404, message: error.message });
    }
    console.error("Refresh Token Error:", error);
    sendError(res, { statusCode: 500, message: "Internal server error" });
  }
};

//[POST] /auth/logout
module.exports.logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refresh_token;
    await authService.logoutUser(refreshToken);

    // Clear refresh token cookie
    res.clearCookie("refresh_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    sendSuccess(res, { statusCode: 200, message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout Error:", error);
    sendError(res, { statusCode: 500, message: "Internal server error" });
  }
};

//[POST] /auth/logout-all
module.exports.logoutAll = async (req, res) => {
  try {
    const userId = req.user.user_id;
    await authService.logoutAllSessions(userId);

    // Clear refresh token cookie
    res.clearCookie("refresh_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    sendSuccess(res, {
      statusCode: 200,
      message: "All sessions terminated successfully",
    });
  } catch (error) {
    console.error("Logout All Error:", error);
    sendError(res, { statusCode: 500, message: "Internal server error" });
  }
};

//[GET] /me
//Get current user profile
module.exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const profile = await profileService.getProfile(userId);

    return sendSuccess(res, {
      statusCode: 200,
      message: "Get profile successfully",
      data: profile,
    });
  } catch (error) {
    if (error.statusCode === 404) {
      return sendError(res, {
        statusCode: 404,
        message: error.message,
      });
    }
    console.error("Get profile error:", error);
    sendError(res, { statusCode: 500, message: "Internal server error" });
  }
};

//[PUT] /me
//Update current user profile
module.exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const result = await profileService.updateProfile(userId, req.body);

    return sendSuccess(res, {
      statusCode: 200,
      message: "Profile updated successfully",
      data: result,
    });
  } catch (error) {
    if (error.statusCode === 404) {
      return sendError(res, {
        statusCode: 404,
        message: error.message,
      });
    }
    if (error.statusCode === 400) {
      return sendError(res, {
        statusCode: 400,
        message: error.message,
      });
    }
    console.error("Update profile error:", error);
    sendError(res, { statusCode: 500, message: "Internal server error" });
  }
};
