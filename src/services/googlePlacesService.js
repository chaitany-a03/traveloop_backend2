const axios = require('axios');

const BASE_URL = 'https://maps.googleapis.com/maps/api';
const API_KEY = process.env.GOOGLE_MAPS_API_KEY;

/**
 * Map Traveloop-friendly category names to Google Places API types.
 */
const CATEGORY_TYPE_MAP = {
  'tourist attractions': 'tourist_attraction',
  'tourist_attraction':  'tourist_attraction',
  'cafe':                'cafe',
  'cafes':               'cafe',
  'restaurant':          'restaurant',
  'restaurants':         'restaurant',
  'hotel':               'lodging',
  'hotels':              'lodging',
  'bar':                 'bar',
  'bars':                'bar',
  'museum':              'museum',
  'museums':             'museum',
  'park':                'park',
  'parks':               'park',
  'shopping':            'shopping_mall',
  'airport':             'airport',
  'hospital':            'hospital',
  'bank':                'bank',
  'atm':                 'atm',
  'pharmacy':            'pharmacy',
};

/**
 * Build a public photo URL from a Google photo reference.
 * @param {string} photoReference
 * @param {number} maxWidth
 * @returns {string}
 */
const buildPhotoUrl = (photoReference, maxWidth = 800) => {
  if (!photoReference) return null;
  return `${BASE_URL}/place/photo?maxwidth=${maxWidth}&photoreference=${photoReference}&key=${API_KEY}`;
};

// --- Caching layer ---
const queryCache = new Map();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes cache

const getCachedData = (key) => {
  if (queryCache.has(key)) {
    const cached = queryCache.get(key);
    if (Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
    queryCache.delete(key);
  }
  return null;
};

const setCachedData = (key, data) => {
  queryCache.set(key, { timestamp: Date.now(), data });
};

/**
 * Standardize place payloads across all Google APIs.
 */
const normalizePlace = (place) => ({
  placeId:  place.place_id || place.placeId || null,
  name:     place.name || 'Unknown',
  address:  place.formatted_address || place.vicinity || place.address || '',
  rating:   place.rating ? parseFloat(place.rating) : null,
  totalRatings: place.user_ratings_total || place.totalRatings || 0,
  types:    place.types || [],
    location: (function(){
    const loc = place.geometry?.location || place.location || null;
    if (!loc) return null;
    const lat = typeof loc.lat === 'function' ? loc.lat() : loc.lat;
    const lng = typeof loc.lng === 'function' ? loc.lng() : loc.lng;
    return { lat, lng };
  })(),
  openNow:  place.opening_hours?.open_now ?? place.openNow ?? null,
  photoUrl: place.photoUrl || (place.photos?.[0]?.photo_reference
    ? buildPhotoUrl(place.photos[0].photo_reference)
    : null),
  priceLevel: place.price_level ?? place.priceLevel ?? null,
  icon:     place.icon || null,
});

/**
 * FUNCTION 1 — Search places in a city by category/keyword.
 * Uses the Text Search endpoint for maximum flexibility.
 *
 * @param {string} city       - e.g. "Ahmedabad"
 * @param {string} category   - e.g. "tourist attractions" | "restaurants"
 * @returns {Promise<object[]>}
 */
const searchPlaces = async (city, category = 'tourist attractions') => {
  if (!API_KEY) throw new Error('GOOGLE_MAPS_API_KEY is not configured');

  const cacheKey = `search:${city.toLowerCase().trim()}:${category.toLowerCase().trim()}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  let query = category;
  if (!category.toLowerCase().includes(city.toLowerCase().trim())) {
    query = `${category} in ${city}`;
  }

    const response = await axios.get(`${BASE_URL}/place/textsearch/json`, {
      params: {
        query,
        key: API_KEY,
      },
      timeout: 10000,
    });

  if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
    throw new Error(`Google Places API error: ${response.data.status} — ${response.data.error_message || ''}`);
  }

  const normalized = (response.data.results || []).map(normalizePlace);
  setCachedData(cacheKey, normalized);
  return normalized;
};

/**
 * FUNCTION 2 — Fetch nearby places given lat/lng coordinates and a type.
 * Uses the Nearby Search endpoint.
 *
 * @param {number} lat    - Latitude
 * @param {number} lng    - Longitude
 * @param {string} type   - Google place type (e.g. "restaurant", "cafe")
 * @param {number} radius - Search radius in metres (default 5000)
 * @returns {Promise<object[]>}
 */
const getNearbyPlaces = async (lat, lng, type = 'tourist_attraction', radius = 5000) => {
  if (!API_KEY) throw new Error('GOOGLE_MAPS_API_KEY is not configured');

  const cacheKey = `nearby:${lat.toFixed(4)}:${lng.toFixed(4)}:${type}:${radius}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  // Resolve friendly type alias
  const resolvedType = CATEGORY_TYPE_MAP[type.toLowerCase()] || type;

    const response = await axios.get(`${BASE_URL}/place/nearbysearch/json`, {
      params: {
        location: `${lat},${lng}`,
        radius,
        type: resolvedType,
        key: API_KEY,
      },
      timeout: 10000,
    });

  if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
    throw new Error(`Google Places API error: ${response.data.status} — ${response.data.error_message || ''}`);
  }

  const normalized = (response.data.results || []).map(normalizePlace);
  setCachedData(cacheKey, normalized);
  return normalized;
};

