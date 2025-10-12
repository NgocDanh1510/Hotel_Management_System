const Joi = require("joi");

const updatePermissionSchema = Joi.object({
  description: Joi.string().max(255).optional().allow(null).messages({
    "string.max": "Description must not exceed 255 characters",
  }),
  module: Joi.string()
    .max(50)
    .optional()
    .pattern(/^[a-z_]+$/)
    .messages({
      "string.max": "Module must not exceed 50 characters",
      "string.pattern.base":
        "Module must contain only lowercase letters and underscores",
    }),
})
  .min(1)
  .unknown(false)
  .messages({
    "object.min": "At least one field must be provided",
  });

module.exports = {
  updatePermissionSchema,
};
