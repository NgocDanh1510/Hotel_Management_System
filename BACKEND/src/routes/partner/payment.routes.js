const express = require("express");
const router = express.Router();
const partnerPaymentController = require("../../controllers/partner/payment.controller");
const { authenticateToken, requirePermission } = require("../../middlewares/auth.middleware");
const { validateQuery } = require("../../middlewares/validate.middleware");
const {
  listAdminPaymentsQuerySchema,
} = require("../../validations/schemaJoi/payment.validation");

router.use(authenticateToken);

router.get(
  "/",
  requirePermission("payment.read_own_hotel"),
  validateQuery(listAdminPaymentsQuerySchema),
  partnerPaymentController.listPayments,
);

module.exports = router;
