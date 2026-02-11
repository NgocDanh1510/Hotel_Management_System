const express = require("express");
const router = express.Router();
const partnerHotelsController = require("../../controllers/partner/hotels.controller");
const partnerRoomTypeController = require("../../controllers/partner/roomType.controller");
const upload = require("../../middlewares/upload.middleware");
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
const {
  addHotelImageSchema,
} = require("../../validations/schemaJoi/image.validation");

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
  "/:hotelId/images",
  requirePermission("image.manage_own_hotel"),
  partnerHotelsController.getHotelImages,
);

router.post(
  "/:hotelId/images",
  requirePermission("image.manage_own_hotel"),
  upload.single("file"),
  validateSchema(addHotelImageSchema),
  partnerHotelsController.addHotelImage,
);

router.delete(
  "/:hotelId/images/:imageId",
  requirePermission("image.manage_own_hotel"),
  partnerHotelsController.deleteHotelImage,
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
