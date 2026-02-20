const { Image, Hotel, RoomType, Room, sequelize } = require("../models");
const cloudinary = require("../config/cloudinary");
const { Op } = require("sequelize");

class ImageService {
  async getHotelImages(hotelId, user) {
    await this._assertCanManageEntity("hotel", hotelId, user);

    return Image.findAll({
      where: { entity_type: "hotel", entity_id: hotelId },
      attributes: ["id", "url", "public_id", "sort_order", "is_primary"],
      order: [
        ["sort_order", "ASC"],
        ["created_at", "ASC"],
      ],
    });
  }

  async addHotelImage(hotelId, file, imageData, user) {
    await this._assertCanManageEntity("hotel", hotelId, user);

    if (!file) {
      throw this._error("Image file is required", 400);
    }

    const upload = await this._uploadToCloudinary(file);
    let shouldCleanupUpload = true;

    const transaction = await sequelize.transaction();
    try {
      const existingImage = await Image.findOne({
        where: {
          entity_type: "hotel",
          entity_id: hotelId,
          public_id: upload.public_id,
        },
        transaction,
      });

      if (existingImage) {
        throw this._error("Image public_id already exists for this hotel", 400);
      }

      const isPrimary = this._parseBoolean(imageData.is_primary);

      if (isPrimary) {
        await Image.update(
          { is_primary: false },
          {
            where: {
              entity_type: "hotel",
              entity_id: hotelId,
              is_primary: true,
            },
            transaction,
          },
        );
      }

      const sortOrder = this._parseOptionalInteger(imageData.sort_order);
      const maxSortOrder =
        (await Image.max("sort_order", {
          where: { entity_type: "hotel", entity_id: hotelId },
          transaction,
        })) || 0;

      const image = await Image.create(
        {
          entity_type: "hotel",
          entity_id: hotelId,
          url: upload.secure_url,
          public_id: upload.public_id,
          sort_order: sortOrder !== undefined ? sortOrder : maxSortOrder + 1,
          is_primary: isPrimary,
        },
        { transaction },
      );

      await transaction.commit();
      shouldCleanupUpload = false;
      return image;
    } catch (error) {
      await transaction.rollback();
      if (shouldCleanupUpload && upload?.public_id) {
        cloudinary.uploader.destroy(upload.public_id).catch((destroyError) => {
          console.error(
            `Cloudinary cleanup error for ${upload.public_id}:`,
            destroyError,
          );
        });
      }
      throw error;
    }
  }

