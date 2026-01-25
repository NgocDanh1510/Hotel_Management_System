const Joi = require("joi");

const updateProfileSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  phone: Joi.string()
    .pattern(/^0\d{1,10}$/)
    .optional()
    .messages({
      "string.pattern.base": "Phone number is invalid",
    }),
})

  .messages({
    "object.unknown": "Unknown field in request body",
  });

const updatePasswordSchema = Joi.object({
  current_password: Joi.string().optional(),
  new_password: Joi.string()
    .min(8)
    .pattern(
      /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&^#()_+\-=\[\]{};':"\\|,.<>\/?]).*$/,
    )
    .optional()
    .messages({
      "string.pattern.base":
        "New password must contain at least one uppercase letter, one number, and one special character",
    }),
})
  .external(async (value) => {
    // If new_password is provided, current_password is required
    if (value.new_password && !value.current_password) {
      throw new Error(
        "current_password is required when new_password is provided",
      );
    }
  })
  .messages({
    "object.unknown": "Unknown field in request body",
  });
const updateEmailSchema = Joi.object({
  new_email: Joi.string().email().required(),
}).messages({
  "object.unknown": "Unknown field in request body",
});

module.exports = {
  updateProfileSchema,
  updatePasswordSchema,
  updateEmailSchema,
};
