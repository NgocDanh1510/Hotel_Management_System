const paymentService = require("../payment.service");
const { toPartnerScopedUser } = require("../../utils/partnerScope");

class PartnerPaymentService {
  async listPayments(query, user) {
    return paymentService.listAllPayments(
      this._normalizeQuery(query),
      toPartnerScopedUser(user),
    );
  }

  _normalizeQuery(query) {
    return {
      ...query,
      booking_id: query.booking_id || query.bookingId,
      hotel_id: query.hotel_id || query.hotelId,
    };
  }
}

module.exports = new PartnerPaymentService();
