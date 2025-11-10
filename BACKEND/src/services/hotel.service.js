const {
  Hotel,
  RoomType,
  Room,
  Booking,
  Review,
  Amenity,
  HotelAmenity,
  Image,
  District,
  City,
  sequelize,
} = require("../models");
const { Op, literal, col, fn } = require("sequelize");

class HotelService {
  /**
   * List hotels with advanced filtering and availability check
   */
  async listHotels(query) {
    const {
      q,
      district_id,
      city_id,
      star_rating_min,
      star_rating_max,
      price_min,
      price_max,
      amenity_ids,
      check_in,
      check_out,
      guests,
      sort = "created_at",
      page = 1,
      limit = 12,
    } = query;

    const where = { is_active: true, status: "active" };
    const include = [];

    // Search by name, address
    if (q) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${q}%` } },
        { address: { [Op.iLike]: `%${q}%` } },
      ];
    }

    // District and city filters
    if (district_id) where.district_id = district_id;
    if (city_id) {
      include.push({
        model: District,
        where: { city_id },
        attributes: [],
        required: true,
      });
    }

    // Star rating filter
    if (star_rating_min || star_rating_max) {
      const ratingWhere = {};
      if (star_rating_min) ratingWhere[Op.gte] = parseFloat(star_rating_min);
      if (star_rating_max) ratingWhere[Op.lte] = parseFloat(star_rating_max);
      where.star_rating = ratingWhere;
    }

    // Include RoomTypes for price and availability filtering
    const roomTypeInclude = {
      model: RoomType,
      attributes: ["id", "base_price"],
      required: false,
    };

    // Availability and guest count filter
    if (check_in && check_out) {
      roomTypeInclude.include = [
        {
          model: Room,
          attributes: [],
          required: false,
          duplicating: false,
          where: {
            status: "active",
          },
          include: [
            {
              model: Booking,
              attributes: [],
              required: false,
              where: {
                status: "confirmed",
                [Op.not]: {
                  [Op.or]: [
                    {
                      checkOut: {
                        [Op.lte]: check_in, // 11:00 <= new 14:00
                      },
                    },
                    {
                      checkIn: {
                        [Op.gte]: check_out, // 14:00 >= new 11:00
                      },
                    },
                  ],
                },
              },
            },
          ],
        },
      ];

      roomTypeInclude.group = ["RoomType.id"];

      roomTypeInclude.having = sequelize.literal(`
    COUNT(Booking.id) = 0
  `);
    }

    include.push(roomTypeInclude);

    // Amenities filter
    if (amenity_ids && Array.isArray(amenity_ids) && amenity_ids.length > 0) {
      include.push({
        model: Amenity,
        through: HotelAmenity,
        attributes: [],
        required: true,
        where: { id: { [Op.in]: amenity_ids } },
        duplicating: false,
      });
    }

    // Build order clause
    let order = [];
    if (sort === "star_rating") {
      order = [["star_rating", "DESC"]];
    } else if (sort === "price_asc") {
      order = [
        [sequelize.fn("MIN", sequelize.col("`RoomTypes`.`base_price`")), "ASC"],
      ];
    } else if (sort === "price_desc") {
      order = [
        [
          sequelize.fn("MIN", sequelize.col("`RoomTypes`.`base_price`")),
          "DESC",
        ],
      ];
    } else if (sort === "avg_rating") {
      order = [["avg_rating", "DESC"]];
    } else {
      order = [["created_at", "DESC"]];
    }

    const offset = (page - 1) * limit;

    // Get hotels with aggregations
    let hotels = await Hotel.findAll({
      where,
      include: [
        ...include,
        {
          model: District,
          attributes: ["id", "name"],
          include: [{ model: City, attributes: ["id", "name"] }],
        },
      ],
      order,
      limit: parseInt(limit),
      offset,
      distinct: true,
      raw: false,
      subQuery: false,
    });

    // Filter by price range if provided
    if (price_min || price_max) {
      hotels = hotels.filter((hotel) => {
        const minPrice = Math.min(
          ...hotel.RoomTypes.map((rt) => parseFloat(rt.base_price)),
        );
        if (price_min && minPrice < parseFloat(price_min)) return false;
        if (price_max && minPrice > parseFloat(price_max)) return false;
        return true;
      });
    }

    // Get primary images for each hotel
    const hotelsWithImages = await Promise.all(
      hotels.map(async (hotel) => {
        const primaryImage = await Image.findOne({
          where: {
            entity_type: "hotel",
            entity_id: hotel.id,
            is_primary: true,
          },
          attributes: ["url"],
        });

        const minPrice = Math.min(
          ...hotel.RoomTypes.map((rt) => parseFloat(rt.base_price)),
        );

        return {
          id: hotel.id,
          name: hotel.name,
          slug: hotel.slug,
          district: hotel.District?.name,
          city: hotel.District?.City?.name,
          star_rating: parseFloat(hotel.star_rating) || 0,
          avg_rating: parseFloat(hotel.avg_rating) || 0,
          review_count: hotel.review_count || 0,
          min_price: minPrice,
          primary_image_url: primaryImage?.url || null,
        };
      }),
    );

    // Get total count for pagination
    const total = await Hotel.count({
      where,
      include,
      distinct: true,
      subQuery: false,
    });

    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;

    return {
      hotels: hotelsWithImages,
      meta: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        has_next: hasNext,
      },
    };
  }

  /**
   * Get hotel detail by slug
   */
  async getHotelDetail(slug) {
    const hotel = await Hotel.findOne({
      where: { slug, is_active: true, status: "active" },
      include: [
        {
          model: District,
          attributes: ["id", "name"],
          include: [{ model: City, attributes: ["id", "name"] }],
        },
        {
          model: RoomType,
          attributes: ["id", "name", "max_occupancy", "base_price"],
          include: [
            {
              model: Amenity,
              through: { attributes: [] },
              attributes: ["id", "name"],
            },
            {
              model: Image,
              attributes: ["id", "url", "is_primary"],
              where: { entity_type: "room_type" },
              required: false,
            },
          ],
        },
        {
          model: Amenity,
          through: { attributes: [] },
          attributes: ["id", "name"],
        },
        {
          model: Image,
          attributes: ["id", "url", "is_primary"],
          where: { entity_type: "hotel" },
          required: false,
        },
      ],
    });

    if (!hotel) {
      const error = new Error("Hotel not found");
      error.statusCode = 404;
      throw error;
    }

    // Get rating breakdown from reviews
    const reviews = await Review.findAll({
      where: {
        hotel_id: hotel.id,
        is_published: true,
      },
      attributes: ["rating_cleanliness", "rating_service", "rating_location"],
      raw: true,
    });

    const ratingBreakdown = {
      cleanliness: 0,
      service: 0,
      location: 0,
    };

    if (reviews.length > 0) {
      const cleanlinessAvg = reviews.reduce(
        (sum, r) => sum + (r.rating_cleanliness || 0),
        0,
      );
      const serviceAvg = reviews.reduce(
        (sum, r) => sum + (r.rating_service || 0),
        0,
      );
      const locationAvg = reviews.reduce(
        (sum, r) => sum + (r.rating_location || 0),
        0,
      );

      ratingBreakdown.cleanliness = +(cleanlinessAvg / reviews.length).toFixed(
        2,
      );
      ratingBreakdown.service = +(serviceAvg / reviews.length).toFixed(2);
      ratingBreakdown.location = +(locationAvg / reviews.length).toFixed(2);
    }

    return {
      hotel: {
        id: hotel.id,
        name: hotel.name,
        slug: hotel.slug,
        description: hotel.description,
        address: hotel.address,
        district: hotel.District?.name,
        city: hotel.District?.City?.name,
        star_rating: parseFloat(hotel.star_rating) || 0,
        contact_email: hotel.contact_email,
        contact_phone: hotel.contact_phone,
        created_at: hotel.created_at,
      },
      room_types: hotel.RoomTypes.map((rt) => ({
        id: rt.id,
        name: rt.name,
        max_occupancy: rt.max_occupancy,
        base_price: parseFloat(rt.base_price),
        images: rt.Images || [],
        amenities: rt.Amenities || [],
      })),
      amenities: hotel.Amenities || [],
      images: hotel.Images || [],
      avg_rating: parseFloat(hotel.avg_rating) || 0,
      review_count: hotel.review_count || 0,
      rating_breakdown: ratingBreakdown,
    };
  }
  /**
   * Check room availability for a hotel
   * @param {string} hotelId - Hotel ID
   * @param {Object} query - { check_in, check_out, guests }
   * @returns {Promise<Array>} - Available room types with counts
   */
  async checkAvailability(hotelId, query) {
    const { check_in, check_out, guests } = query;

    // Get all room types for this hotel with occupancy filter
    const roomTypes = await RoomType.findAll({
      where: {
        hotel_id: hotelId,
        max_occupancy: { [Op.gte]: parseInt(guests) },
      },
      include: [
        {
          model: Amenity,
          through: { attributes: [] },
          attributes: ["id", "name", "icon"],
        },
        {
          model: Image,
          attributes: ["id", "url", "is_primary"],
          where: { entity_type: "room_type" },
          required: false,
        },
      ],
    });

    const availabilityResult = await Promise.all(
      roomTypes.map(async (rt) => {
        // Find rooms of this type that are NOT in maintenance
        const rooms = await Room.findAll({
          where: {
            room_type_id: rt.id,
            status: { [Op.ne]: "maintenance" },
          },
          attributes: ["id"],
        });

        const roomIds = rooms.map((r) => r.id);
        if (roomIds.length === 0) {
          return {
            room_type: rt.get({ plain: true }),
            available_rooms: 0,
            price: parseFloat(rt.base_price),
          };
        }

        // Count booked rooms for this type and period
        const bookedRoomsCount = await Booking.count({
          where: {
            room_id: roomIds,
            status: { [Op.in]: ["confirmed", "checked_in"] },
            [Op.not]: {
              [Op.or]: [
                { check_out: { [Op.lte]: check_in } },
                { check_in: { [Op.gte]: check_out } },
              ],
            },
          },
          distinct: true,
          col: "room_id",
        });

        const availableCount = Math.max(0, roomIds.length - bookedRoomsCount);

        return {
          room_type: rt.get({ plain: true }),
          available_rooms: availableCount,
          price: parseFloat(rt.base_price),
        };
      }),
    );

    return availabilityResult;
  }
}

module.exports = new HotelService();
