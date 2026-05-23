const { TripNote, Trip } = require('../models');

const getNotes = async (req, res, next) => {
  try {
    const notes = await TripNote.findAll({
      where: { trip_id: req.params.tripId },
      order: [['created_at', 'DESC']],
    });
    res.json({ success: true, notes });
  } catch (error) { next(error); }
};

const addNote = async (req, res, next) => {
  try {
    const { note, day_label } = req.body;
    if (!note) return res.status(400).json({ success: false, message: 'Note content required' });
    const tripNote = await TripNote.create({ trip_id: req.params.tripId, note, day_label });
    res.status(201).json({ success: true, note: tripNote });
  } catch (error) { next(error); }
};

const updateNote = async (req, res, next) => {
  try {
    const tripNote = await TripNote.findByPk(req.params.id);
    if (!tripNote) return res.status(404).json({ success: false, message: 'Note not found' });
    await tripNote.update(req.body);
    res.json({ success: true, note: tripNote });
  } catch (error) { next(error); }
};

const deleteNote = async (req, res, next) => {
  try {
    const tripNote = await TripNote.findByPk(req.params.id);
    if (!tripNote) return res.status(404).json({ success: false, message: 'Note not found' });
    await tripNote.destroy();
    res.json({ success: true, message: 'Note deleted' });
  } catch (error) { next(error); }
};

module.exports = { getNotes, addNote, updateNote, deleteNote };
