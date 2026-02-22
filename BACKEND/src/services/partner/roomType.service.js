const { RoomType, Hotel } = require("../../models");
const adminRoomTypeService = require("../admin/roomType.service");
const { toPartnerScopedUser } = require("../../utils/partnerScope");

class PartnerRoomTypeService {
  async listRoomTypesByQuery(query, user) {
    return adminRoomTypeService.listRoomTypesByQuery(
      query,
      toPartnerScopedUser(user),
    );
  }

  async listRoomTypes(hotelId, query, user) {
    return adminRoomTypeService.listRoomTypes(
      hotelId,
      query,
      toPartnerScopedUser(user),
    );
  }

  async createRoomType(hotelId, data, user) {
    return adminRoomTypeService.createRoomType(
      hotelId,
      data,
      toPartnerScopedUser(user),
    );
  }

  async updateRoomType(roomTypeId, data, user) {
    return adminRoomTypeService.updateRoomType(
      roomTypeId,
      data,
      toPartnerScopedUser(user),
    );
  }

  async deleteRoomType(roomTypeId, user) {
    return adminRoomTypeService.deleteRoomType(
      roomTypeId,
      toPartnerScopedUser(user),
    );
  }

  async updateRoomTypePrice(roomTypeId, data, user) {
    const roomType = await RoomType.findByPk(roomTypeId, {
      include: [{ model: Hotel, attributes: ["id", "owner_id"] }],
    });

    if (!roomType) {
      const error = new Error("Room type not found");
      error.statusCode = 404;
      throw error;
    }

    if (roomType.Hotel?.owner_id !== user.user_id) {
      const error = new Error("You do not have permission to manage this room type");
      error.statusCode = 403;
      throw error;
    }

    await roomType.update({
      base_price: data.base_price,
      currency: data.currency || roomType.currency,
    });

    return roomType;
  }
}

module.exports = new PartnerRoomTypeService();
