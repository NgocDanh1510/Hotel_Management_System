require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const { connectDB } = require("./config/database");
const { sequelize } = require("./models");
const routes = require("./routes");
const { errorHandler, notFound } = require("./middlewares/error.middleware");
const { sendSuccess } = require("./utils/apiResponse");

const app = express();

// Connect to database
connectDB();

// Sync Models (Create tables if they don't exist)
sequelize
  .sync({ alter: false })
  .then(() => {
    console.log("Database synchronized");
  })
  .catch((err) => {
    console.error("Error synchronizing database", err);
  });

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Routes
app.use("/api/v1", routes);

// Base route
app.get("/", (req, res) => {
  sendSuccess(res, { message: "API is running..." });
});

// Error Handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
