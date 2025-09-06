const Joi = require("joi");

const createHotelSchema = Joi.object({
  name: Joi.string().max(200).required(),
  description: Joi.string().optional(),
  address: Joi.string().max(500).optional(),
  city: Joi.string().max(100).optional(),
  country: Joi.string().max(100).optional(),
  star_rating: Joi.number().min(1).max(5).optional(),
  contact_email: Joi.string().email().max(255).optional(),
  contact_phone: Joi.string().max(20).optional(),
  owner_id: Joi.string().guid().required(),
  slug: Joi.string().max(220).optional(),
});

const listHotelsQuerySchema = Joi.object({
  q: Joi.string().max(255).optional(),
  is_active: Joi.boolean().optional(),
  owner_id: Joi.string().guid().optional(),
  city: Joi.string().max(100).optional(),
  country: Joi.string().max(100).optional(),
  star_rating_min: Joi.number().min(0).max(5).optional(),
  star_rating_max: Joi.number().min(0).max(5).optional(),
  created_at_from: Joi.date().iso().optional(),
  created_at_to: Joi.date().iso().optional(),
  sort: Joi.string()
    .valid("created_at", "name", "star_rating", "total_bookings")
    .default("created_at"),
  offset: Joi.number().integer().min(0).default(0),
  limit: Joi.number().integer().min(1).max(100).default(20),
}).unknown(false);

const updateHotelSchema = Joi.object({
  name: Joi.string().max(200).optional(),
  description: Joi.string().optional(),
  address: Joi.string().max(500).optional(),
  city: Joi.string().max(100).optional(),
  country: Joi.string().max(100).optional(),
  star_rating: Joi.number().min(1).max(5).optional(),
  contact_email: Joi.string().email().max(255).optional(),
  contact_phone: Joi.string().max(20).optional(),
  is_active: Joi.boolean().optional(),
});

module.exports = {
  createHotelSchema,
  listHotelsQuerySchema,
  updateHotelSchema,
};
