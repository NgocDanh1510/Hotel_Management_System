const { sendError } = require("../utils/apiResponse");

const notFound = (req, res) => {
  return sendError(res, {
    statusCode: 404,
    message: `Not Found - ${req.originalUrl}`,
  });
};

const errorHandler = (err, req, res, next) => {
  let statusCode =
    err.statusCode || (res.statusCode === 200 ? 500 : res.statusCode);
  let message = err.message || "Internal server error";

  if (
    err.name === "SequelizeValidationError" ||
    err.name === "SequelizeUniqueConstraintError"
  ) {
    statusCode = err.name === "SequelizeUniqueConstraintError" ? 409 : 400;
    message = err.errors.map((error) => error.message).join(", ");
  }

  if (process.env.NODE_ENV !== "production" && statusCode >= 500) {
    console.error(err);
  }

  return sendError(res, { statusCode, message });
};

module.exports = { notFound, errorHandler };
