const amenityService = require("../amenity.service");

class PartnerAmenityService {
  async getAllAmenities() {
    return amenityService.getAllAmenities();
  }

  async updateHotelAmenities(hotelId, amenityIds, user) {
    return amenityService.updateHotelAmenities(hotelId, amenityIds, user);
  }

  async updateRoomTypeAmenities(roomTypeId, amenityIds, user) {
    return amenityService.updateRoomTypeAmenities(roomTypeId, amenityIds, user);
  }
}

module.exports = new PartnerAmenityService();
