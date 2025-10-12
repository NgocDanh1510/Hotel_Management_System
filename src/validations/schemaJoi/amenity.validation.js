const Joi = require('joi');

const amenitySchema = Joi.object({
  name: Joi.string().max(100).required(),
  icon: Joi.string().max(100).allow(null, '').optional(),
});

const updateEntityAmenitiesSchema = Joi.object({
  amenity_ids: Joi.array().items(Joi.string().guid()).required(),
});

module.exports = {
  amenitySchema,
  updateEntityAmenitiesSchema,
};
