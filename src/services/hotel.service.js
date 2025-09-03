const {
  Hotel,
  RoomType,
  Room,
  Booking,
  Review,
  Amenity,
  HotelAmenity,
  Image,
  sequelize,
} = require("../../models");
const { Op, literal, col, fn } = require("sequelize");

class HotelService {
  /**
   * List hotels with advanced filtering and availability check
   */
  async listHotels(query) {
    const {
      q,
      city,
      country,
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

    const where = { is_active: true };
    const include = [];

    // Search by name, city, address
    if (q) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${q}%` } },
        { city: { [Op.iLike]: `%${q}%` } },
        { address: { [Op.iLike]: `%${q}%` } },
      ];
    }

    // City and country filters
    if (city) where.city = city;
    if (country) where.country = country;

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
      include,
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
          city: hotel.city,
          country: hotel.country,
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
      where: { slug, is_active: true },
      include: [
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
        city: hotel.city,
        country: hotel.country,
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
}

module.exports = new HotelService();
