const paymentService = require("../payment.service");

class PartnerPaymentService {
  async listPayments(query, user) {
    return paymentService.listAllPayments(query, user);
  }
}

module.exports = new PartnerPaymentService();
