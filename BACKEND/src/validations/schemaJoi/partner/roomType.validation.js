const Joi = require("joi");

const updateRoomTypePriceSchema = Joi.object({
  base_price: Joi.number().greater(0).required(),
  currency: Joi.string().length(3).uppercase().optional(),
}).unknown(false);

module.exports = {
  updateRoomTypePriceSchema,
};
