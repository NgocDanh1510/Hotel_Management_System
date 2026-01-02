const express = require('express');
const router = express.Router();
const amenityController = require('../../controllers/admin/amenity.controller');
const {
  authenticateToken,
  requirePermission,
} = require('../../middlewares/auth.middleware');
const { validateSchema } = require('../../middlewares/validate.middleware');
const { amenitySchema, updateEntityAmenitiesSchema } = require('../../validations/schemaJoi/amenity.validation');

/**
 * Global Amenity Management
 * @access Private (amenity.manage)
 */
router.get('/', authenticateToken, requirePermission('amenity.manage'), amenityController.getAllAmenities);
router.post('/', authenticateToken, requirePermission('amenity.manage'), validateSchema(amenitySchema), amenityController.createAmenity);
router.put('/:id', authenticateToken, requirePermission('amenity.manage'), validateSchema(amenitySchema), amenityController.updateAmenity);
router.delete('/:id', authenticateToken, requirePermission('amenity.manage'), amenityController.deleteAmenity);

/**
 * Hotel Specific Amenities
 * @access Private (hotel.manage_own OR hotel.manage_all)
 */
router.put('/hotels/:id', authenticateToken, requirePermission('hotel.manage_all'), validateSchema(updateEntityAmenitiesSchema), amenityController.updateHotelAmenities);

/**
 * Room Type Specific Amenities
 * @access Private (room.manage_own_hotel OR room.manage_all)
 */
router.put('/room-types/:id', authenticateToken, requirePermission('room.manage_all'), validateSchema(updateEntityAmenitiesSchema), amenityController.updateRoomTypeAmenities);

module.exports = router;
