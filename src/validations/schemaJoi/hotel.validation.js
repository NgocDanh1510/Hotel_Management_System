const Joi = require("joi");

const listHotelsQuerySchema = Joi.object({
  q: Joi.string().max(255).optional(),
  city: Joi.string().max(100).optional(),
  country: Joi.string().max(100).optional(),
  star_rating_min: Joi.number().min(0).max(5).optional(),
  star_rating_max: Joi.number().min(0).max(5).optional(),
  price_min: Joi.number().min(0).optional(),
  price_max: Joi.number().min(0).optional(),
  amenity_ids: Joi.alternatives().try(
    Joi.array().items(Joi.string().guid()),
    Joi.string().guid(),
  ),
  check_in: Joi.date().iso().optional(),
  check_out: Joi.date().iso().optional(),
  guests: Joi.number().integer().min(1).optional(),
  sort: Joi.string()
    .valid("star_rating", "price_asc", "price_desc", "avg_rating", "created_at")
    .default("created_at"),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(12),
}).unknown(false);

module.exports = {
  listHotelsQuerySchema,
};
