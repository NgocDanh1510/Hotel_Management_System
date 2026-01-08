const { Review, User, Hotel } = require("../../models");
const { Op } = require("sequelize");

class PartnerReviewService {
  async listReviews(query, user) {
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
      if (rating_overall_min !== undefined) {
        where.rating_overall[Op.gte] = rating_overall_min;
      }
      if (rating_overall_max !== undefined) {
        where.rating_overall[Op.lte] = rating_overall_max;
      }
    }

    if (created_at_from || created_at_to) {
      where.created_at = {};
      if (created_at_from) where.created_at[Op.gte] = new Date(created_at_from);
      if (created_at_to) where.created_at[Op.lte] = new Date(created_at_to);
    }

    if (q) {
      where[Op.or] = [
        { comment: { [Op.like]: `%${q}%` } },
        { "$User.name$": { [Op.like]: `%${q}%` } },
      ];
    }

    let order = [];
    switch (sort) {
      case "created_at":
        order = [["created_at", "ASC"]];
        break;
      case "rating_overall":
        order = [["rating_overall", "ASC"]];
        break;
      case "rating_overall_desc":
        order = [["rating_overall", "DESC"]];
        break;
      case "created_at_desc":
      default:
        order = [["created_at", "DESC"]];
        break;
    }

    const { count, rows } = await Review.findAndCountAll({
      where,
      include: [
        { model: User, attributes: ["id", "name", "email"] },
        {
          model: Hotel,
          attributes: ["id", "name", "owner_id"],
          where: { owner_id: user.user_id },
          required: true,
        },
      ],
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
}

module.exports = new PartnerReviewService();
