const express = require("express");
const router = express.Router();
const partnerWalletController = require("../../controllers/partner/wallet.controller");
const { authenticateToken, requirePermission } = require("../../middlewares/auth.middleware");
const { validateQuery } = require("../../middlewares/validate.middleware");
const {
  listWithdrawalsQuerySchema,
} = require("../../validations/schemaJoi/payment.validation");

router.use(authenticateToken);
router.use(requirePermission("payment.request_payout"));

router.get("/", partnerWalletController.getWallet);

router.get(
  "/transactions",
  validateQuery(listWithdrawalsQuerySchema),
  partnerWalletController.listTransactions,
);

module.exports = router;
