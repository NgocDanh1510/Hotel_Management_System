const express = require("express");
const router = express.Router();
const webhookController = require("../controllers/webhook.controller");

/**
 * @route POST /api/v1/webhooks/payment/:gateway
 * @desc Receive payment notifications from third-party gateways (VNPAY, MoMo, Stripe)
 * @access Public (Signature verification inside controller)
 */
router.post("/payment/:gateway", webhookController.handlePaymentWebhook);

module.exports = router;
