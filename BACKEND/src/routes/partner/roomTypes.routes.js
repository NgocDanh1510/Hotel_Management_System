const express = require("express");
const router = express.Router();
const partnerRoomTypeController = require("../../controllers/partner/roomType.controller");
const upload = require("../../middlewares/upload.middleware");
const { authenticateToken, requirePermission } = require("../../middlewares/auth.middleware");
const { validateQuery, validateSchema } = require("../../middlewares/validate.middleware");
const {
  createRoomTypeWithHotelSchema,
  listRoomTypesQuerySchema,
  updateRoomTypeSchema,
} = require("../../validations/schemaJoi/admin/roomType.validation");
const {
  addHotelImageSchema,
} = require("../../validations/schemaJoi/image.validation");
const {
  updateRoomTypePriceSchema,
} = require("../../validations/schemaJoi/partner/roomType.validation");

router.use(authenticateToken);

router.get(
  "/",
  requirePermission("room.manage_own_hotel"),
  validateQuery(listRoomTypesQuerySchema),
  partnerRoomTypeController.listAllRoomTypes,
);

router.post(
  "/",
  requirePermission("room.manage_own_hotel"),
  validateSchema(createRoomTypeWithHotelSchema),
  partnerRoomTypeController.createRoomType,
);

router.get(
  "/:roomTypeId/images",
  requirePermission("image.manage_own_hotel"),
  partnerRoomTypeController.getRoomTypeImages,
);

router.post(
  "/:roomTypeId/images",
  requirePermission("image.manage_own_hotel"),
  upload.single("file"),
  validateSchema(addHotelImageSchema),
  partnerRoomTypeController.addRoomTypeImage,
);

router.delete(
  "/:roomTypeId/images/:imageId",
  requirePermission("image.manage_own_hotel"),
  partnerRoomTypeController.deleteRoomTypeImage,
);

router.patch(
  "/:id/price",
  requirePermission("room.set_price"),
  validateSchema(updateRoomTypePriceSchema),
  partnerRoomTypeController.updateRoomTypePrice,
);

router.put(
  "/:id",
  requirePermission("room.manage_own_hotel"),
  validateSchema(updateRoomTypeSchema),
  partnerRoomTypeController.updateRoomType,
);

router.delete(
  "/:id",
  requirePermission("room.manage_own_hotel"),
  partnerRoomTypeController.deleteRoomType,
);

module.exports = router;
