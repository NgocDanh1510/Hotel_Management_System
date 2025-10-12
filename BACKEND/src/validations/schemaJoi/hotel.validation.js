const Joi = require("joi");

const checkAvailabilitySchema = Joi.object({
  check_in: Joi.date().iso().required(),
  check_out: Joi.date().iso().greater(Joi.ref("check_in")).required(),
  guests: Joi.number().integer().min(1).required(),
});

module.exports = {
  checkAvailabilitySchema,
};
