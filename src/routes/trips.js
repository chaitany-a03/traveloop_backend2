const express = require('express');
const router = express.Router();
const { getTrips, getTrip, createTrip, updateTrip, deleteTrip, getPublicTrip } = require('../controllers/tripController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/public/:id', getPublicTrip);
router.use(protect);
router.get('/', getTrips);
router.post('/', upload.single('cover_image'), createTrip);
router.get('/:id', getTrip);
router.put('/:id', upload.single('cover_image'), updateTrip);
router.delete('/:id', deleteTrip);

module.exports = router;
