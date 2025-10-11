const Joi = require('joi');

const uploadImagesSchema = Joi.object({
  entity_type: Joi.string().valid('hotel', 'room_type').required(),
  entity_id: Joi.string().guid().required(),
});

const reorderImagesSchema = Joi.object({
  images: Joi.array().items(
    Joi.object({
      id: Joi.string().guid().required(),
      sort_order: Joi.number().integer().min(0).required(),
    })
  ).min(1).required(),
});

module.exports = {
  uploadImagesSchema,
  reorderImagesSchema,
};
