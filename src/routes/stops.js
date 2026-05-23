const express = require('express');
const router = express.Router({ mergeParams: true });
const { getStops, addStop, updateStop, deleteStop, reorderStops } = require('../controllers/stopController');
const { protect } = require('../middleware/auth');
const activityRouter = require('./activities');

router.use(protect);
router.get('/', getStops);
router.post('/', addStop);
router.put('/reorder', reorderStops);
router.put('/:id', updateStop);
router.delete('/:id', deleteStop);

// Nested activities under stops
router.use('/:stopId/activities', activityRouter);

module.exports = router;
