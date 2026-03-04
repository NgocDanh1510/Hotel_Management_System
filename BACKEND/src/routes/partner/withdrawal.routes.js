const express = require("express");
const router = express.Router();
const partnerWithdrawalController = require("../../controllers/partner/withdrawal.controller");
const { authenticateToken, requirePermission } = require("../../middlewares/auth.middleware");
const { validateSchema, validateQuery } = require("../../middlewares/validate.middleware");
const {
  createWithdrawalRequestSchema,
  listWithdrawalsQuerySchema,
} = require("../../validations/schemaJoi/payment.validation");

router.use(authenticateToken);
router.use(requirePermission("payment.request_payout"));

router.get(
  "/",
  validateQuery(listWithdrawalsQuerySchema),
  partnerWithdrawalController.listWithdrawals,
);

router.post(
  "/",
  validateSchema(createWithdrawalRequestSchema),
  partnerWithdrawalController.createWithdrawal,
);

module.exports = router;
