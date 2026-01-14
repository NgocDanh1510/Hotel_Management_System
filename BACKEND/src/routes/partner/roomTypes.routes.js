const express = require("express");
const router = express.Router();
const partnerRoomTypeController = require("../../controllers/partner/roomType.controller");
const { authenticateToken, requirePermission } = require("../../middlewares/auth.middleware");
const { validateSchema } = require("../../middlewares/validate.middleware");
const {
  updateRoomTypePriceSchema,
} = require("../../validations/schemaJoi/partner/roomType.validation");

router.use(authenticateToken);

router.patch(
  "/:id/price",
  requirePermission("room.set_price"),
  validateSchema(updateRoomTypePriceSchema),
  partnerRoomTypeController.updateRoomTypePrice,
);

module.exports = router;
