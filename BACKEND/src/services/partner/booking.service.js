const bookingService = require("../booking.service");
const { Booking, Hotel } = require("../../models");
const { toPartnerScopedUser } = require("../../utils/partnerScope");

class PartnerBookingService {
  async listBookings(query, user) {
    return bookingService.listAllBookings(
      this._normalizeQuery(query),
      toPartnerScopedUser(user),
    );
  }

  async getBookingDetail(bookingId, user) {
    await this._assertBookingBelongsToPartner(bookingId, user);
    return bookingService.getBookingDetail(bookingId, toPartnerScopedUser(user));
  }

  async getBookingInvoice(bookingId, user) {
    await this._assertBookingBelongsToPartner(bookingId, user);
    return bookingService.getBookingInvoice(bookingId, toPartnerScopedUser(user));
  }

  async cancelBooking(bookingId, user) {
    await this._assertBookingBelongsToPartner(bookingId, user);
    return bookingService.cancelBooking(bookingId, toPartnerScopedUser(user));
  }

  async updateBookingStatus(bookingId, status, user) {
    await this._assertBookingBelongsToPartner(bookingId, user);
    return bookingService.updateBookingStatus(
      bookingId,
      status,
      toPartnerScopedUser(user),
    );
  }

  async setNoShow(bookingId, user) {
    await this._assertBookingBelongsToPartner(bookingId, user);
    return bookingService.setBookingNoShow(bookingId, toPartnerScopedUser(user));
  }

  _normalizeQuery(query) {
    return {
      ...query,
      booking_id: query.booking_id || query.bookingId,
      hotel_id: query.hotel_id || query.hotelId,
      room_type_id: query.room_type_id || query.roomTypeId,
    };
  }

  async _assertBookingBelongsToPartner(bookingId, user) {
    const booking = await Booking.findByPk(bookingId, {
      attributes: ["id", "hotel_id"],
      include: [{ model: Hotel, attributes: ["id", "owner_id"] }],
    });

    if (!booking) {
      const error = new Error("Booking not found");
      error.statusCode = 404;
      throw error;
    }

    if (booking.Hotel?.owner_id !== user.user_id) {
      const error = new Error("You do not have permission to manage this booking");
      error.statusCode = 403;
      throw error;
    }
  }
}

module.exports = new PartnerBookingService();
