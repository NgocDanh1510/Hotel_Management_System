const express = require("express");
const router = express.Router();
const partnerHotelsController = require("../../controllers/partner/hotels.controller");
const partnerRoomTypeController = require("../../controllers/partner/roomType.controller");
const { authenticateToken, requirePermission } = require("../../middlewares/auth.middleware");
const { validateSchema, validateQuery } = require("../../middlewares/validate.middleware");
const {
  createPartnerHotelSchema,
  updatePartnerHotelSchema,
} = require("../../validations/schemaJoi/partner/hotels.validation");
const {
  listHotelsQuerySchema,
} = require("../../validations/schemaJoi/admin/hotels.validation");
const {
  createRoomTypeSchema,
  listRoomTypesQuerySchema,
} = require("../../validations/schemaJoi/admin/roomType.validation");

router.use(authenticateToken);

router.post(
  "/",
  requirePermission("hotel.create"),
  validateSchema(createPartnerHotelSchema),
  partnerHotelsController.createHotel,
);

router.get(
  "/",
  requirePermission("hotel.read_all"),
  validateQuery(listHotelsQuerySchema),
  partnerHotelsController.listHotels,
);

router.put(
  "/:id",
  requirePermission("hotel.manage_own"),
  validateSchema(updatePartnerHotelSchema),
  partnerHotelsController.updateHotel,
);

router.post(
  "/:id/submit-for-review",
  requirePermission("hotel.submit_for_review"),
  partnerHotelsController.submitForReview,
);

router.get(
  "/:hotelId/room-types",
  requirePermission("room.manage_own_hotel"),
  validateQuery(listRoomTypesQuerySchema),
  partnerRoomTypeController.listRoomTypes,
);

router.post(
  "/:hotelId/room-types",
  requirePermission("room.manage_own_hotel"),
  validateSchema(createRoomTypeSchema),
  partnerRoomTypeController.createRoomType,
);

module.exports = router;
