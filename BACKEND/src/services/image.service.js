const { Image, Hotel, RoomType, sequelize } = require("../models");
const cloudinary = require("../config/cloudinary");
const { Op } = require("sequelize");

class ImageService {
  /**
   * Upload multiple images to Cloudinary and save to DB.
   *
   * @param {Array} files - Files from Multer
   * @param {string} entityType - 'hotel' or 'room_type'
   * @param {string} entityId - UUID of the entity
   * @param {Object} user - Authenticated user
   * @returns {Promise<Object>} Success and failed uploads
   */
  async uploadImages(files, entityType, entityId, user) {
    // 1. Check entity existence and permission
    let ownerId;
    if (entityType === "hotel") {
      const hotel = await Hotel.findByPk(entityId);
      if (!hotel) throw this._error("Hotel not found", 404);
      ownerId = hotel.owner_id;
    } else if (entityType === "room_type") {
      const roomType = await RoomType.findByPk(entityId, {
        include: [{ model: Hotel, attributes: ["owner_id"] }],
      });
      if (!roomType) throw this._error("Room type not found", 404);
      // Depending on association setup, it might be roomType.Hotel or we fetch manually
      const hotel = await Hotel.findByPk(roomType.hotel_id);
      ownerId = hotel.owner_id;
    } else {
      throw this._error("Invalid entity type", 400);
    }

    if (!this._hasPermission(user, ownerId)) {
      throw this._error("You do not have permission to manage images for this hotel", 403);
    }

    // 2. Upload to Cloudinary in parallel (Settled to handle partial success)
    const uploadPromises = files.map((file) => this._uploadToCloudinary(file));
    const results = await Promise.allSettled(uploadPromises);

    const successfulUploads = [];
    const failedUploads = [];

    results.forEach((result, index) => {
      if (result.status === "fulfilled") {
        successfulUploads.push({
          ...result.value,
          originalName: files[index].originalname,
        });
      } else {
        failedUploads.push({
          originalName: files[index].originalname,
          reason: result.reason.message || "Upload failed",
        });
      }
    });

    // 3. Create DB records for successful uploads
    const createdImages = [];
    if (successfulUploads.length > 0) {
      // Get current max sort_order
      const maxSortOrder =
        (await Image.max("sort_order", {
          where: { entity_type: entityType, entity_id: entityId },
        })) || 0;

      // Check if there's already a primary image
      const hasPrimary =
        (await Image.count({
          where: { entity_type: entityType, entity_id: entityId, is_primary: true },
        })) > 0;

      for (let i = 0; i < successfulUploads.length; i++) {
        const upload = successfulUploads[i];
        // Auto-set as primary if it's the first image for this entity
        const isPrimary = !hasPrimary && i === 0;

        const image = await Image.create({
          entity_type: entityType,
          entity_id: entityId,
          url: upload.secure_url,
          public_id: upload.public_id,
          sort_order: maxSortOrder + i + 1,
          is_primary: isPrimary,
        });
        createdImages.push(image);
      }
    }

    return {
      success_count: createdImages.length,
      images: createdImages,
      failed: failedUploads,
    };
  }

  /**
   * Bulk update sort_order for images.
   *
   * @param {Array} imagesData - [{ id, sort_order }]
   * @returns {Promise<void>}
   */
  async reorderImages(imagesData) {
    const transaction = await sequelize.transaction();
    try {
      for (const item of imagesData) {
        await Image.update(
          { sort_order: item.sort_order },
          { where: { id: item.id }, transaction }
        );
      }
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Set an image as primary and unset others for the same entity.
   *
   * @param {string} imageId - Image ID
   * @returns {Promise<Object>} Updated image
   */
  async setPrimaryImage(imageId) {
    const targetImage = await Image.findByPk(imageId);
    if (!targetImage) throw this._error("Image not found", 404);

    const transaction = await sequelize.transaction();
    try {
      // Unset current primary
      await Image.update(
        { is_primary: false },
        {
          where: {
            entity_type: targetImage.entity_type,
            entity_id: targetImage.entity_id,
            is_primary: true,
          },
          transaction,
        }
      );

      // Set new primary
      await targetImage.update({ is_primary: true }, { transaction });

      await transaction.commit();
      return targetImage;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Delete an image from Cloudinary and DB.
   *
   * @param {string} imageId - Image ID
   * @returns {Promise<void>}
   */
  async deleteImage(imageId) {
    const image = await Image.findByPk(imageId);
    if (!image) throw this._error("Image not found", 404);

    // 1. Delete from Cloudinary (ignore errors to proceed with DB deletion if image missing from Cloudinary)
    cloudinary.uploader.destroy(image.public_id).catch((err) => {
      console.error(`Cloudinary destroy error for ${image.public_id}:`, err);
    });

    const transaction = await sequelize.transaction();
    try {
      const wasPrimary = image.is_primary;
      const { entity_type, entity_id } = image;

      await image.destroy({ transaction });

      // 2. If primary was deleted, promote the next available image
      if (wasPrimary) {
        const nextImage = await Image.findOne({
          where: { entity_type, entity_id },
          order: [["sort_order", "ASC"]],
          transaction,
        });

        if (nextImage) {
          await nextImage.update({ is_primary: true }, { transaction });
        }
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // --- Private Helpers ---

  _hasPermission(user, ownerId) {
    const perms = user.permissions || [];
    if (perms.includes("image.manage_all")) return true;
    if (perms.includes("image.manage_own_hotel") && ownerId === user.user_id) return true;
    return false;
  }

  _error(message, statusCode) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
  }

  _uploadToCloudinary(file) {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: "hotel_management_system/images" },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(file.buffer);
    });
  }
}

module.exports = new ImageService();
