const express = require('express');
const router = express.Router({ mergeParams: true });
const { getChecklist, addItem, updateItem, deleteItem } = require('../controllers/checklistController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/', getChecklist);
router.post('/', addItem);
router.put('/:id', updateItem);
router.delete('/:id', deleteItem);

module.exports = router;
