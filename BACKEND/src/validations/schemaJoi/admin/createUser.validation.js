//createUserSchema
const Joi = require("joi");

const createUserSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  phone: Joi.string()
    .pattern(/^0\d{1,10}$/)
    .optional()
    .allow(null)
    .messages({
      "string.pattern.base": "Số điện thoại không hợp lệ",
    }),
  password: Joi.string().min(6).required(),
  role_ids: Joi.array().items(Joi.string().uuid()),
});

module.exports = createUserSchema;
