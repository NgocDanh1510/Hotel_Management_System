const express = require("express");
const router = express.Router();
const adminWithdrawalController = require("../../controllers/admin/withdrawal.controller");
const { authenticateToken, requirePermission } = require("../../middlewares/auth.middleware");
const { validateSchema, validateQuery } = require("../../middlewares/validate.middleware");
const {
  listWithdrawalsQuerySchema,
  processWithdrawalRequestSchema,
} = require("../../validations/schemaJoi/payment.validation");

router.use(authenticateToken);

router.get(
  "/",
  requirePermission("payment.approve_payout"),
  validateQuery(listWithdrawalsQuerySchema),
  adminWithdrawalController.listWithdrawals,
);

router.patch(
  "/:id/status",
  requirePermission("payment.approve_payout"),
  validateSchema(processWithdrawalRequestSchema),
  adminWithdrawalController.processWithdrawal,
);

module.exports = router;
