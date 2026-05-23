const express = require('express');
const router  = express.Router();

const { generateItineraryController } = require('../controllers/plannerController');
const { protect } = require('../middleware/auth');

/**
 * POST /api/planner/generate
 *
 * Requires a valid JWT (Bearer token) so only authenticated
 * Traveloop users can invoke the planner and consume the
 * Google Places API quota on their behalf.
 *
 * Body:
 *  {
 *    destination  : string   (required)
 *    days         : number   (required, 1–30)
 *    budget       : number   (required, > 0)
 *    mood         : string   (required, one of: Adventure | Relaxation | Culture | Food | Nature | Nightlife | Family)
 *    travelType   : string   (optional, default: "Solo" — Solo | Couple | Friends | Family)
 *  }
 */
router.post('/generate', protect, generateItineraryController);

module.exports = router;
