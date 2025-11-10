const Joi = require("joi");

const listHotelsQuerySchema = Joi.object({
  q: Joi.string().max(255).optional(),
  district_id: Joi.string().guid().optional(),
  city_id: Joi.string().guid().optional(),
  star_rating_min: Joi.number().min(0).max(5).optional(),
  star_rating_max: Joi.number().min(0).max(5).optional(),
  price_min: Joi.number().min(0).optional(),
  price_max: Joi.number().min(0).optional(),
  amenity_ids: Joi.array().items(Joi.string().uuid()).optional(),
  check_in: Joi.date().iso().optional(),
  check_out: Joi.date().iso().optional(),
  guests: Joi.number().integer().min(1).optional(),
  sort: Joi.string()
    .valid(
      "created_at",
      "star_rating",
      "price_asc",
      "price_desc",
      "avg_rating",
    )
    .default("created_at"),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(12),
});

const checkAvailabilitySchema = Joi.object({
  check_in: Joi.date().iso().required(),
  check_out: Joi.date().iso().greater(Joi.ref("check_in")).required(),
  guests: Joi.number().integer().min(1).required(),
});

module.exports = {
  listHotelsQuerySchema,
  checkAvailabilitySchema,
};
