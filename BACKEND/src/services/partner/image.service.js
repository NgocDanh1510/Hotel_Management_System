const imageService = require("../image.service");
const { toPartnerScopedUser } = require("../../utils/partnerScope");

class PartnerImageService {
  async uploadImages(files, entityType, entityId, user) {
    return imageService.uploadImages(
      files,
      entityType,
      entityId,
      toPartnerScopedUser(user),
    );
  }

  async reorderImages(images, user) {
    return imageService.reorderImages(images, toPartnerScopedUser(user));
  }

  async setPrimaryImage(imageId, user) {
    return imageService.setPrimaryImage(imageId, toPartnerScopedUser(user));
  }

  async deleteImage(imageId, user) {
    return imageService.deleteImage(imageId, toPartnerScopedUser(user));
  }
}

module.exports = new PartnerImageService();
