require("dotenv").config();

module.exports = {
  ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || "your-access-secret-key",
  REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || "your-refresh-secret-key",
  ACCESS_EXPIRES_IN: "15m",
  REFRESH_EXPIRES_IN: "7d",
  REFRESH_EXPIRES_MS: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
};
