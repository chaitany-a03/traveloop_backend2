const express = require('express');
const router  = express.Router();

const {
  searchPlacesController,
  nearbyPlacesController,
  placeDetailsController,
} = require('../controllers/googlePlacesController');

const { protect } = require('../middleware/auth');

/**
 * All Places routes require a valid JWT so anonymous users
 * cannot consume the Google API quota.
 */

// GET /api/places/search?city=Ahmedabad&category=tourist+attractions
router.get('/search', protect, searchPlacesController);

// GET /api/places/nearby?lat=23.0225&lng=72.5714&type=restaurant&radius=3000
router.get('/nearby', protect, nearbyPlacesController);

// GET /api/places/details/:placeId
router.get('/details/:placeId', protect, placeDetailsController);

module.exports = router;
