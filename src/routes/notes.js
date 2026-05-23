const express = require('express');
const router = express.Router({ mergeParams: true });
const { getNotes, addNote, updateNote, deleteNote } = require('../controllers/noteController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/', getNotes);
router.post('/', addNote);
router.put('/:id', updateNote);
router.delete('/:id', deleteNote);

module.exports = router;
