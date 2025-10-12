const Joi = require("joi");

const createReviewSchema = Joi.object({
  booking_id: Joi.string().guid().required(),
  rating_overall: Joi.number().integer().min(1).max(5).required(),
  rating_cleanliness: Joi.number().integer().min(1).max(5).optional(),
  rating_service: Joi.number().integer().min(1).max(5).optional(),
  rating_location: Joi.number().integer().min(1).max(5).optional(),
  comment: Joi.string().max(2000).allow(null, "").optional(),
});

const listHotelReviewsQuerySchema = Joi.object({
  rating_overall_min: Joi.number().integer().min(1).max(5).optional(),
  rating_overall_max: Joi.number().integer().min(1).max(5).optional(),
  offset: Joi.number().integer().min(0).default(0),
  limit: Joi.number().integer().min(1).max(100).default(10),
});

const listAdminReviewsQuerySchema = Joi.object({
  is_published: Joi.boolean().optional(),
  hotel_id: Joi.string().guid().optional(),
  user_id: Joi.string().guid().optional(),
  rating_overall_min: Joi.number().integer().min(1).max(5).optional(),
  rating_overall_max: Joi.number().integer().min(1).max(5).optional(),
  created_at_from: Joi.date().iso().optional(),
  created_at_to: Joi.date().iso().optional(),
  q: Joi.string().allow("").optional(),
  sort: Joi.string()
    .valid(
      "created_at",
      "created_at_desc",
      "rating_overall",
      "rating_overall_desc"
    )
    .default("created_at_desc"),
  offset: Joi.number().integer().min(0).default(0),
  limit: Joi.number().integer().min(1).max(100).default(20),
}).unknown(false);

const updateReviewStatusSchema = Joi.object({
  is_published: Joi.boolean().required(),
});

const bulkUpdateReviewStatusSchema = Joi.object({
  review_ids: Joi.array()
    .items(Joi.string().guid())
    .min(1)
    .max(50)
    .required(),
  is_published: Joi.boolean().required(),
});

module.exports = {
  createReviewSchema,
  listHotelReviewsQuerySchema,
  listAdminReviewsQuerySchema,
  updateReviewStatusSchema,
  bulkUpdateReviewStatusSchema,
};
