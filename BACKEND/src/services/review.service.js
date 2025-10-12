const { Review, Booking, User, Hotel, sequelize } = require("../models");
const { Op } = require("sequelize");

class ReviewService {
  /**
   * Create a new review for a booking.
   *
   * @param {Object} data - Review data
   * @param {string} userId - ID of the user creating the review
   * @returns {Promise<Object>} Created review
   */
  async createReview(data, userId) {
    const {
      booking_id,
      rating_overall,
      rating_cleanliness,
      rating_service,
      rating_location,
      comment,
    } = data;

    // 1. Check if booking exists
    const booking = await Booking.findByPk(booking_id);
    if (!booking) {
      const error = new Error("Booking not found");
      error.statusCode = 404;
      throw error;
    }

    // 2. Check if booking belongs to user
    if (booking.user_id !== userId) {
      const error = new Error("You do not have permission to review this booking");
      error.statusCode = 403;
      throw error;
    }

    // 3. Check booking status
    if (booking.status !== "checked_out") {
      const error = new Error("You can only review bookings that have been checked out");
      error.statusCode = 400;
      throw error;
    }

    // 4. Check if already reviewed (UNIQUE constraint)
    const existingReview = await Review.findOne({ where: { booking_id } });
    if (existingReview) {
      const error = new Error("You have already reviewed this booking");
      error.statusCode = 400;
      throw error;
    }

    // 5. Check if within 30 days after check_out date
    const checkOutDate = new Date(booking.check_out);
    checkOutDate.setHours(23, 59, 59, 999); // End of check-out day
    
    const now = new Date();
    const diffTime = now - checkOutDate;
    const diffDays = diffTime / (1000 * 60 * 60 * 24);

    if (diffDays > 30) {
      const error = new Error("You can only review within 30 days after check-out");
      error.statusCode = 400;
      throw error;
    }
    
    if (diffTime < 0) {
        // Technically check_out is usually in the morning, and now might be afternoon of the same day.
        // But if check_out date is in the future, it wouldn't be 'checked_out' status anyway.
    }

    // 6. Create review
    const review = await Review.create({
      booking_id,
      user_id: userId,
      hotel_id: booking.hotel_id,
      rating_overall,
      rating_cleanliness: rating_cleanliness || null,
      rating_service: rating_service || null,
      rating_location: rating_location || null,
      comment: comment || null,
      is_published: false, // Default: needs approval
    });

    return review;
  }

