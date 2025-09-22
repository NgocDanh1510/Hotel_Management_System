const Joi = require("joi");

const createBookingSchema = Joi.object({
  hotel_id: Joi.string().guid().required(),
  room_type_id: Joi.string().guid().required(),
  check_in: Joi.date().iso().required(),
  check_out: Joi.date().iso().greater(Joi.ref("check_in")).required(),
  guests_count: Joi.number().integer().min(1).required(),
  special_requests: Joi.string().allow(null, "").optional(),
});

const listMyBookingsQuerySchema = Joi.object({
  status: Joi.string()
    .valid(
      "pending",
      "confirmed",
      "checked_in",
      "checked_out",
      "cancelled",
      "cancellation_pending"
    )
    .optional(),
  check_in_from: Joi.date().iso().optional(),
  check_in_to: Joi.date().iso().optional(),
  hotel_id: Joi.string().guid().optional(),
  sort: Joi.string().valid("created_at", "check_in").default("created_at"),
  offset: Joi.number().integer().min(0).default(0),
  limit: Joi.number().integer().min(1).max(50).default(10),
}).unknown(false);

module.exports = {
  createBookingSchema,
  listMyBookingsQuerySchema,
};
