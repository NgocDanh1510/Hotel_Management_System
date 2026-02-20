const { Room, RoomType, Hotel, Booking, sequelize } = require("../../models");
const { Op } = require("sequelize");
const imageService = require("../image.service");

class AdminRoomService {
  /**
   * List all rooms with filtering, searching, and pagination
   * @param {Object} query - Query parameters
   * @param {Object} user - Requesting user info
   * @returns {Promise<Object>} - Rooms array and pagination meta
   */
  async listRooms(query, user) {
    const {
      hotel_id,
      hotelId,
      room_type_id,
      roomTypeId,
      status,
      floor,
      q,
      sort = "room_number",
      offset = 0,
      limit = 20,
    } = query;

    const offsetNum = Math.max(0, parseInt(offset) || 0);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 20));

    const where = {};
    const hotelWhere = {};
    const selectedHotelId = hotel_id || hotelId;
    const selectedRoomTypeId = room_type_id || roomTypeId;

    // Permission check
    const userPermissions = user.permissions || [];
    const isAdmin = userPermissions.includes("room.manage_all");
    const isHotelManager = userPermissions.includes("room.manage_own_hotel");

    if (!isAdmin && isHotelManager) {
      hotelWhere.owner_id = user.user_id;
    } else if (!isAdmin && !isHotelManager) {
      const error = new Error("Insufficient permissions");
      error.statusCode = 403;
      throw error;
    }

    if (selectedHotelId) {
      const hotel = await Hotel.findByPk(selectedHotelId);
      if (!hotel) {
        const error = new Error("Hotel not found");
        error.statusCode = 404;
        throw error;
      }

      if (!isAdmin && hotel.owner_id !== user.user_id) {
        const error = new Error("You do not have permission to access rooms for this hotel");
        error.statusCode = 403;
        throw error;
      }

      where.hotel_id = selectedHotelId;
    }

    if (selectedRoomTypeId) {
      const roomType = await RoomType.findByPk(selectedRoomTypeId, {
        include: [{ model: Hotel, attributes: ["owner_id"] }],
      });

      if (!roomType) {
        const error = new Error("Room type not found");
        error.statusCode = 404;
        throw error;
      }

      if (!isAdmin && roomType.Hotel?.owner_id !== user.user_id) {
        const error = new Error("You do not have permission to access rooms for this room type");
        error.statusCode = 403;
        throw error;
      }

      where.room_type_id = selectedRoomTypeId;
    }

    if (status) where.status = status;
    if (floor !== undefined) where.floor = floor;

    if (q) {
      where[Op.or] = [
        { room_number: { [Op.like]: `%${q}%` } },
        { "$Hotel.name$": { [Op.like]: `%${q}%` } },
      ];
    }

    let order = [];
    switch (sort) {
      case "room_number": order = [["room_number", "asc"]]; break;
      case "room_number_desc": order = [["room_number", "desc"]]; break;
      case "floor": order = [["floor", "asc"]]; break;
      case "floor_desc": order = [["floor", "desc"]]; break;
      case "status": order = [["status", "asc"]]; break;
      case "status_desc": order = [["status", "desc"]]; break;
      case "updated_at_desc": order = [["updated_at", "desc"]]; break;
      case "updated_at":
      default: order = [["updated_at", "asc"]]; break;
    }

    const { count, rows } = await Room.findAndCountAll({
      where,
      include: [
        {
          model: Hotel,
          where: hotelWhere,
          attributes: ["id", "name"],
        },
        {
          model: RoomType,
          attributes: ["id", "name"],
        },
      ],
      order,
      limit: limitNum,
      offset: offsetNum,
      distinct: true,
    });

    return {
      rooms: rows,
      meta: {
        total: count,
        offset: offsetNum,
        limit: limitNum,
        has_next: offsetNum + limitNum < count,
      },
    };
  }

  async createRoom(data, user) {
    const { hotel_id, room_type_id, room_number, floor, status } = data;

    const hotel = await Hotel.findByPk(hotel_id);
    if (!hotel) {
      const error = new Error("Hotel not found");
      error.statusCode = 404;
      throw error;
    }

    this._assertCanManageHotel(hotel, user);

    const roomType = await RoomType.findByPk(room_type_id);
    if (!roomType) {
      const error = new Error("Room type not found");
      error.statusCode = 404;
      throw error;
    }

    if (roomType.hotel_id !== hotel_id) {
      const error = new Error("Room type does not belong to this hotel");
      error.statusCode = 400;
      throw error;
    }

    const existing = await Room.findOne({
      where: { hotel_id, room_number },
    });

    if (existing) {
      const error = new Error("Room number already exists in this hotel");
      error.statusCode = 400;
      throw error;
    }

    return Room.create({
      hotel_id,
      room_type_id,
      room_number,
      floor,
      status: status || "available",
    });
  }

  /**
   * Update a room
   */
  async updateRoom(roomId, data, user) {
    const room = await Room.findByPk(roomId, {
      include: [{ model: Hotel, attributes: ["owner_id"] }],
    });

    if (!room) {
      const error = new Error("Room not found");
      error.statusCode = 404;
      throw error;
    }

    // Permission check
    const userPermissions = user.permissions || [];
    const isAdmin = userPermissions.includes("room.manage_all");
    if (!isAdmin && room.Hotel.owner_id !== user.user_id) {
      const error = new Error("You do not have permission to manage this room");
      error.statusCode = 403;
      throw error;
    }

    const { status, floor, room_number, room_type_id } = data;

    // Check room_number unique in hotel
    if (room_number && room_number !== room.room_number) {
      const existing = await Room.findOne({
        where: { hotel_id: room.hotel_id, room_number },
      });
      if (existing) {
        const error = new Error("Room number already exists in this hotel");
        error.statusCode = 400;
        throw error;
      }
    }

    // Check room_type_id same hotel
    if (room_type_id && room_type_id !== room.room_type_id) {
      const rt = await RoomType.findByPk(room_type_id);
      if (!rt || rt.hotel_id !== room.hotel_id) {
        const error = new Error("Room type does not belong to this hotel");
        error.statusCode = 400;
        throw error;
      }

      // Check for active booking
      const activeBooking = await Booking.findOne({
        where: {
          room_id: roomId,
          status: { [Op.in]: ["confirmed", "checked_in"] },
          check_out: { [Op.gt]: new Date().toISOString().split("T")[0] },
        },
      });

      if (activeBooking) {
        const error = new Error(
          "Cannot change room type while there is an active or future booking"
        );
        error.statusCode = 409;
        throw error;
      }
    }

    await room.update(data);
    return room;
  }

  async deleteRoom(roomId, user) {
    const room = await Room.findByPk(roomId, {
      include: [{ model: Hotel, attributes: ["id", "owner_id"] }],
    });

    if (!room) {
      const error = new Error("Room not found");
      error.statusCode = 404;
      throw error;
    }

    this._assertCanManageHotel(room.Hotel, user);

    const activeBooking = await Booking.findOne({
      where: {
        room_id: roomId,
        status: { [Op.in]: ["confirmed", "checked_in"] },
        check_out: { [Op.gt]: new Date().toISOString().split("T")[0] },
      },
    });

    if (activeBooking) {
      const error = new Error("Cannot delete room while there is an active or future booking");
      error.statusCode = 409;
      throw error;
    }

    const transaction = await sequelize.transaction();
    try {
      await imageService.deleteImagesForEntity("room", roomId, null, transaction);
      await room.destroy({ transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Bulk update room status
   */
  async bulkUpdateStatus(data, user) {
    const { room_ids, status } = data;

    const rooms = await Room.findAll({
      where: { id: room_ids },
      include: [{ model: Hotel, attributes: ["owner_id"] }],
    });

    if (rooms.length !== room_ids.length) {
      const error = new Error("One or more rooms not found");
      error.statusCode = 404;
      throw error;
    }

    // Permission check: All rooms must belong to owner if not admin
    const userPermissions = user.permissions || [];
    const isAdmin = userPermissions.includes("room.manage_all");
    if (!isAdmin) {
      const unauthorized = rooms.some((r) => r.Hotel.owner_id !== user.user_id);
      if (unauthorized) {
        const error = new Error("You do not have permission to manage some of these rooms");
        error.statusCode = 403;
        throw error;
      }
    }

    // If status=available, check for active bookings
    if (status === "available") {
      const today = new Date().toISOString().split("T")[0];
      const conflictingBookings = await Booking.findAll({
        where: {
          room_id: room_ids,
          status: { [Op.in]: ["confirmed", "checked_in"] },
          check_in: { [Op.lte]: today },
          check_out: { [Op.gt]: today },
        },
        attributes: ["room_id"],
      });

      if (conflictingBookings.length > 0) {
        const conflictingRoomIds = conflictingBookings.map((b) => b.room_id);
        const error = new Error("Some rooms have active bookings and cannot be set to available");
        error.statusCode = 400;
        error.conflicting_room_ids = conflictingRoomIds;
        throw error;
      }
    }

    await Room.update({ status }, { where: { id: room_ids } });

    return { updated_count: rooms.length };
  }

  _assertCanManageHotel(hotel, user) {
    const userPermissions = user.permissions || [];
    const isAdmin = userPermissions.includes("room.manage_all");
    const isHotelManager = userPermissions.includes("room.manage_own_hotel");

    if (isAdmin) return;

    if (!isHotelManager) {
      const error = new Error("Insufficient permissions");
      error.statusCode = 403;
      throw error;
    }

    if (hotel?.owner_id !== user.user_id) {
      const error = new Error("You do not have permission to manage rooms for this hotel");
      error.statusCode = 403;
      throw error;
    }
  }
}

module.exports = new AdminRoomService();