/**
 * FUNCTION 3 — Get a direct photo URL from a photo reference string.
 * Returns the redirect URL that Google uses to serve the actual image.
 *
 * @param {string} photoReference
 * @param {number} maxWidth
 * @returns {string}
 */
const getPlacePhoto = (photoReference, maxWidth = 800) => {
  if (!API_KEY) throw new Error('GOOGLE_MAPS_API_KEY is not configured');
  if (!photoReference) throw new Error('photoReference is required');
  return buildPhotoUrl(photoReference, maxWidth);
};

/**
 * FUNCTION 4 — Fetch detailed information about a specific place by its placeId.
 * Uses the Place Details endpoint.
 *
 * @param {string} placeId
 * @returns {Promise<object>}
 */
const getPlaceDetails = async (placeId) => {
  if (!API_KEY) throw new Error('GOOGLE_MAPS_API_KEY is not configured');
  if (!placeId) throw new Error('placeId is required');

  const fields = [
    'place_id',
    'name',
    'formatted_address',
    'formatted_phone_number',
    'website',
    'rating',
    'user_ratings_total',
    'price_level',
    'opening_hours',
    'photos',
    'types',
    'geometry',
    'reviews',
    'url',
  ].join(',');

    const response = await axios.get(`${BASE_URL}/place/details/json`, {
      params: {
        place_id: placeId,
        fields,
        key: API_KEY,
      },
      timeout: 10000,
    });

  if (response.data.status !== 'OK') {
    throw new Error(`Google Places API error: ${response.data.status} — ${response.data.error_message || ''}`);
  }

  const p = response.data.result;

  // Return an enriched clean object for the details endpoint
  return {
    placeId:       p.place_id,
    name:          p.name,
    address:       p.formatted_address,
    phone:         p.formatted_phone_number || null,
    website:       p.website || null,
    googleMapsUrl: p.url || null,
    rating:        p.rating || null,
    totalRatings:  p.user_ratings_total || 0,
    priceLevel:    p.price_level ?? null,
    types:         p.types || [],
    location:      p.geometry?.location || null,
    openNow:       p.opening_hours?.open_now ?? null,
    weekdayText:   p.opening_hours?.weekday_text || [],
    photos: (p.photos || []).slice(0, 5).map((ph) => ({
      reference: ph.photo_reference,
      url:       buildPhotoUrl(ph.photo_reference),
      width:     ph.width,
      height:    ph.height,
    })),
    reviews: (p.reviews || []).slice(0, 3).map((r) => ({
      author:      r.author_name,
      rating:      r.rating,
      text:        r.text,
      time:        r.relative_time_description,
      profilePhoto: r.profile_photo_url || null,
    })),
  };
};

module.exports = {
  searchPlaces,
  getNearbyPlaces,
  getPlacePhoto,
  getPlaceDetails,
  buildPhotoUrl,
  normalizePlace,
};
