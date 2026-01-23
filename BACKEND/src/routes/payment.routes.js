const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/payment.controller");
const { authenticateToken, requirePermission } = require("../middlewares/auth.middleware");
const { validateSchema } = require("../middlewares/validate.middleware");
const { createPaymentSchema } = require("../validations/schemaJoi/payment.validation");

/**
 * @route POST /api/v1/payments
 * @desc Initiate a payment for a booking
 * @access Private (payment.create)
 */
router.post(
  "/",
  authenticateToken,
  requirePermission("payment.create"),
  validateSchema(createPaymentSchema),
  paymentController.createPayment
);

/**
 * @route GET /api/v1/payments/:id
 * @desc Get payment detail
 * @access Private
 */
router.get(
  "/:id",
  authenticateToken,
  paymentController.getPaymentDetail
);

module.exports = router;
