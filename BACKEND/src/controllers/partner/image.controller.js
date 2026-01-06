const partnerImageService = require("../../services/partner/image.service");
const { sendSuccess, sendError } = require("../../utils/apiResponse");

const uploadImages = async (req, res, next) => {
  try {
    const { entity_type, entity_id } = req.body;
    const files = req.files;

    if (!files || files.length === 0) {
      return sendError(res, { statusCode: 400, message: "No files uploaded" });
    }

    const result = await partnerImageService.uploadImages(
      files,
      entity_type,
      entity_id,
      req.user,
    );

    return sendSuccess(res, {
      statusCode: 201,
      message:
        result.failed.length > 0
          ? `Upload completed with ${result.failed.length} failures`
          : "All images uploaded successfully",
      data: result,
    });
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, {
        statusCode: error.statusCode,
        message: error.message,
      });
    }
    console.error("Partner upload images error:", error);
    next(error);
  }
};

const reorderImages = async (req, res, next) => {
  try {
    await partnerImageService.reorderImages(req.body.images, req.user);

    return sendSuccess(res, {
      message: "Images reordered successfully",
    });
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, {
        statusCode: error.statusCode,
        message: error.message,
      });
    }
    console.error("Partner reorder images error:", error);
    next(error);
  }
};

const setPrimaryImage = async (req, res, next) => {
  try {
    const image = await partnerImageService.setPrimaryImage(req.params.id, req.user);

    return sendSuccess(res, {
      message: "Primary image updated successfully",
      data: image,
    });
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, {
        statusCode: error.statusCode,
        message: error.message,
      });
    }
    console.error("Partner set primary image error:", error);
    next(error);
  }
};

const deleteImage = async (req, res, next) => {
  try {
    await partnerImageService.deleteImage(req.params.id, req.user);

    return sendSuccess(res, {
      message: "Image deleted successfully",
    });
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, {
        statusCode: error.statusCode,
        message: error.message,
      });
    }
    console.error("Partner delete image error:", error);
    next(error);
  }
};

module.exports = {
  uploadImages,
  reorderImages,
  setPrimaryImage,
  deleteImage,
};
