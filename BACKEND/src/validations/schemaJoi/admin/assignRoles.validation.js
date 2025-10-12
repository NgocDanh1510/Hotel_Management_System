const Joi = require("joi");

const assignRolesSchema = Joi.object({
  role_ids: Joi.array().items(Joi.string().uuid()).optional(),
  role_names: Joi.array().items(Joi.string().min(1)).optional(),
})
  .external(async (value) => {
    // Validate that only one of role_ids or role_names is provided
    const hasRoleIds = value.role_ids && value.role_ids.length > 0;
    const hasRoleNames = value.role_names && value.role_names.length > 0;

    if (hasRoleIds && hasRoleNames) {
      throw new Error(
        "Cannot provide both role_ids and role_names at the same time",
      );
    }

    if (!hasRoleIds && !hasRoleNames) {
      throw new Error("Must provide either role_ids or role_names");
    }
  })
  .messages({
    "array.base": "role_ids and role_names must be arrays",
  });

module.exports = assignRolesSchema;
