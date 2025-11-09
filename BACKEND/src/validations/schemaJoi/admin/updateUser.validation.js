const Joi = require("joi");

const updateUserSchema = Joi.object({
  is_active: Joi.boolean().optional(),
  name: Joi.string().min(2).max(100).optional(),
  phone: Joi.string()
    .pattern(/^0\d{1,10}$/)
    .optional()
    .allow(null)
    .messages({
      "string.pattern.base": "Số điện thoại không hợp lệ",
    }),
}).min(1); // At least one field must be provided

module.exports = updateUserSchema;
