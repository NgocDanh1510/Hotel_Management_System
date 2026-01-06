const imageService = require("../image.service");

class PartnerImageService {
  async uploadImages(files, entityType, entityId, user) {
    return imageService.uploadImages(files, entityType, entityId, user);
  }

  async reorderImages(images, user) {
    return imageService.reorderImages(images, user);
  }

  async setPrimaryImage(imageId, user) {
    return imageService.setPrimaryImage(imageId, user);
  }

  async deleteImage(imageId, user) {
    return imageService.deleteImage(imageId, user);
  }
}

module.exports = new PartnerImageService();
