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

const listAdminBookingsQuerySchema = Joi.object({
  status: Joi.alternatives()
    .try(
      Joi.string().valid(
        "pending",
        "confirmed",
        "checked_in",
        "checked_out",
        "cancelled",
        "cancellation_pending"
      ),
      Joi.array().items(
        Joi.string().valid(
          "pending",
          "confirmed",
          "checked_in",
          "checked_out",
          "cancelled",
          "cancellation_pending"
        )
      )
    )
    .optional(),
  hotel_id: Joi.string().guid().optional(),
  room_id: Joi.string().guid().optional(),
  user_id: Joi.string().guid().optional(),
  check_in_from: Joi.date().iso().optional(),
  check_in_to: Joi.date().iso().optional(),
  check_out_from: Joi.date().iso().optional(),
  check_out_to: Joi.date().iso().optional(),
  created_at_from: Joi.date().iso().optional(),
  created_at_to: Joi.date().iso().optional(),
  total_price_min: Joi.number().min(0).optional(),
  total_price_max: Joi.number().min(0).optional(),
  q: Joi.string().allow("").optional(),
  sort: Joi.string()
    .valid(
      "created_at",
      "check_in",
      "total_price",
      "status",
      "created_at_desc",
      "check_in_desc",
      "total_price_desc",
      "status_desc"
    )
    .default("created_at_desc"),
  offset: Joi.number().integer().min(0).default(0),
  limit: Joi.number().integer().min(1).max(100).default(20),
}).unknown(false);

const updateBookingStatusSchema = Joi.object({
  status: Joi.string()
    .valid(
      "confirmed",
      "checked_in",
      "checked_out",
      "cancelled"
    )
    .required(),
});

module.exports = {
  createBookingSchema,
  listMyBookingsQuerySchema,
  listAdminBookingsQuerySchema,
  updateBookingStatusSchema,
};
