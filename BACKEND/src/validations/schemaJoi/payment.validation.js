const Joi = require("joi");

const createPaymentSchema = Joi.object({
  booking_id: Joi.string().guid().required(),
  amount: Joi.number().precision(2).positive().required(),
  gateway: Joi.string().valid("vnpay", "momo", "stripe").required(),
});

module.exports = {
  createPaymentSchema,
};
