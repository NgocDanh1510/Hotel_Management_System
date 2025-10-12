const { Hotel, User, Role, Booking, sequelize } = require("../../models");
const { Op, literal, col, fn } = require("sequelize");

class AdminHotelService {
  /**
   * Generate slug from hotel name
   * @param {string} name - Hotel name
   * @param {number} attempt - Attempt number for conflict resolution
   * @returns {string} - Generated slug
   */
  generateSlug(name, attempt = 0) {
    let slug = name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w-]/g, "");

    if (attempt > 0) {
      slug = `${slug}-${attempt}`;
    }

    return slug;
  }

  /**
   * Check if slug already exists
   * @param {string} slug - Slug to check
   * @param {string} excludeId - Hotel ID to exclude from check
   * @returns {Promise<Hotel|null>}
   */
  async checkSlugExists(slug, excludeId = null) {
    const where = { slug };
    if (excludeId) {
      where.id = { [Op.ne]: excludeId };
    }
    return await Hotel.findOne({ where });
  }

  /**
   * Get unique slug with conflict resolution
   * @param {string} name - Hotel name
   * @param {string} excludeId - Hotel ID to exclude from check
   * @returns {Promise<string>} - Unique slug
   */
  async getUniqueSlug(name, excludeId = null) {
    let slug = this.generateSlug(name);
    let attempt = 0;

    while (await this.checkSlugExists(slug, excludeId)) {
      attempt++;
      slug = this.generateSlug(name, attempt);
    }

    return slug;
  }

  /**
   * Validate owner exists and has required role
   * @param {string} ownerId - Owner user ID
   * @returns {Promise<User>}
   */
  async validateOwner(ownerId) {
    const user = await User.findByPk(ownerId, {
      include: [
        {
          model: Role,
          attributes: ["name"],
          through: { attributes: [] },
        },
      ],
    });

    if (!user) {
      const error = new Error("Owner not found");
      error.statusCode = 404;
      throw error;
    }

    // Check if user has hotel_staff or admin role
    const hasRequiredRole = user.Roles.some(
      (role) => role.name === "hotel_staff" || role.name === "admin",
    );

    if (!hasRequiredRole) {
      const error = new Error("Owner must have hotel_staff or admin role");
      error.statusCode = 400;
      throw error;
    }

    return user;
  }

  /**
   * Create a new hotel
   * @param {Object} data - Hotel data
   * @returns {Promise<Hotel>}
   */
  async createHotel(data) {
    const { name, owner_id, slug, ...otherData } = data;

    // Validate owner exists and has required role
    await this.validateOwner(owner_id);

    // Generate unique slug
    const finalSlug = slug || (await this.getUniqueSlug(name));

    const hotel = await Hotel.create({
      name,
      owner_id,
      slug: finalSlug,
      ...otherData,
      is_active: true,
    });

    return hotel.toJSON();
  }

  /**
   * List hotels with filters, search, sort, and pagination
   * @param {Object} query - Query parameters
   * @returns {Promise<Object>} - Hotels array and pagination meta
   */
  async listHotels(query) {
    const {
      q,
      is_active,
      owner_id,
      city,
      country,
      star_rating_min,
      star_rating_max,
      created_at_from,
      created_at_to,
      sort = "created_at",
      offset = 0,
      limit = 20,
    } = query;

    const where = {};
    const offsetNum = Math.max(0, parseInt(offset) || 0);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 20));

    // Filter by active status
    if (is_active !== undefined) {
      where.is_active = is_active === true || is_active === "true";
    }

    // Filter by owner_id
    if (owner_id) {
      where.owner_id = owner_id;
    }

    // Filter by city
    if (city) {
      where.city = city;
    }

    // Filter by country
    if (country) {
      where.country = country;
    }

    // Filter by star rating range
    if (star_rating_min || star_rating_max) {
      const ratingWhere = {};
      if (star_rating_min) {
        ratingWhere[Op.gte] = parseFloat(star_rating_min);
      }
      if (star_rating_max) {
        ratingWhere[Op.lte] = parseFloat(star_rating_max);
      }
      where.star_rating = ratingWhere;
    }

    // Filter by created_at date range
    if (created_at_from || created_at_to) {
      where.created_at = {};
      if (created_at_from) {
        where.created_at[Op.gte] = new Date(created_at_from);
      }
      if (created_at_to) {
        where.created_at[Op.lte] = new Date(created_at_to);
      }
    }

    // Search by name, slug, city
    if (q) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${q}%` } },
        { slug: { [Op.iLike]: `%${q}%` } },
        { city: { [Op.iLike]: `%${q}%` } },
      ];
    }

    // Build order clause based on sort parameter
    let order = [];
    switch (sort) {
      case "name":
        order = [["name", "asc"]];
        break;
      case "star_rating":
        order = [["star_rating", "desc"]];
        break;
      case "total_bookings":
        order = [[fn("COUNT", col("Bookings.id")), "desc"]];
        break;
      case "created_at":
      default:
        order = [["created_at", "desc"]];
        break;
    }

    const include = [];
    if (sort === "total_bookings") {
      include.push({
        model: Booking,
        attributes: [],
        required: false,
      });
    }

    const { count, rows } = await Hotel.findAndCountAll({
      where,
      include,
      order,
      limit: limitNum,
      offset: offsetNum,
      distinct: true,
      attributes: [
        "id",
        "name",
        "slug",
        "description",
        "address",
        "city",
        "country",
        "star_rating",
        "contact_email",
        "contact_phone",
        "owner_id",
        "is_active",
        "avg_rating",
        "review_count",
        "created_at",
        "updated_at",
      ],
      subQuery: false,
    });

    const hotels = rows.map((hotel) => ({
      id: hotel.id,
      name: hotel.name,
      slug: hotel.slug,
      description: hotel.description,
      address: hotel.address,
      city: hotel.city,
      country: hotel.country,
      star_rating: hotel.star_rating,
      contact_email: hotel.contact_email,
      contact_phone: hotel.contact_phone,
      owner_id: hotel.owner_id,
      is_active: hotel.is_active,
      avg_rating: hotel.avg_rating,
      review_count: hotel.review_count,
      created_at: hotel.created_at,
      updated_at: hotel.updated_at,
    }));

    const hasNext = offsetNum + limitNum < count;

    return {
      hotels,
      meta: {
        total: count,
        offset: offsetNum,
        limit: limitNum,
        has_next: hasNext,
      },
    };
  }

  /**
   * Update a hotel
   * @param {string} hotelId - Hotel ID
   * @param {Object} data - Update data
   * @param {string} userId - Current user ID
   * @param {Array<string>} userPermissions - User permissions
   * @returns {Promise<Hotel>}
   */
  async updateHotel(hotelId, data, userId, userPermissions) {
    const hotel = await Hotel.findByPk(hotelId);

    if (!hotel) {
      const error = new Error("Hotel not found");
      error.statusCode = 404;
      throw error;
    }

    // Check permission: hotel.manage_own requires ownership verification
    if (
      !userPermissions.includes("hotel.manage_all") &&
      userPermissions.includes("hotel.manage_own")
    ) {
      if (hotel.owner_id !== userId) {
        const error = new Error(
          "You do not have permission to update this hotel",
        );
        error.statusCode = 403;
        throw error;
      }
    }

    // Validate deactivation logic
    if (data.is_active === false && hotel.is_active === true) {
      // Check for active/confirmed bookings
      const activeBookings = await Booking.findOne({
        where: {
          hotel_id: hotelId,
          status: {
            [Op.in]: ["confirmed", "checked_in"],
          },
        },
      });

      if (activeBookings) {
        // Get list of active bookings for error response
        const bookingsList = await Booking.findAll({
          where: {
            hotel_id: hotelId,
            status: {
              [Op.in]: ["confirmed", "checked_in"],
            },
          },
          attributes: ["id", "status", "check_in", "check_out"],
          limit: 10,
        });

        const error = new Error("Cannot deactivate hotel with active bookings");
        error.statusCode = 409;
        error.bookings = bookingsList;
        throw error;
      }
    }

    // Update hotel
    await hotel.update(data);

    return hotel.toJSON();
  }

  /**
   * Soft delete a hotel
   * @param {string} hotelId - Hotel ID
   * @returns {Promise<Object>}
   */
  async deleteHotel(hotelId) {
    const hotel = await Hotel.findByPk(hotelId);

    if (!hotel) {
      const error = new Error("Hotel not found");
      error.statusCode = 404;
      throw error;
    }

    // Check for active bookings
    const activeBookings = await Booking.findAll({
      where: {
        hotel_id: hotelId,
        status: {
          [Op.in]: ["pending", "confirmed", "checked_in"],
        },
      },
      attributes: ["id", "status", "check_in", "check_out"],
    });

    if (activeBookings.length > 0) {
      const error = new Error("Cannot delete hotel with active bookings");
      error.statusCode = 409;
      error.bookings = activeBookings;
      throw error;
    }

    // Soft delete
    await hotel.update({ is_active: false });

    return {
      id: hotel.id,
      message: "Hotel soft deleted successfully",
    };
  }
}

module.exports = new AdminHotelService();
