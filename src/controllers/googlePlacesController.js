const {
  searchPlaces,
  getNearbyPlaces,
  getPlaceDetails,
} = require('../services/googlePlacesService');

/**
 * GET /api/places/search
 * Query params:
 *   city     {string} required  - e.g. "Ahmedabad"
 *   category {string} optional  - e.g. "tourist attractions" (default: "tourist attractions")
 *
 * Example: /api/places/search?city=Paris&category=restaurants
 */
const searchPlacesController = async (req, res, next) => {
  try {
    const { city, category = 'tourist attractions' } = req.query;

    if (!city || !city.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Query param "city" is required',
      });
    }

    const places = await searchPlaces(city.trim(), category.trim());

    return res.json({
      success: true,
      query:   { city: city.trim(), category: category.trim() },
      total:   places.length,
      places,
    });
  } catch (error) {
    // Surface a clear message if the API key is missing or invalid
    if (error.message?.includes('GOOGLE_MAPS_API_KEY')) {
      return res.status(503).json({
        success: false,
        message: 'Google Places API is not configured on this server.',
        detail:  error.message,
      });
    }
    next(error);
  }
};

/**
 * GET /api/places/nearby
 * Query params:
 *   lat    {number} required  - Latitude
 *   lng    {number} required  - Longitude
 *   type   {string} optional  - Place type (default: "tourist_attraction")
 *   radius {number} optional  - Metres radius (default: 5000)
 *
 * Example: /api/places/nearby?lat=23.0225&lng=72.5714&type=restaurant&radius=2000
 */
const nearbyPlacesController = async (req, res, next) => {
  try {
    const { lat, lng, type = 'tourist_attraction', radius = 5000 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Query params "lat" and "lng" are required',
      });
    }

    const parsedLat    = parseFloat(lat);
    const parsedLng    = parseFloat(lng);
    const parsedRadius = parseInt(radius, 10);

    if (isNaN(parsedLat) || isNaN(parsedLng)) {
      return res.status(400).json({
        success: false,
        message: '"lat" and "lng" must be valid numbers',
      });
    }

    if (parsedRadius < 1 || parsedRadius > 50000) {
      return res.status(400).json({
        success: false,
        message: '"radius" must be between 1 and 50000 metres',
      });
    }

    const places = await getNearbyPlaces(parsedLat, parsedLng, type.trim(), parsedRadius);

    return res.json({
      success: true,
      query:   { lat: parsedLat, lng: parsedLng, type: type.trim(), radius: parsedRadius },
      total:   places.length,
      places,
    });
  } catch (error) {
    if (error.message?.includes('GOOGLE_MAPS_API_KEY')) {
      return res.status(503).json({
        success: false,
        message: 'Google Places API is not configured on this server.',
        detail:  error.message,
      });
    }
    next(error);
  }
};

/**
 * GET /api/places/details/:placeId
 * Route param:
 *   placeId {string} required  - Google Place ID
 *
 * Example: /api/places/details/ChIJLfyY4p-BXjkRqFBFSOfMCgQ
 */
const placeDetailsController = async (req, res, next) => {
  try {
    const { placeId } = req.params;

    if (!placeId || !placeId.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Route param "placeId" is required',
      });
    }

    const details = await getPlaceDetails(placeId.trim());

    return res.json({
      success: true,
      place:   details,
    });
  } catch (error) {
    if (error.message?.includes('GOOGLE_MAPS_API_KEY')) {
      return res.status(503).json({
        success: false,
        message: 'Google Places API is not configured on this server.',
        detail:  error.message,
      });
    }
    // Handle "not found" from Google gracefully
    if (error.message?.includes('NOT_FOUND') || error.message?.includes('INVALID_REQUEST')) {
      return res.status(404).json({
        success: false,
        message: `Place not found for placeId: ${req.params.placeId}`,
      });
    }
    next(error);
  }
};

module.exports = {
  searchPlacesController,
  nearbyPlacesController,
  placeDetailsController,
};
