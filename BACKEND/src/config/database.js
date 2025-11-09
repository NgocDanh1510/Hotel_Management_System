// src/config/database.js
const { Sequelize } = require("sequelize");
const config = require("./config")[process.env.NODE_ENV || "development"];

const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  config,
);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("MySQL/Sequelize Connected successfully.");
  } catch (error) {
    console.error("Unable to connect to the database:", error.message);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