  /**
   * Get reviews for a specific hotel.
   *
   * @param {string} hotelId - Hotel ID
   * @param {Object} query - Filter, pagination
   * @returns {Promise<Object>} List of reviews and meta
   */
  async getHotelReviews(hotelId, query) {
    const {
      rating_overall_min,
      rating_overall_max,
      offset = 0,
      limit = 10,
    } = query;

    const offsetNum = Math.max(0, parseInt(offset) || 0);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 10));

    const where = {
      hotel_id: hotelId,
      is_published: true,
    };

    if (rating_overall_min !== undefined || rating_overall_max !== undefined) {
      where.rating_overall = {};
      if (rating_overall_min !== undefined) where.rating_overall[Op.gte] = rating_overall_min;
      if (rating_overall_max !== undefined) where.rating_overall[Op.lte] = rating_overall_max;
    }

    const { count, rows } = await Review.findAndCountAll({
      where,
      include: [
        {
          model: User,
          attributes: ["name"],
        },
      ],
      order: [
        ["created_at", "DESC"],
        ["rating_overall", "DESC"],
      ],
      offset: offsetNum,
      limit: limitNum,
    });

    const reviews = rows.map((r) => {
      const plain = r.get({ plain: true });
      return {
        id: plain.id,
        user: { name: plain.User?.name || "Anonymous" },
        rating_overall: plain.rating_overall,
        comment: plain.comment,
        created_at: plain.created_at,
        ratings: {
          cleanliness: plain.rating_cleanliness,
          service: plain.rating_service,
          location: plain.rating_location,
        },
      };
    });

    return {
      reviews,
      meta: {
        total: count,
        offset: offsetNum,
        limit: limitNum,
        has_next: offsetNum + limitNum < count,
      },
    };
  }

  /**
   * List all reviews with advanced filtering for admin.
   *
   * @param {Object} query - Filters, search, sort, pagination
   * @returns {Promise<Object>} Reviews list + pagination meta
   */
  async listAllReviews(query) {
    const {
      is_published,
      hotel_id,
      user_id,
      rating_overall_min,
      rating_overall_max,
      created_at_from,
      created_at_to,
      q,
      sort = "created_at_desc",
      offset = 0,
      limit = 20,
    } = query;

    const offsetNum = Math.max(0, parseInt(offset) || 0);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 20));

    const where = {};
    if (is_published !== undefined) where.is_published = is_published;
    if (hotel_id) where.hotel_id = hotel_id;
    if (user_id) where.user_id = user_id;

    if (rating_overall_min !== undefined || rating_overall_max !== undefined) {
      where.rating_overall = {};
      if (rating_overall_min !== undefined) where.rating_overall[Op.gte] = rating_overall_min;
      if (rating_overall_max !== undefined) where.rating_overall[Op.lte] = rating_overall_max;
    }

    if (created_at_from || created_at_to) {
      where.created_at = {};
      if (created_at_from) where.created_at[Op.gte] = new Date(created_at_from);
      if (created_at_to) where.created_at[Op.lte] = new Date(created_at_to);
    }

    const include = [
      { model: User, attributes: ["id", "name", "email"] },
      { model: Hotel, attributes: ["id", "name"] },
    ];

    if (q) {
      where[Op.or] = [
        { comment: { [Op.like]: `%${q}%` } },
        { "$User.name$": { [Op.like]: `%${q}%` } },
      ];
    }

    let order = [];
    switch (sort) {
      case "created_at": order = [["created_at", "ASC"]]; break;
      case "created_at_desc": order = [["created_at", "DESC"]]; break;
      case "rating_overall": order = [["rating_overall", "ASC"]]; break;
      case "rating_overall_desc": order = [["rating_overall", "DESC"]]; break;
      default: order = [["created_at", "DESC"]]; break;
    }

    const { count, rows } = await Review.findAndCountAll({
      where,
      include,
      order,
      offset: offsetNum,
      limit: limitNum,
      distinct: true,
      subQuery: false,
    });

    return {
      reviews: rows,
      meta: {
        total: count,
        offset: offsetNum,
        limit: limitNum,
        has_next: offsetNum + limitNum < count,
      },
    };
  }

  /**
   * Update review publication status and recalculate hotel ratings.
   *
   * @param {string} reviewId - Review ID
   * @param {boolean} isPublished - Target status
   * @param {Object} user - Authenticated user
   * @returns {Promise<Object>} Updated review
   */
  async updateReviewStatus(reviewId, isPublished, user) {
    const review = await Review.findByPk(reviewId, {
      include: [{ model: Hotel, attributes: ["id", "owner_id"] }],
    });

    if (!review) {
      const error = new Error("Review not found");
      error.statusCode = 404;
      throw error;
    }

    const perms = user.permissions || [];
    const canModerateAll = perms.includes("review.moderate_all");
    const canModerateOwn = perms.includes("review.moderate_own_hotel");

    if (!canModerateAll) {
      if (canModerateOwn) {
        if (review.Hotel?.owner_id !== user.user_id) {
          const error = new Error("You do not have permission to moderate reviews for this hotel");
          error.statusCode = 403;
          throw error;
        }
      } else {
        const error = new Error("Insufficient permissions");
        error.statusCode = 403;
        throw error;
      }
    }

    await review.update({ is_published: isPublished });

    // Recalculate hotel rating
    await this._recalculateHotelRating(review.hotel_id);

    return review;
  }

  /**
   * Bulk update review status and recalculate affected hotels.
   *
   * @param {string[]} reviewIds - List of review IDs
   * @param {boolean} isPublished - Target status
   * @param {Object} user - Authenticated user
   * @returns {Promise<Object>} Update summary
   */
  async bulkUpdateReviewStatus(reviewIds, isPublished, user) {
    const perms = user.permissions || [];
    if (!perms.includes("review.moderate_all")) {
      const error = new Error("Insufficient permissions");
      error.statusCode = 403;
      throw error;
    }

    // 1. Get hotels affected
    const reviews = await Review.findAll({
      where: { id: { [Op.in]: reviewIds } },
      attributes: ["hotel_id"],
    });

    const hotelIds = [...new Set(reviews.map((r) => r.hotel_id))];

    // 2. Bulk update
    await Review.update(
      { is_published: isPublished },
      { where: { id: { [Op.in]: reviewIds } } }
    );

    // 3. Recalculate for each hotel
    for (const hotelId of hotelIds) {
      await this._recalculateHotelRating(hotelId);
    }

    return { updated_count: reviewIds.length, affected_hotels_count: hotelIds.length };
  }

  /**
   * Internal helper to recalculate avg_rating and review_count for a hotel.
   *
   * @param {string} hotelId - Hotel ID
   * @returns {Promise<void>}
   */
  async _recalculateHotelRating(hotelId) {
    const result = await Review.findOne({
      where: { hotel_id: hotelId, is_published: true },
      attributes: [
        [sequelize.fn("AVG", sequelize.col("rating_overall")), "avg_rating"],
        [sequelize.fn("COUNT", sequelize.col("id")), "review_count"],
      ],
      raw: true,
    });

    const avgRating = parseFloat(result.avg_rating) || 0;
    const reviewCount = parseInt(result.review_count) || 0;

    await Hotel.update(
      { avg_rating: avgRating, review_count: reviewCount },
      { where: { id: hotelId } }
    );
  }
}

module.exports = new ReviewService();
