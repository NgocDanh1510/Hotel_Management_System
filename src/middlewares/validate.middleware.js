const { sendError } = require("../utils/apiResponse");

const validateSchema = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      const errorMessage = error.details.map((detail) => detail.message);
      return sendError(res, {
        statusCode: 400,
        message: "Validation failed",
        errors: errorMessage,
      });
    }
    next();
  };
};

// Legacy validate function for backwards compatibility
const validate = validateSchema;

const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(
      { body: req.body, params: req.params, query: req.query },
      { abortEarly: false },
    );

    if (error) {
      const errorMessage = error.details.map((detail) => detail.message);
      return sendError(res, {
        statusCode: 400,
        message: "Validation failed",
        errors: errorMessage,
      });
    }

    next();
  };
};

module.exports = {
  validate,
  validateSchema,
  validateRequest,
};
