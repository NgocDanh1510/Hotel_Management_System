const webhookService = require("../services/webhook.service");
const { sendSuccess, sendError } = require("../utils/apiResponse");

/**
 * POST /api/v1/webhooks/payment/:gateway
 * Handle asynchronous payment notifications from gateways.
 */
const handlePaymentWebhook = async (req, res, next) => {
  try {
    const { gateway } = req.params;
    
    // In a production environment, you would verify the signature here
    // Example: verifyHmac(req.body, req.headers['x-signature'], secret)

    const result = await webhookService.handleWebhook(gateway, req.body);

    // Most gateways expect a simple 200 OK or a specific JSON response to acknowledge receipt
    return res.status(200).json({
      statusCode: 200,
      message: result.message,
      status: result.status,
    });
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, {
        statusCode: error.statusCode,
        message: error.message,
      });
    }
    console.error(`Webhook error (${req.params.gateway}):`, error);
    // Even if processing fails, sometimes it's better to return 200 to stop gateway retries
    // unless you want the gateway to retry later.
    next(error);
  }
};

module.exports = {
  handlePaymentWebhook,
};
