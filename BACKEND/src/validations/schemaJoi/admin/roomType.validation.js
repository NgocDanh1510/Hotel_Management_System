const Joi = require("joi");

const createRoomTypeSchema = Joi.object({
  name: Joi.string().max(100).required(),
  description: Joi.string().allow(null, "").optional(),
  base_price: Joi.number().greater(0).required(),
  currency: Joi.string().length(3).uppercase().required(), // ISO 4217
  max_occupancy: Joi.number().integer().min(1).max(20).required(),
  total_rooms: Joi.number().integer().min(1).required(),
  bed_type: Joi.string().max(50).allow(null, "").optional(),
  size_sqm: Joi.number().positive().allow(null).optional(),
}).unknown(false);

const createRoomTypeWithHotelSchema = createRoomTypeSchema.keys({
  hotel_id: Joi.string().guid().required(),
});

const updateRoomTypeSchema = Joi.object({
  name: Joi.string().max(100).optional(),
  description: Joi.string().allow(null, "").optional(),
  base_price: Joi.number().greater(0).optional(),
  currency: Joi.string().length(3).uppercase().optional(),
  max_occupancy: Joi.number().integer().min(1).max(20).optional(),
  total_rooms: Joi.number().integer().min(1).optional(),
  bed_type: Joi.string().max(50).allow(null, "").optional(),
  size_sqm: Joi.number().positive().allow(null).optional(),
})
  .min(1)
  .unknown(false);

const listRoomTypesQuerySchema = Joi.object({
  hotel_id: Joi.string().guid().optional(),
  hotelId: Joi.string().guid().optional(),
  max_occupancy_min: Joi.number().integer().min(1).optional(),
  max_occupancy_max: Joi.number().integer().min(1).optional(),
  base_price_min: Joi.number().min(0).optional(),
  base_price_max: Joi.number().min(0).optional(),
  currency: Joi.string().length(3).uppercase().optional(),
  q: Joi.string().max(255).allow("").optional(),
  sort: Joi.string()
    .valid(
      "base_price",
      "max_occupancy",
      "created_at",
      "base_price_desc",
      "max_occupancy_desc",
      "created_at_desc"
    )
    .default("created_at"),
  offset: Joi.number().integer().min(0).default(0),
  limit: Joi.number().integer().min(1).max(100).default(20),
}).unknown(false);

module.exports = {
  createRoomTypeSchema,
  createRoomTypeWithHotelSchema,
  updateRoomTypeSchema,
  listRoomTypesQuerySchema,
};
