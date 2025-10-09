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

module.exports = {
  createReviewSchema,
  listHotelReviewsQuerySchema,
};