  async deleteHotelImage(hotelId, imageId, user) {
    await this._assertCanManageEntity("hotel", hotelId, user);

    const image = await Image.findOne({
      where: {
        id: imageId,
        entity_type: "hotel",
        entity_id: hotelId,
      },
    });

    if (!image) {
      throw this._error("Image not found", 404);
    }

    await cloudinary.uploader.destroy(image.public_id);

    const transaction = await sequelize.transaction();
    try {
      const wasPrimary = image.is_primary;

      await image.destroy({ transaction });

      if (wasPrimary) {
        const nextImage = await Image.findOne({
          where: { entity_type: "hotel", entity_id: hotelId },
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

  async getRoomTypeImages(roomTypeId, user) {
    return this.getEntityImages("room_type", roomTypeId, user);
  }

  async addRoomTypeImage(roomTypeId, file, imageData, user) {
    return this.addEntityImage("room_type", roomTypeId, file, imageData, user);
  }

  async deleteRoomTypeImage(roomTypeId, imageId, user) {
    return this.deleteEntityImage("room_type", roomTypeId, imageId, user);
  }

  async getRoomImages(roomId, user) {
    return this.getEntityImages("room", roomId, user);
  }

  async addRoomImage(roomId, file, imageData, user) {
    return this.addEntityImage("room", roomId, file, imageData, user);
  }

  async deleteRoomImage(roomId, imageId, user) {
    return this.deleteEntityImage("room", roomId, imageId, user);
  }

  async getEntityImages(entityType, entityId, user) {
    await this._assertCanManageEntity(entityType, entityId, user);

    return Image.findAll({
      where: { entity_type: entityType, entity_id: entityId },
      attributes: ["id", "url", "public_id", "sort_order", "is_primary"],
      order: [
        ["sort_order", "ASC"],
        ["created_at", "ASC"],
      ],
    });
  }

  async addEntityImage(entityType, entityId, file, imageData, user) {
    await this._assertCanManageEntity(entityType, entityId, user);

    if (!file) {
      throw this._error("Image file is required", 400);
    }

    const upload = await this._uploadToCloudinary(file);
    let shouldCleanupUpload = true;

    const transaction = await sequelize.transaction();
    try {
      const existingImage = await Image.findOne({
        where: {
          entity_type: entityType,
          entity_id: entityId,
          public_id: upload.public_id,
        },
        transaction,
      });

      if (existingImage) {
        throw this._error("Image public_id already exists for this entity", 400);
      }

      const isPrimary = this._parseBoolean(imageData.is_primary);

      if (isPrimary) {
        await Image.update(
          { is_primary: false },
          {
            where: {
              entity_type: entityType,
              entity_id: entityId,
              is_primary: true,
            },
            transaction,
          },
        );
      }

      const sortOrder = this._parseOptionalInteger(imageData.sort_order);
      const maxSortOrder =
        (await Image.max("sort_order", {
          where: { entity_type: entityType, entity_id: entityId },
          transaction,
        })) || 0;

      const image = await Image.create(
        {
          entity_type: entityType,
          entity_id: entityId,
          url: upload.secure_url,
          public_id: upload.public_id,
          sort_order: sortOrder !== undefined ? sortOrder : maxSortOrder + 1,
          is_primary: isPrimary,
        },
        { transaction },
      );

      await transaction.commit();
      shouldCleanupUpload = false;
      return image;
    } catch (error) {
      await transaction.rollback();
      if (shouldCleanupUpload && upload?.public_id) {
        cloudinary.uploader.destroy(upload.public_id).catch((destroyError) => {
          console.error(
            `Cloudinary cleanup error for ${upload.public_id}:`,
            destroyError,
          );
        });
      }
      throw error;
    }
  }

  async deleteEntityImage(entityType, entityId, imageId, user) {
    await this._assertCanManageEntity(entityType, entityId, user);

    const image = await Image.findOne({
      where: {
        id: imageId,
        entity_type: entityType,
        entity_id: entityId,
      },
    });

    if (!image) {
      throw this._error("Image not found", 404);
    }

    await cloudinary.uploader.destroy(image.public_id);

    const transaction = await sequelize.transaction();
    try {
      const wasPrimary = image.is_primary;

      await image.destroy({ transaction });

      if (wasPrimary) {
        const nextImage = await Image.findOne({
          where: { entity_type: entityType, entity_id: entityId },
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

  async deleteImagesForEntity(entityType, entityId, user, transaction) {
    await this._assertCanManageEntity(entityType, entityId, user);

    const images = await Image.findAll({
      where: { entity_type: entityType, entity_id: entityId },
      attributes: ["id", "public_id"],
      transaction,
    });

    await Promise.allSettled(
      images.map((image) => cloudinary.uploader.destroy(image.public_id)),
    );

    await Image.destroy({
      where: { entity_type: entityType, entity_id: entityId },
      transaction,
    });
  }

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
    await this._assertCanManageEntity(entityType, entityId, user);

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
  async reorderImages(imagesData, user) {
    await this._assertCanManageImages(imagesData.map((item) => item.id), user);

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
  async setPrimaryImage(imageId, user) {
    const targetImage = await Image.findByPk(imageId);
    if (!targetImage) throw this._error("Image not found", 404);
    await this._assertCanManageEntity(targetImage.entity_type, targetImage.entity_id, user);

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
  async deleteImage(imageId, user) {
    const image = await Image.findByPk(imageId);
    if (!image) throw this._error("Image not found", 404);
    await this._assertCanManageEntity(image.entity_type, image.entity_id, user);

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
    if (!user) return true;
    const perms = user.permissions || [];
    if (perms.includes("image.manage_all")) return true;
    if (perms.includes("image.manage_own_hotel") && ownerId === user.user_id) return true;
    return false;
  }

  async _assertCanManageEntity(entityType, entityId, user) {
    const ownerId = await this._getEntityOwnerId(entityType, entityId);

    if (!this._hasPermission(user, ownerId)) {
      throw this._error("You do not have permission to manage images for this entity", 403);
    }
  }

  async _assertCanManageImages(imageIds, user) {
    if (!user || (user.permissions || []).includes("image.manage_all")) {
      return;
    }

    const images = await Image.findAll({
      where: { id: { [Op.in]: imageIds } },
      attributes: ["id", "entity_type", "entity_id"],
    });

    if (images.length !== imageIds.length) {
      throw this._error("One or more images not found", 404);
    }

    await Promise.all(
      images.map((image) =>
        this._assertCanManageEntity(image.entity_type, image.entity_id, user),
      ),
    );
  }

  async _getEntityOwnerId(entityType, entityId) {
    if (entityType === "hotel") {
      const hotel = await Hotel.findByPk(entityId, {
        attributes: ["owner_id"],
      });

      if (!hotel) {
        throw this._error("Hotel not found", 404);
      }

      return hotel.owner_id;
    }

    if (entityType === "room_type") {
      const roomType = await RoomType.findByPk(entityId, {
        include: [{ model: Hotel, attributes: ["owner_id"] }],
      });

      if (!roomType) {
        throw this._error("Room type not found", 404);
      }

      return roomType.Hotel?.owner_id;
    }

    if (entityType === "room") {
      const room = await Room.findByPk(entityId, {
        include: [{ model: Hotel, attributes: ["owner_id"] }],
      });

      if (!room) {
        throw this._error("Room not found", 404);
      }

      return room.Hotel?.owner_id;
    }

    throw this._error("Invalid entity type", 400);
  }

  _error(message, statusCode) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
  }

  _parseBoolean(value) {
    return value === true || value === "true";
  }

  _parseOptionalInteger(value) {
    if (value === undefined || value === null || value === "") {
      return undefined;
    }

    return Number(value);
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
