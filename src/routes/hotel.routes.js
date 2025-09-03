const express = require("express");
const router = express.Router();
const hotelController = require("../controllers/hotel.controller");

/**
 * @route GET /api/v1/hotels
 * @desc List all public hotels with filtering
 * @access Public
 */
router.get("/", hotelController.listHotels);

/**
 * @route GET /api/v1/hotels/:slug
 * @desc Get hotel detail with room types, amenities, images
 * @access Public
 */
router.get("/:slug", hotelController.getHotelDetail);

module.exports = router;
