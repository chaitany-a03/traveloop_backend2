const express = require('express');
const router = express.Router({ mergeParams: true });
const { getActivities, addActivity, updateActivity, deleteActivity, searchActivities } = require('../controllers/activityController');
const { protect } = require('../middleware/auth');

router.get('/search', protect, searchActivities);
router.get('/', protect, getActivities);
router.post('/', protect, addActivity);
router.put('/:id', protect, updateActivity);
router.delete('/:id', protect, deleteActivity);

module.exports = router;
