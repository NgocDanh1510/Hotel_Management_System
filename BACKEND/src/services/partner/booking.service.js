const bookingService = require("../booking.service");

class PartnerBookingService {
  async listBookings(query, user) {
    return bookingService.listAllBookings(query, user);
  }

  async getBookingDetail(bookingId, user) {
    return bookingService.getBookingDetail(bookingId, user);
  }

  async getBookingInvoice(bookingId, user) {
    return bookingService.getBookingInvoice(bookingId, user);
  }

  async cancelBooking(bookingId, user) {
    return bookingService.cancelBooking(bookingId, user);
  }

  async updateBookingStatus(bookingId, status, user) {
    return bookingService.updateBookingStatus(bookingId, status, user);
  }

  async setNoShow(bookingId, user) {
    return bookingService.setBookingNoShow(bookingId, user);
  }
}

module.exports = new PartnerBookingService();
