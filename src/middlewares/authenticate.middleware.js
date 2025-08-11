const jwt = require("jsonwebtoken");
const jwtConfig = require("../config/jwt.config");

/**
 * Middleware to verify access token from Authorization header
 * Extracts token from "Authorization: Bearer <token>"
 * Attaches decoded user info to req.user
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Extract token after "Bearer "

  if (!token) {
    return res.status(401).json({ message: "Không tìm thấy access token" });
  }

  jwt.verify(token, jwtConfig.ACCESS_SECRET, (err, decoded) => {
    if (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({ message: "Access token đã hết hạn" });
      }
      return res.status(403).json({ message: "Access token không hợp lệ" });
    }

    // Attach decoded user info to req
    req.user = decoded;
    next();
  });
};

module.exports = authenticateToken;
