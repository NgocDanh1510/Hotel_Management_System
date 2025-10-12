const express = require("express");
const router = express.Router();
const hotelController = require("../controllers/hotel.controller");
const reviewController = require("../controllers/review.controller");
const { validateQuery } = require("../middlewares/validate.middleware");
const { listHotelReviewsQuerySchema } = require("../validations/schemaJoi/review.validation");

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

/**
 * @route GET /api/v1/hotels/:hotelId/rooms/availability
 * @desc Check room availability for a hotel
 * @access Public
 */
router.get("/:hotelId/rooms/availability", hotelController.checkAvailability);

/**
 * @route GET /api/v1/hotels/:hotelId/reviews
 * @desc Get published reviews for a hotel
 * @access Public
 */
router.get(
  "/:hotelId/reviews",
  validateQuery(listHotelReviewsQuerySchema),
  reviewController.getHotelReviews
);

module.exports = router;
