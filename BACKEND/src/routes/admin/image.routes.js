const express = require("express");
const router = express.Router();
const imageController = require("../../controllers/admin/image.controller");
const upload = require("../../middlewares/upload.middleware");
const {
  authenticateToken,
  requirePermission,
} = require("../../middlewares/auth.middleware");
const { validateSchema } = require("../../middlewares/validate.middleware");
const {
  uploadImagesSchema,
  reorderImagesSchema,
} = require("../../validations/schemaJoi/image.validation");

/**
 * @route GET /api/v1/admin/images
 * @desc Get all images with pagination
 * @access Private (image.manage_all)
 */
router.get(
  "/",
  authenticateToken,
  requirePermission("image.manage_all"),
  imageController.getAllImages,
);

/**
 * @route POST /api/v1/admin/images/upload
 * @desc Upload images for hotel or room type
 * @access Private (image.manage_own_hotel OR image.manage_all)
 */
router.post(
  "/upload",
  authenticateToken,
  requirePermission("image.manage_all"),
  upload.array("files[]", 10), // Limit to 10 files
  validateSchema(uploadImagesSchema),
  imageController.uploadImages,
);

/**
 * @route PATCH /api/v1/admin/images/reorder
 * @desc Update sort order for images
 * @access Private (image.manage_own_hotel OR image.manage_all)
 */
router.patch(
  "/reorder",
  authenticateToken,
  requirePermission("image.manage_all"),
  validateSchema(reorderImagesSchema),
  imageController.reorderImages,
);

/**
 * @route PATCH /api/v1/admin/images/:id/set-primary
 * @desc Set an image as primary
 * @access Private (image.manage_own_hotel OR image.manage_all)
 */
router.patch(
  "/:id/set-primary",
  authenticateToken,
  requirePermission("image.manage_all"),
  imageController.setPrimaryImage,
);

/**
 * @route DELETE /api/v1/admin/images/:id
 * @desc Delete an image
 * @access Private (image.manage_own_hotel OR image.manage_all)
 */
router.delete(
  "/:id",
  authenticateToken,
  requirePermission("image.manage_all"),
  imageController.deleteImage,
);

module.exports = router;
