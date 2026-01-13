const Joi = require("joi");

const updatePartnerRoomSchema = Joi.object({
  floor: Joi.number().integer().optional(),
  room_number: Joi.string().max(20).optional(),
  room_type_id: Joi.string().guid().optional(),
})
  .min(1)
  .unknown(false);

const updateRoomAvailabilitySchema = Joi.object({
  status: Joi.string().valid("available", "maintenance").required(),
}).unknown(false);

module.exports = {
  updatePartnerRoomSchema,
  updateRoomAvailabilitySchema,
};
