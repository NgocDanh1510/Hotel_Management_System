const Joi = require("joi");
const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string()
    .min(8)
    .pattern(
      /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&^#()_+\-=\[\]{};':"\\|,.<>\/?]).*$/,
    )
    .required()
    .messages({
      "string.pattern.base":
        "Mật khẩu phải chứa ít nhất một chữ cái viết hoa, một số và một ký tự đặc biệt",
    }),
  name: Joi.string().min(2).max(100).required(),
  phone: Joi.string()
    .pattern(/^0\d{1,10}$/)
    .optional()
    .messages({
      "string.pattern.base": "Số điện thoại không hợp lệ",
    }),
});

module.exports = registerSchema;
