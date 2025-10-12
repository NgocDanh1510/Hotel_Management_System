const { Amenity, Hotel, RoomType, HotelAmenity, RoomTypeAmenity, sequelize } = require("../models");
const { Op } = require("sequelize");

class AmenityService {
  async getAllAmenities() {
    return await Amenity.findAll({ order: [["name", "ASC"]] });
  }

  async createAmenity(data) {
    const { name, icon } = data;
    const existing = await Amenity.findOne({ where: { name } });
    if (existing) {
      const error = new Error("Amenity name already exists");
      error.statusCode = 400;
      throw error;
    }
    return await Amenity.create({ name, icon });
  }

  async updateAmenity(id, data) {
    const { name, icon } = data;
    const amenity = await Amenity.findByPk(id);
    if (!amenity) {
      const error = new Error("Amenity not found");
      error.statusCode = 404;
      throw error;
    }

    if (name && name !== amenity.name) {
      const existing = await Amenity.findOne({ where: { name } });
      if (existing) {
        const error = new Error("Amenity name already exists");
        error.statusCode = 400;
        throw error;
      }
    }

    return await amenity.update({ name, icon });
  }

  async deleteAmenity(id) {
    const amenity = await Amenity.findByPk(id);
    if (!amenity) {
      const error = new Error("Amenity not found");
      error.statusCode = 404;
      throw error;
    }

    // Check if being used
    const hotelUsage = await HotelAmenity.findAll({
      where: { amenity_id: id },
      include: [{ model: Hotel, attributes: ["id", "name"] }],
    });
    const roomTypeUsage = await RoomTypeAmenity.findAll({
      where: { amenity_id: id },
      include: [
        {
          model: RoomType,
          attributes: ["id", "name"],
          include: [{ model: Hotel, attributes: ["name"] }],
        },
      ],
    });

    if (hotelUsage.length > 0 || roomTypeUsage.length > 0) {
      const error = new Error("Cannot delete amenity. It is currently being used.");
      error.statusCode = 409;
      error.data = {
        hotels: hotelUsage.map((h) => h.Hotel.name),
        room_types: roomTypeUsage.map((r) => `${r.RoomType.Hotel.name} - ${r.RoomType.name}`),
      };
      throw error;
    }

    return await amenity.destroy();
  }

  async updateHotelAmenities(hotelId, amenityIds, user) {
    const hotel = await Hotel.findByPk(hotelId);
    if (!hotel) {
      const error = new Error("Hotel not found");
      error.statusCode = 404;
      throw error;
    }

    // Permission check
    const perms = user.permissions || [];
    if (!perms.includes("hotel.manage_all") && hotel.owner_id !== user.user_id) {
      const error = new Error("You do not have permission to manage this hotel");
      error.statusCode = 403;
      throw error;
    }

    // Validate amenityIds exist
    const validAmenities = await Amenity.findAll({
      where: { id: { [Op.in]: amenityIds } },
      attributes: ["id", "name"],
    });

    if (validAmenities.length !== amenityIds.length) {
      const foundIds = validAmenities.map((a) => a.id);
      const missingIds = amenityIds.filter((id) => !foundIds.includes(id));
      const error = new Error(`Some amenities were not found: ${missingIds.join(", ")}`);
      error.statusCode = 400;
      throw error;
    }

    const transaction = await sequelize.transaction();
    try {
      await HotelAmenity.destroy({ where: { hotel_id: hotelId }, transaction });
      
      const records = amenityIds.map((id) => ({
        hotel_id: hotelId,
        amenity_id: id,
      }));
      
      await HotelAmenity.bulkCreate(records, { transaction });
      
      await transaction.commit();
      
      return {
        hotel_id: hotelId,
        amenities: validAmenities,
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async updateRoomTypeAmenities(roomTypeId, amenityIds, user) {
    const roomType = await RoomType.findByPk(roomTypeId, {
      include: [{ model: Hotel }],
    });
    if (!roomType) {
      const error = new Error("Room type not found");
      error.statusCode = 404;
      throw error;
    }

    // Permission check
    const perms = user.permissions || [];
    if (!perms.includes("room.manage_all") && roomType.Hotel?.owner_id !== user.user_id) {
      const error = new Error("You do not have permission to manage this room type");
      error.statusCode = 403;
      throw error;
    }

    // Validate amenityIds exist
    const validAmenities = await Amenity.findAll({
      where: { id: { [Op.in]: amenityIds } },
      attributes: ["id", "name"],
    });

    if (validAmenities.length !== amenityIds.length) {
      const foundIds = validAmenities.map((a) => a.id);
      const missingIds = amenityIds.filter((id) => !foundIds.includes(id));
      const error = new Error(`Some amenities were not found: ${missingIds.join(", ")}`);
      error.statusCode = 400;
      throw error;
    }

    const transaction = await sequelize.transaction();
    try {
      await RoomTypeAmenity.destroy({ where: { room_type_id: roomTypeId }, transaction });
      
      const records = amenityIds.map((id) => ({
        room_type_id: roomTypeId,
        amenity_id: id,
      }));
      
      await RoomTypeAmenity.bulkCreate(records, { transaction });
      
      await transaction.commit();
      
      return {
        room_type_id: roomTypeId,
        amenities: validAmenities,
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}

module.exports = new AmenityService();
