const { Hotel, Room, Booking, Payment } = require("../../models");
const { Op } = require("sequelize");

class PartnerDashboardService {
  async getDashboard(user) {
    const hotels = await Hotel.findAll({
      where: { owner_id: user.user_id },
      attributes: ["id", "status", "avg_rating", "review_count"],
      raw: true,
    });

    const hotelIds = hotels.map((hotel) => hotel.id);

    const hotelSummary = {
      total: hotels.length,
      pending: hotels.filter((hotel) => hotel.status === "pending").length,
      approved: hotels.filter((hotel) => hotel.status === "approved").length,
      rejected: hotels.filter((hotel) => hotel.status === "rejected").length,
    };

    const empty = {
      hotels: hotelSummary,
      rooms: {
        total: 0,
        available: 0,
        occupied: 0,
        maintenance: 0,
      },
      bookings: {
        total: 0,
        pending: 0,
        confirmed: 0,
        checked_in: 0,
        checked_out: 0,
        cancelled: 0,
        cancellation_pending: 0,
        no_show: 0,
      },
      payments: {
        total_transactions: 0,
        successful_transactions: 0,
        gross_revenue: 0,
        pending_refund_requests: 0,
      },
      reviews: {
        published_count: hotels.reduce(
          (total, hotel) => total + (parseInt(hotel.review_count, 10) || 0),
          0,
        ),
        average_rating: this._calculateWeightedAverageRating(hotels),
      },
    };

    if (hotelIds.length === 0) {
      return empty;
    }

    const [rooms, bookings, totalTransactions, successfulTransactions, grossRevenue, pendingRefundRequests] =
      await Promise.all([
        Room.findAll({
          where: { hotel_id: { [Op.in]: hotelIds } },
          attributes: ["status"],
          raw: true,
        }),
        Booking.findAll({
          where: { hotel_id: { [Op.in]: hotelIds } },
          attributes: ["status"],
          raw: true,
        }),
        Payment.count({
          include: [
            {
              model: Booking,
              attributes: [],
              required: true,
              where: { hotel_id: { [Op.in]: hotelIds } },
            },
          ],
        }),
        Payment.count({
          where: { status: "success" },
          include: [
            {
              model: Booking,
              attributes: [],
              required: true,
              where: { hotel_id: { [Op.in]: hotelIds } },
            },
          ],
        }),
        Payment.sum("amount", {
          where: {
            status: "success",
            type: { [Op.in]: ["deposit", "full_payment"] },
          },
          include: [
            {
              model: Booking,
              attributes: [],
              required: true,
              where: { hotel_id: { [Op.in]: hotelIds } },
            },
          ],
        }),
        Payment.count({
          where: {
            status: "pending",
            type: "refund",
          },
          include: [
            {
              model: Booking,
              attributes: [],
              required: true,
              where: { hotel_id: { [Op.in]: hotelIds } },
            },
          ],
        }),
      ]);

    const roomSummary = this._countStatuses(rooms, [
      "available",
      "occupied",
      "maintenance",
    ]);
    const bookingSummary = this._countStatuses(bookings, [
      "pending",
      "confirmed",
      "checked_in",
      "checked_out",
      "cancelled",
      "cancellation_pending",
      "no_show",
    ]);

    return {
      hotels: hotelSummary,
      rooms: {
        total: rooms.length,
        ...roomSummary,
      },
      bookings: {
        total: bookings.length,
        ...bookingSummary,
      },
      payments: {
        total_transactions: totalTransactions,
        successful_transactions: successfulTransactions,
        gross_revenue: parseFloat(grossRevenue || 0),
        pending_refund_requests: pendingRefundRequests,
      },
      reviews: empty.reviews,
    };
  }

  _countStatuses(items, statuses) {
    return statuses.reduce((result, status) => {
      result[status] = items.filter((item) => item.status === status).length;
      return result;
    }, {});
  }

  _calculateWeightedAverageRating(hotels) {
    const totals = hotels.reduce(
      (result, hotel) => {
        const reviewCount = parseInt(hotel.review_count, 10) || 0;
        const avgRating = parseFloat(hotel.avg_rating) || 0;

        result.reviewCount += reviewCount;
        result.ratingSum += avgRating * reviewCount;

        return result;
      },
      { reviewCount: 0, ratingSum: 0 },
    );

    if (totals.reviewCount === 0) {
      return 0;
    }

    return Number((totals.ratingSum / totals.reviewCount).toFixed(2));
  }
}

module.exports = new PartnerDashboardService();
