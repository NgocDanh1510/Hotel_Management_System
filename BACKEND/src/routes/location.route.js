const express = require("express");
const router = express.Router();
const locationController = require("../controllers/location.controller");
/**
 * @route GET /api/v1/hotels/locations/cities
 * @desc List all cities
 * @access Public
 */
router.get("/locations/cities", locationController.listCities);

/**
 * @route GET /api/v1/hotels/locations/districts
 * @desc List districts, optionally filter by city_id
 * @access Public
 */
router.get("/locations/districts", locationController.listDistricts);

module.exports = router;
