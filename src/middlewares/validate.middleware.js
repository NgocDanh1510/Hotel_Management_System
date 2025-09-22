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

/**
 * Validate req.query against a Joi schema.
 * Applies Joi defaults back onto req.query.
 */
const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      convert: true,
    });
    if (error) {
      const errorMessage = error.details.map((detail) => detail.message);
      return sendError(res, {
        statusCode: 400,
        message: "Validation failed",
        errors: errorMessage,
      });
    }
    // Write coerced + defaulted values back so controllers see them
    req.query = value;
    next();
  };
};

module.exports = {
  validate,
  validateSchema,
  validateRequest,
  validateQuery,
};
