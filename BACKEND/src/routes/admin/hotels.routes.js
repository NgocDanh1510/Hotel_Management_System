const express = require("express");
const router = express.Router();
const adminHotelsController = require("../../controllers/admin/hotels.controller");
const {
  authenticateToken,
  requirePermission,
  requireAnyPermission,
} = require("../../middlewares/auth.middleware");
const { validateSchema } = require("../../middlewares/validate.middleware");
const {
  createHotelSchema,
  updateHotelSchema,
} = require("../../validations/schemaJoi/admin/hotels.validation");
const adminRoomTypeController = require("../../controllers/admin/roomType.controller");
const {
  createRoomTypeSchema,
  listRoomTypesQuerySchema,
} = require("../../validations/schemaJoi/admin/roomType.validation");

// All routes require authentication
router.use(authenticateToken);

/**
 * POST /api/v1/admin/hotels
 * Create a new hotel
 * Permission required: hotel.create or hotel.manage_all
 */
router.post(
  "/",
  requirePermission("hotel.create"),
  validateSchema(createHotelSchema),
  adminHotelsController.createHotel,
);

/**
 * GET /api/v1/admin/hotels
 * List all hotels with filters, search, sort, and pagination
 * Permission required: hotel.read_all
 */
router.get(
  "/",
  requirePermission("hotel.read_all"),

  adminHotelsController.listHotels,
);

/**
 * PUT /api/v1/admin/hotels/:id
 * Update a hotel
 * Permission required: hotel.manage_own or hotel.manage_all
 */
router.put(
  "/:id",
  requireAnyPermission(["hotel.manage_own", "hotel.manage_all"]),
  validateSchema(updateHotelSchema),
  adminHotelsController.updateHotel,
);

/**
 * DELETE /api/v1/admin/hotels/:id
 * Soft delete a hotel
 * Permission required: hotel.manage_all
 */
router.delete(
  "/:id",
  requirePermission("hotel.manage_all"),
  adminHotelsController.deleteHotel,
);

/**
 * GET /api/v1/admin/hotels/:hotelId/room-types
 * List room types for a specific hotel
 */
router.get(
  "/:hotelId/room-types",
  requireAnyPermission(["room.manage_own_hotel", "room.manage_all"]),
  adminRoomTypeController.listRoomTypes,
);

/**
 * POST /api/v1/admin/hotels/:hotelId/room-types
 * Create a new room type for a hotel
 */
router.post(
  "/:hotelId/room-types",
  requireAnyPermission(["room.manage_own_hotel", "room.manage_all"]),
  validateSchema(createRoomTypeSchema),
  adminRoomTypeController.createRoomType,
);

/**
 * PUT /api/v1/admin/hotels/change-status/:id
 * Update hotel status ("pending", "approved", "rejected")
 * Permission required: hotel.manage_all
 */
router.put(
  "/change-status/:id",
  (req, res, next) => {
    if (req.body.status === "approved") {
      return requirePermission("hotel.approve")(req, res, next);
    }
    if (req.body.status === "rejected") {
      return requirePermission("hotel.reject")(req, res, next);
    }
    // TODO: verify permission
    return requirePermission("hotel.manage_all")(req, res, next);
  },
  adminHotelsController.updateHotelStatus,
);
module.exports = router;
