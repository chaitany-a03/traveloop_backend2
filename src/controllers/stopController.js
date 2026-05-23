const { Stop, Trip, Activity } = require('../models');

const getStops = async (req, res, next) => {
  try {
    const trip = await Trip.findOne({ where: { id: req.params.tripId, user_id: req.user.id } });
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });
    const stops = await Stop.findAll({
      where: { trip_id: req.params.tripId },
      include: [{ model: Activity, as: 'activities' }],
      order: [['order_index', 'ASC']],
    });
    res.json({ success: true, stops });
  } catch (error) { next(error); }
};

const addStop = async (req, res, next) => {
  try {
    const trip = await Trip.findOne({ where: { id: req.params.tripId, user_id: req.user.id } });
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });
    const { city, country, start_date, end_date, order_index, notes } = req.body;
    if (!city || !country) return res.status(400).json({ success: false, message: 'City and country required' });
    const stop = await Stop.create({ trip_id: req.params.tripId, city, country, start_date, end_date, order_index: order_index || 0, notes });
    res.status(201).json({ success: true, stop });
  } catch (error) { next(error); }
};

const updateStop = async (req, res, next) => {
  try {
    const stop = await Stop.findByPk(req.params.id);
    if (!stop) return res.status(404).json({ success: false, message: 'Stop not found' });
    await stop.update(req.body);
    res.json({ success: true, stop });
  } catch (error) { next(error); }
};

const deleteStop = async (req, res, next) => {
  try {
    const stop = await Stop.findByPk(req.params.id);
    if (!stop) return res.status(404).json({ success: false, message: 'Stop not found' });
    await stop.destroy();
    res.json({ success: true, message: 'Stop deleted' });
  } catch (error) { next(error); }
};

const reorderStops = async (req, res, next) => {
  try {
    const { stops } = req.body; // [{id, order_index}]
    for (const s of stops) {
      await Stop.update({ order_index: s.order_index }, { where: { id: s.id } });
    }
    res.json({ success: true, message: 'Stops reordered' });
  } catch (error) { next(error); }
};

module.exports = { getStops, addStop, updateStop, deleteStop, reorderStops };
