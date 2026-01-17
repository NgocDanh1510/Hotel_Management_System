const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/payment.controller");
const {
  authenticateToken,
  requirePermission,
  requireAnyPermission,
} = require("../middlewares/auth.middleware");
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
  requireAnyPermission([
    "payment.read_own",
    "payment.read_own_hotel",
    "payment.read_all",
  ]),
  paymentController.getPaymentDetail
);

/**
 * @route POST /api/v1/payments/:id/mock-complete
 * @desc Complete a pending payment for demo/testing flows
 * @access Private
 */
router.post(
  "/:id/mock-complete",
  authenticateToken,
  requirePermission("payment.create"),
  paymentController.mockCompletePayment
);

module.exports = router;
