const imageService = require("../../services/image.service");
const { sendSuccess, sendError } = require("../../utils/apiResponse");

/**
 * POST /api/v1/admin/images/upload
 */
const uploadImages = async (req, res, next) => {
  try {
    const { entity_type, entity_id } = req.body;
    const files = req.files;

    if (!files || files.length === 0) {
      return sendError(res, { statusCode: 400, message: "No files uploaded" });
    }

    const result = await imageService.uploadImages(files, entity_type, entity_id, req.user);

    const message = result.failed.length > 0 
      ? `Upload completed with ${result.failed.length} failures`
      : "All images uploaded successfully";

    return sendSuccess(res, {
      statusCode: 201,
      message,
      data: result
    });
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, { statusCode: error.statusCode, message: error.message });
    }
    console.error("Upload images error:", error);
    next(error);
  }
};

/**
 * PATCH /api/v1/admin/images/reorder
 */
const reorderImages = async (req, res, next) => {
  try {
    await imageService.reorderImages(req.body.images);
    return sendSuccess(res, { message: "Images reordered successfully" });
  } catch (error) {
    console.error("Reorder images error:", error);
    next(error);
  }
};

/**
 * PATCH /api/v1/admin/images/:id/set-primary
 */
const setPrimaryImage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const image = await imageService.setPrimaryImage(id);
    return sendSuccess(res, { message: "Primary image updated successfully", data: image });
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, { statusCode: error.statusCode, message: error.message });
    }
    console.error("Set primary image error:", error);
    next(error);
  }
};

/**
 * DELETE /api/v1/admin/images/:id
 */
const deleteImage = async (req, res, next) => {
  try {
    const { id } = req.params;
    await imageService.deleteImage(id);
    return sendSuccess(res, { message: "Image deleted successfully" });
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, { statusCode: error.statusCode, message: error.message });
    }
    console.error("Delete image error:", error);
    next(error);
  }
};

module.exports = {
  uploadImages,
  reorderImages,
  setPrimaryImage,
  deleteImage
};
