const Joi = require("joi");

const createRoleSchema = Joi.object({
  name: Joi.string()
    .required()
    .min(2)
    .max(50)
    .lowercase()
    .pattern(/^[a-z0-9_-]+$/)
    .messages({
      "string.base": "Name must be a string",
      "string.empty": "Name is required",
      "any.required": "Name is required",
      "string.min": "Name must be at least 2 characters",
      "string.max": "Name must not exceed 50 characters",
      "string.pattern.base":
        "Name must contain only lowercase letters, numbers, hyphens, and underscores",
    }),
  description: Joi.string().max(255).optional().allow(null).messages({
    "string.max": "Description must not exceed 255 characters",
  }),
}).unknown(false);

const updateRoleSchema = Joi.object({
  name: Joi.string()
    .optional()
    .min(2)
    .max(50)
    .lowercase()
    .pattern(/^[a-z0-9_-]+$/)
    .messages({
      "string.min": "Name must be at least 2 characters",
      "string.max": "Name must not exceed 50 characters",
      "string.pattern.base":
        "Name must contain only lowercase letters, numbers, hyphens, and underscores",
    }),
  description: Joi.string().max(255).optional().allow(null).messages({
    "string.max": "Description must not exceed 255 characters",
  }),
})
  .min(1)
  .unknown(false)
  .messages({
    "object.min": "At least one field must be provided",
  });

const assignPermissionsSchema = Joi.object({
  permission_ids: Joi.array().items(Joi.string().uuid()).optional().messages({
    "array.base": "permission_ids must be an array",
    "string.guid": "Each permission_id must be a valid UUID",
  }),
  permission_codes: Joi.array()
    .items(Joi.string().max(100))
    .optional()
    .messages({
      "array.base": "permission_codes must be an array",
      "string.max": "Each permission code must not exceed 100 characters",
    }),
})
  .xor("permission_ids", "permission_codes")
  .messages({
    "object.xor":
      "Either permission_ids or permission_codes must be provided, but not both",
  })
  .unknown(false);

module.exports = {
  createRoleSchema,
  updateRoleSchema,
  assignPermissionsSchema,
};
