const express = require('express');
const router = express.Router();
const { fetchHiddenGems } = require('../controllers/hiddenGemsController');
const { protect } = require('../middleware/auth');

router.get('/:tripId', protect, fetchHiddenGems);

module.exports = router;
