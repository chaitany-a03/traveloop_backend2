const { generateSmartItinerary } = require('../services/plannerEngine');

// ─── Allowed values for enum-style fields ─────────────────────────

const VALID_MOODS = ['Adventure', 'Relaxation', 'Culture', 'Food', 'Nature', 'Nightlife', 'Family'];
const VALID_TRAVEL_TYPES = ['Solo', 'Couple', 'Friends', 'Family'];

/**
 * POST /api/planner/generate
 * ──────────────────────────
 * Body (JSON):
 * {
 *   "destination": "Goa",          required  string
 *   "days":        5,              required  number  1–30
 *   "budget":      30000,          required  number  > 0
 *   "mood":        "Adventure",    required  one of VALID_MOODS
 *   "travelType":  "Friends"       optional  one of VALID_TRAVEL_TYPES  (default: "Solo")
 * }
 */
const generateItineraryController = async (req, res, next) => {
  try {
    const { destination, days, budget, mood, travelType = 'Solo' } = req.body;

    // ── Input validation ────────────────────────────────────────────
    const errors = [];

    if (!destination || typeof destination !== 'string' || !destination.trim()) {
      errors.push('"destination" is required and must be a non-empty string.');
    }

    const parsedDays = parseInt(days, 10);
    if (!days || isNaN(parsedDays) || parsedDays < 1 || parsedDays > 30) {
      errors.push('"days" is required and must be a number between 1 and 30.');
    }

    const parsedBudget = parseFloat(budget);
    if (!budget || isNaN(parsedBudget) || parsedBudget <= 0) {
      errors.push('"budget" is required and must be a positive number.');
    }

    if (!mood || !VALID_MOODS.includes(mood)) {
      errors.push(`"mood" is required. Valid values: ${VALID_MOODS.join(', ')}.`);
    }

    if (travelType && !VALID_TRAVEL_TYPES.includes(travelType)) {
      errors.push(`"travelType" must be one of: ${VALID_TRAVEL_TYPES.join(', ')}.`);
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
    }

    // ── Call the planner engine ─────────────────────────────────────
    const itinerary = await generateSmartItinerary({
      destination: destination.trim(),
      days:        parsedDays,
      budget:      parsedBudget,
      mood,
      travelType,
    });

    return res.status(200).json({
      success: true,
      ...itinerary,
    });
  } catch (error) {
    // Provide a clear message when the Google Places API key is missing
    // but still let the engine's demo-mode handle it gracefully.
    // This branch only fires for unexpected runtime errors.
    if (error.message?.includes('GOOGLE_MAPS_API_KEY')) {
      return res.status(503).json({
        success: false,
        message: 'Google Places API is not configured. Add GOOGLE_MAPS_API_KEY to .env to enable live data.',
        detail:  error.message,
      });
    }
    next(error);
  }
};

module.exports = { generateItineraryController };
