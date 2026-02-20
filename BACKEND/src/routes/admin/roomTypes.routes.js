const express = require("express");
const router = express.Router();
const adminRoomTypeController = require("../../controllers/admin/roomType.controller");
const upload = require("../../middlewares/upload.middleware");
const {
  authenticateToken,
  requirePermission,
} = require("../../middlewares/auth.middleware");
const {
  validateQuery,
  validateSchema,
} = require("../../middlewares/validate.middleware");
const {
  createRoomTypeWithHotelSchema,
  listRoomTypesQuerySchema,
  updateRoomTypeSchema,
} = require("../../validations/schemaJoi/admin/roomType.validation");
const {
  addHotelImageSchema,
} = require("../../validations/schemaJoi/image.validation");

router.use(authenticateToken);

router.get(
  "/",
  requirePermission("room.manage_all"),
  validateQuery(listRoomTypesQuerySchema),
  adminRoomTypeController.listAllRoomTypes,
);

router.post(
  "/",
  requirePermission("room.manage_all"),
  validateSchema(createRoomTypeWithHotelSchema),
  adminRoomTypeController.createRoomType,
);

router.get(
  "/:roomTypeId/images",
  requirePermission("image.manage_all"),
  adminRoomTypeController.getRoomTypeImages,
);

router.post(
  "/:roomTypeId/images",
  requirePermission("image.manage_all"),
  upload.single("file"),
  validateSchema(addHotelImageSchema),
  adminRoomTypeController.addRoomTypeImage,
);

router.delete(
  "/:roomTypeId/images/:imageId",
  requirePermission("image.manage_all"),
  adminRoomTypeController.deleteRoomTypeImage,
);

router.put(
  "/:id",
  requirePermission("room.manage_all"),
  validateSchema(updateRoomTypeSchema),
  adminRoomTypeController.updateRoomType,
);

router.delete(
  "/:id",
  requirePermission("room.manage_all"),
  adminRoomTypeController.deleteRoomType,
);

module.exports = router;
