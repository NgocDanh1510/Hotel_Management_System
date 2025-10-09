const { Review, Booking, User, Hotel } = require("../models");
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
}

module.exports = new ReviewService();
