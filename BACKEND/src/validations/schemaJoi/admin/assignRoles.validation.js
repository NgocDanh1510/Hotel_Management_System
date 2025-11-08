const Joi = require("joi");

const assignRolesSchema = Joi.object({
  role_ids: Joi.array().items(Joi.string().uuid()),
});

module.exports = assignRolesSchema;
