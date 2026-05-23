const { Budget, Trip } = require('../models');

const getBudget = async (req, res, next) => {
  try {
    const trip = await Trip.findOne({ where: { id: req.params.tripId, user_id: req.user.id } });
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });
    const budget = await Budget.findOne({ where: { trip_id: req.params.tripId } });
    res.json({ success: true, budget });
  } catch (error) { next(error); }
};

const upsertBudget = async (req, res, next) => {
  try {
    const trip = await Trip.findOne({ where: { id: req.params.tripId, user_id: req.user.id } });
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });
    const { transport_cost, hotel_cost, food_cost, activity_cost, miscellaneous_cost } = req.body;
    const [budget, created] = await Budget.findOrCreate({
      where: { trip_id: req.params.tripId },
      defaults: { trip_id: req.params.tripId, transport_cost: 0, hotel_cost: 0, food_cost: 0, activity_cost: 0, miscellaneous_cost: 0 },
    });
    await budget.update({ transport_cost, hotel_cost, food_cost, activity_cost, miscellaneous_cost });
    res.json({ success: true, budget, created });
  } catch (error) { next(error); }
};

module.exports = { getBudget, upsertBudget };
