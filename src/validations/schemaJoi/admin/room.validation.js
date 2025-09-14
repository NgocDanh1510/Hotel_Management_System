const Joi = require("joi");

const listRoomsQuerySchema = Joi.object({
  hotel_id: Joi.string().guid().optional(),
  room_type_id: Joi.string().guid().optional(),
  status: Joi.string().valid("available", "occupied", "maintenance").optional(),
  floor: Joi.number().integer().optional(),
  q: Joi.string().allow("").optional(),
  sort: Joi.string()
    .valid(
      "room_number",
      "floor",
      "status",
      "updated_at",
      "room_number_desc",
      "floor_desc",
      "status_desc",
      "updated_at_desc"
    )
    .default("room_number"),
  offset: Joi.number().integer().min(0).default(0),
  limit: Joi.number().integer().min(1).max(100).default(20),
}).unknown(false);

const updateRoomSchema = Joi.object({
  status: Joi.string().valid("available", "occupied", "maintenance").optional(),
  floor: Joi.number().integer().optional(),
  room_number: Joi.string().max(20).optional(),
  room_type_id: Joi.string().guid().optional(),
});

const bulkUpdateStatusSchema = Joi.object({
  room_ids: Joi.array().items(Joi.string().guid()).min(1).max(100).required(),
  status: Joi.string().valid("maintenance", "available").required(),
});

module.exports = {
  listRoomsQuerySchema,
  updateRoomSchema,
  bulkUpdateStatusSchema,
};
