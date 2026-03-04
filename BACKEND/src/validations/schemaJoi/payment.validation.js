const Joi = require("joi");

const createPaymentSchema = Joi.object({
  booking_id: Joi.string().guid().required(),
  amount: Joi.number().precision(2).positive().optional(),
  gateway: Joi.string().valid("vnpay", "momo", "stripe", "payos").default("payos"),
}).unknown(false);

const listAdminPaymentsQuerySchema = Joi.object({
  status: Joi.string().valid("pending", "success", "failed", "refunded").optional(),
  type: Joi.string().valid("deposit", "full_payment", "refund").optional(),
  gateway: Joi.string().valid("vnpay", "momo", "stripe", "payos").optional(),
  booking_id: Joi.string().guid().optional(),
  bookingId: Joi.string().guid().optional(),
  hotel_id: Joi.string().guid().optional(),
  hotelId: Joi.string().guid().optional(),
  paid_at_from: Joi.date().iso().optional(),
  paid_at_to: Joi.date().iso().optional(),
  amount_min: Joi.number().min(0).optional(),
  amount_max: Joi.number().min(0).optional(),
  q: Joi.string().allow("").optional(),
  sort: Joi.string()
    .valid("paid_at", "paid_at_desc", "amount", "amount_desc", "created_at", "created_at_desc")
    .default("paid_at_desc"),
  offset: Joi.number().integer().min(0).default(0),
  limit: Joi.number().integer().min(1).max(100).default(20),
}).unknown(false);

const refundPaymentSchema = Joi.object({
  amount: Joi.number().precision(2).positive().required(),
  reason: Joi.string().max(500).required(),
});

const paymentStatusParamsSchema = Joi.object({
  id: Joi.string().guid().required(),
});

const listWithdrawalsQuerySchema = Joi.object({
  status: Joi.string().valid("pending", "paid", "rejected").optional(),
  q: Joi.string().allow("").optional(),
  offset: Joi.number().integer().min(0).default(0),
  limit: Joi.number().integer().min(1).max(100).default(20),
}).unknown(false);

const createWithdrawalRequestSchema = Joi.object({
  amount: Joi.number().precision(2).positive().required(),
  bank_name: Joi.string().max(150).required(),
  bank_account_number: Joi.string().max(50).required(),
  bank_account_name: Joi.string().max(150).required(),
  bank_bin: Joi.string().max(20).allow("", null).optional(),
}).unknown(false);

const processWithdrawalRequestSchema = Joi.object({
  status: Joi.string().valid("paid", "rejected").required(),
  admin_note: Joi.string().max(1000).allow("", null).optional(),
  transfer_reference: Joi.string().max(255).allow("", null).optional(),
}).unknown(false);

module.exports = {
  createPaymentSchema,
  listAdminPaymentsQuerySchema,
  refundPaymentSchema,
  paymentStatusParamsSchema,
  listWithdrawalsQuerySchema,
  createWithdrawalRequestSchema,
  processWithdrawalRequestSchema,
};
