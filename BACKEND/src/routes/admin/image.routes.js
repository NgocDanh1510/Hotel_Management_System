const express = require('express');
const router = express.Router();
const imageController = require('../../controllers/admin/image.controller');
const upload = require('../../middlewares/upload.middleware');
const { authenticateToken, requirePermission } = require('../../middlewares/auth.middleware');
const { validateSchema } = require('../../middlewares/validate.middleware');
const { uploadImagesSchema, reorderImagesSchema } = require('../../validations/schemaJoi/image.validation');

/**
 * @route POST /api/v1/admin/images/upload
 * @desc Upload images for hotel or room type
 * @access Private (image.manage_own_hotel OR image.manage_all)
 */
router.post(
  '/upload',
  authenticateToken,
  (req, res, next) => {
    const perms = req.user.permissions || [];
    if (perms.includes('image.manage_all') || perms.includes('image.manage_own_hotel')) {
      return next();
    }
    const { sendError } = require('../../utils/apiResponse');
    return sendError(res, { statusCode: 403, message: 'Insufficient permissions' });
  },
  upload.array('files[]', 10), // Limit to 10 files
  validateSchema(uploadImagesSchema),
  imageController.uploadImages
);

/**
 * @route PATCH /api/v1/admin/images/reorder
 * @desc Update sort order for images
 * @access Private (image.manage_own_hotel OR image.manage_all)
 */
router.patch(
  '/reorder',
  authenticateToken,
  (req, res, next) => {
    const perms = req.user.permissions || [];
    if (perms.includes('image.manage_all') || perms.includes('image.manage_own_hotel')) {
      return next();
    }
    const { sendError } = require('../../utils/apiResponse');
    return sendError(res, { statusCode: 403, message: 'Insufficient permissions' });
  },
  validateSchema(reorderImagesSchema),
  imageController.reorderImages
);

/**
 * @route PATCH /api/v1/admin/images/:id/set-primary
 * @desc Set an image as primary
 * @access Private (image.manage_own_hotel OR image.manage_all)
 */
router.patch(
  '/:id/set-primary',
  authenticateToken,
  (req, res, next) => {
    const perms = req.user.permissions || [];
    if (perms.includes('image.manage_all') || perms.includes('image.manage_own_hotel')) {
      return next();
    }
    const { sendError } = require('../../utils/apiResponse');
    return sendError(res, { statusCode: 403, message: 'Insufficient permissions' });
  },
  imageController.setPrimaryImage
);

/**
 * @route DELETE /api/v1/admin/images/:id
 * @desc Delete an image
 * @access Private (image.manage_own_hotel OR image.manage_all)
 */
router.delete(
  '/:id',
  authenticateToken,
  (req, res, next) => {
    const perms = req.user.permissions || [];
    if (perms.includes('image.manage_all') || perms.includes('image.manage_own_hotel')) {
      return next();
    }
    const { sendError } = require('../../utils/apiResponse');
    return sendError(res, { statusCode: 403, message: 'Insufficient permissions' });
  },
  imageController.deleteImage
);

module.exports = router;
