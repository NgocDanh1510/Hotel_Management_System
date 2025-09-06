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

// All routes require authentication
router.use(authenticateToken);

/**
 * POST /api/v1/admin/hotels
 * Create a new hotel
 * Permission required: hotel.create or hotel.manage_all
 */
router.post(
  "/",
  requireAnyPermission(["hotel.create", "hotel.manage_all"]),
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

module.exports = router;
