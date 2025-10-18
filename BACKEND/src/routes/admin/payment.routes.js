const express = require("express");
const router = express.Router();
const paymentController = require("../../controllers/admin/payment.controller");
const { authenticateToken, requirePermission } = require("../../middlewares/auth.middleware");
const { validateSchema, validateQuery } = require("../../middlewares/validate.middleware");
const { listAdminPaymentsQuerySchema, refundPaymentSchema } = require("../../validations/schemaJoi/payment.validation");

/**
 * @route GET /api/v1/admin/payments
 * @desc List all payments with filtering
 * @access Private (payment.read_all)
 */
router.get(
  "/",
  authenticateToken,
  requirePermission("payment.read_all"),
  validateQuery(listAdminPaymentsQuerySchema),
  paymentController.listAllPayments
);

/**
 * @route POST /api/v1/admin/payments/:id/refund
 * @desc Process a refund for a payment
 * @access Private (payment.refund)
 */
router.post(
  "/:id/refund",
  authenticateToken,
  requirePermission("payment.refund"),
  validateSchema(refundPaymentSchema),
  paymentController.refundPayment
);

module.exports = router;
