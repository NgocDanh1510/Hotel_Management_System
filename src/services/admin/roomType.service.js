const { RoomType, Room, Amenity, Image, Hotel, sequelize } = require("../../models");
const { Op, literal } = require("sequelize");

class AdminRoomTypeService {
  /**
   * List room types for a specific hotel
   * @param {string} hotelId - Hotel ID
   * @param {Object} query - Query parameters
   * @param {Object} user - Requesting user info
   * @returns {Promise<Object>} - Room types array and pagination meta
   */
  async listRoomTypes(hotelId, query, user) {
    const {
      max_occupancy_min,
      max_occupancy_max,
      base_price_min,
      base_price_max,
      currency,
      q,
      sort = "created_at",
      offset = 0,
      limit = 20,
    } = query;

    const hotel = await Hotel.findByPk(hotelId);
    if (!hotel) {
      const error = new Error("Hotel not found");
      error.statusCode = 404;
      throw error;
    }

    // Permission logic: Logic nếu chỉ có room.manage_own_hotel: check hotel.owner_id === caller
    const userPermissions = user.permissions || [];
    const isAdmin = userPermissions.includes("room.manage_all");
    const isHotelManager = userPermissions.includes("room.manage_own_hotel");

    if (!isAdmin) {
      if (isHotelManager) {
        if (hotel.owner_id !== user.user_id) {
          const error = new Error(
            "You do not have permission to access room types for this hotel"
          );
          error.statusCode = 403;
          throw error;
        }
      } else {
        const error = new Error("Insufficient permissions");
        error.statusCode = 403;
        throw error;
      }
    }

    const where = { hotel_id: hotelId };
    const offsetNum = Math.max(0, parseInt(offset) || 0);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 20));

    // Filters
    if (max_occupancy_min !== undefined || max_occupancy_max !== undefined) {
      where.max_occupancy = {};
      if (max_occupancy_min !== undefined) where.max_occupancy[Op.gte] = max_occupancy_min;
      if (max_occupancy_max !== undefined) where.max_occupancy[Op.lte] = max_occupancy_max;
    }

    if (base_price_min !== undefined || base_price_max !== undefined) {
      where.base_price = {};
      if (base_price_min !== undefined) where.base_price[Op.gte] = base_price_min;
      if (base_price_max !== undefined) where.base_price[Op.lte] = base_price_max;
    }

    if (currency) {
      where.currency = currency;
    }

    if (q) {
      where.name = { [Op.like]: `%${q}%` };
    }

    // Sorting
    let order = [];
    switch (sort) {
      case "base_price":
        order = [["base_price", "asc"]];
        break;
      case "base_price_desc":
        order = [["base_price", "desc"]];
        break;
      case "max_occupancy":
        order = [["max_occupancy", "asc"]];
        break;
      case "max_occupancy_desc":
        order = [["max_occupancy", "desc"]];
        break;
      case "created_at_desc":
        order = [["created_at", "desc"]];
        break;
      case "created_at":
      default:
        order = [["created_at", "asc"]];
        break;
    }

    const { count, rows } = await RoomType.findAndCountAll({
      where,
      include: [
        {
          model: Image,
          attributes: ["id", "url", "is_primary"],
        },
        {
          model: Amenity,
          attributes: ["id", "name", "icon"],
          through: { attributes: [] },
        },
      ],
      attributes: {
        include: [
          [
            literal(`(
              SELECT COUNT(*)
              FROM rooms AS room
              WHERE
                room.room_type_id = RoomType.id
                AND room.status = 'available'
            )`),
            "available_rooms_count",
          ],
        ],
      },
      order,
      limit: limitNum,
      offset: offsetNum,
      distinct: true,
    });

    const roomTypes = rows.map((rt) => {
      const plain = rt.get({ plain: true });
      return {
        id: plain.id,
        name: plain.name,
        description: plain.description,
        max_occupancy: plain.max_occupancy,
        base_price: parseFloat(plain.base_price),
        currency: plain.currency,
        total_rooms: plain.total_rooms,
        available_rooms_count: parseInt(plain.available_rooms_count) || 0,
        images: plain.Images || [],
        amenities: plain.Amenities || [],
        created_at: plain.created_at,
      };
    });

    return {
      room_types: roomTypes,
      meta: {
        total: count,
        offset: offsetNum,
        limit: limitNum,
        has_next: offsetNum + limitNum < count,
      },
    };
  }

  /**
   * Create a new room type
   * @param {string} hotelId - Hotel ID
   * @param {Object} data - Room type data
   * @param {Object} user - Requesting user info
   * @returns {Promise<RoomType>}
   */
  async createRoomType(hotelId, data, user) {
    const hotel = await Hotel.findByPk(hotelId);
    if (!hotel) {
      const error = new Error("Hotel not found");
      error.statusCode = 404;
      throw error;
    }

    // Permission logic: Logic nếu chỉ có room.manage_own_hotel: check hotel.owner_id === caller
    const userPermissions = user.permissions || [];
    const isAdmin = userPermissions.includes("room.manage_all");
    const isHotelManager = userPermissions.includes("room.manage_own_hotel");

    if (!isAdmin) {
      if (isHotelManager) {
        if (hotel.owner_id !== user.user_id) {
          const error = new Error(
            "You do not have permission to manage room types for this hotel"
          );
          error.statusCode = 403;
          throw error;
        }
      } else {
        const error = new Error("Insufficient permissions");
        error.statusCode = 403;
        throw error;
      }
    }

    // Check unique name in same hotel
    const existingRoomType = await RoomType.findOne({
      where: {
        hotel_id: hotelId,
        name: data.name,
      },
    });

    if (existingRoomType) {
      const error = new Error("Room type name already exists in this hotel");
      error.statusCode = 400;
      throw error;
    }

    const roomType = await RoomType.create({
      ...data,
      hotel_id: hotelId,
    });

    return roomType;
  }
}

module.exports = new AdminRoomTypeService();
