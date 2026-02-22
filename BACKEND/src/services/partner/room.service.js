const adminRoomService = require("../admin/room.service");
const { toPartnerScopedUser } = require("../../utils/partnerScope");

class PartnerRoomService {
  async listRooms(query, user) {
    return adminRoomService.listRooms(query, toPartnerScopedUser(user));
  }

  async createRoom(data, user) {
    return adminRoomService.createRoom(data, toPartnerScopedUser(user));
  }

  async updateRoom(roomId, data, user) {
    return adminRoomService.updateRoom(roomId, data, toPartnerScopedUser(user));
  }

  async deleteRoom(roomId, user) {
    return adminRoomService.deleteRoom(roomId, toPartnerScopedUser(user));
  }

  async bulkUpdateStatus(data, user) {
    return adminRoomService.bulkUpdateStatus(data, toPartnerScopedUser(user));
  }

  async updateAvailability(roomId, status, user) {
    return adminRoomService.bulkUpdateStatus(
      {
        room_ids: [roomId],
        status,
      },
      toPartnerScopedUser(user),
    );
  }
}

module.exports = new PartnerRoomService();
