const { ChecklistItem } = require('../models');

const getChecklist = async (req, res, next) => {
  try {
    const items = await ChecklistItem.findAll({
      where: { trip_id: req.params.tripId },
      order: [['category', 'ASC'], ['created_at', 'ASC']],
    });
    res.json({ success: true, items });
  } catch (error) { next(error); }
};

const addItem = async (req, res, next) => {
  try {
    const { item_name, category } = req.body;
    if (!item_name) return res.status(400).json({ success: false, message: 'Item name required' });
    const item = await ChecklistItem.create({ trip_id: req.params.tripId, item_name, category });
    res.status(201).json({ success: true, item });
  } catch (error) { next(error); }
};

const updateItem = async (req, res, next) => {
  try {
    const item = await ChecklistItem.findByPk(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
    await item.update(req.body);
    res.json({ success: true, item });
  } catch (error) { next(error); }
};

const deleteItem = async (req, res, next) => {
  try {
    const item = await ChecklistItem.findByPk(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
    await item.destroy();
    res.json({ success: true, message: 'Item deleted' });
  } catch (error) { next(error); }
};

module.exports = { getChecklist, addItem, updateItem, deleteItem };
