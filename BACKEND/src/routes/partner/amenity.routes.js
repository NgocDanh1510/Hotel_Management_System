const express = require("express");
const router = express.Router();
const partnerAmenityController = require("../../controllers/partner/amenity.controller");
const { authenticateToken, requirePermission } = require("../../middlewares/auth.middleware");
const { validateSchema } = require("../../middlewares/validate.middleware");
const {
  updateEntityAmenitiesSchema,
} = require("../../validations/schemaJoi/amenity.validation");

router.use(authenticateToken);

router.get(
  "/",
  requirePermission("amenity.read_all"),
  partnerAmenityController.getAllAmenities,
);

router.put(
  "/hotels/:id",
  requirePermission("hotel.manage_own"),
  validateSchema(updateEntityAmenitiesSchema),
  partnerAmenityController.updateHotelAmenities,
);

router.put(
  "/room-types/:id",
  requirePermission("room.manage_own_hotel"),
  validateSchema(updateEntityAmenitiesSchema),
  partnerAmenityController.updateRoomTypeAmenities,
);

module.exports = router;
