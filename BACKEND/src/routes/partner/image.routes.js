const express = require("express");
const router = express.Router();
const partnerImageController = require("../../controllers/partner/image.controller");
const upload = require("../../middlewares/upload.middleware");
const { authenticateToken, requirePermission } = require("../../middlewares/auth.middleware");
const { validateSchema } = require("../../middlewares/validate.middleware");
const {
  uploadImagesSchema,
  reorderImagesSchema,
} = require("../../validations/schemaJoi/image.validation");

router.use(authenticateToken);

router.post(
  "/upload",
  requirePermission("image.manage_own_hotel"),
  upload.array("files[]", 10),
  validateSchema(uploadImagesSchema),
  partnerImageController.uploadImages,
);

router.patch(
  "/reorder",
  requirePermission("image.manage_own_hotel"),
  validateSchema(reorderImagesSchema),
  partnerImageController.reorderImages,
);

router.patch(
  "/:id/set-primary",
  requirePermission("image.manage_own_hotel"),
  partnerImageController.setPrimaryImage,
);

router.delete(
  "/:id",
  requirePermission("image.manage_own_hotel"),
  partnerImageController.deleteImage,
);

module.exports = router;
