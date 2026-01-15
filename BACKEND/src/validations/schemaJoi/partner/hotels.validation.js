const Joi = require("joi");

const createPartnerHotelSchema = Joi.object({
  name: Joi.string().max(200).required(),
  description: Joi.string().allow("").optional(),
  address: Joi.string().max(500).allow("").optional(),
  district_id: Joi.string().guid().required(),
  star_rating: Joi.number().min(1).max(5).optional(),
  contact_email: Joi.string().email().max(255).allow("").optional(),
  contact_phone: Joi.string().max(20).allow("").optional(),
  amenity_ids: Joi.array().items(Joi.string().guid()).optional(),
  slug: Joi.string().max(220).optional(),
}).unknown(false);

const updatePartnerHotelSchema = Joi.object({
  name: Joi.string().max(200).optional(),
  description: Joi.string().allow("").optional(),
  address: Joi.string().max(500).allow("").optional(),
  district_id: Joi.string().guid().optional(),
  star_rating: Joi.number().min(1).max(5).optional(),
  contact_email: Joi.string().email().max(255).allow("").optional(),
  contact_phone: Joi.string().max(20).allow("").optional(),
  slug: Joi.string().max(220).optional(),
})
  .min(1)
  .unknown(false);

module.exports = {
  createPartnerHotelSchema,
  updatePartnerHotelSchema,
};
