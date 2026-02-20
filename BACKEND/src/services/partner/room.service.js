const adminRoomService = require("../admin/room.service");

class PartnerRoomService {
  async listRooms(query, user) {
    return adminRoomService.listRooms(query, user);
  }

  async createRoom(data, user) {
    return adminRoomService.createRoom(data, user);
  }

  async updateRoom(roomId, data, user) {
    return adminRoomService.updateRoom(roomId, data, user);
  }

  async deleteRoom(roomId, user) {
    return adminRoomService.deleteRoom(roomId, user);
  }

  async bulkUpdateStatus(data, user) {
    return adminRoomService.bulkUpdateStatus(data, user);
  }

  async updateAvailability(roomId, status, user) {
    return adminRoomService.bulkUpdateStatus(
      {
        room_ids: [roomId],
        status,
      },
      user,
    );
  }
}

module.exports = new PartnerRoomService();
