const { Trip, Stop, Activity, Budget, ChecklistItem, TripNote, User } = require('../models');

const getTrips = async (req, res, next) => {
  try {
    const trips = await Trip.findAll({
      where: { user_id: req.user.id },
      include: [
        { model: Stop, as: 'stops', include: [{ model: Activity, as: 'activities' }] },
        { model: Budget, as: 'budget' },
      ],
      order: [['created_at', 'DESC']],
    });
    res.json({ success: true, trips });
  } catch (error) { next(error); }
};

const getTrip = async (req, res, next) => {
  try {
    const trip = await Trip.findOne({
      where: { id: req.params.id, user_id: req.user.id },
      include: [
        { model: Stop, as: 'stops', include: [{ model: Activity, as: 'activities' }], order: [['order_index', 'ASC']] },
        { model: Budget, as: 'budget' },
        { model: ChecklistItem, as: 'checklist_items' },
        { model: TripNote, as: 'notes', order: [['created_at', 'DESC']] },
      ],
    });
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });
    res.json({ success: true, trip });
  } catch (error) { next(error); }
};

const sequelize = require('../config/database');

// Helper to map category to valid enum
function mapActivityCategory(types = []) {
  const ts = types.join(' ').toLowerCase();
  if (ts.includes('night_club') || ts.includes('bar') || ts.includes('casino')) return 'nightlife';
  if (ts.includes('museum') || ts.includes('art_gallery') || ts.includes('church') || ts.includes('hindu_temple')) return 'culture';
  if (ts.includes('restaurant') || ts.includes('cafe') || ts.includes('bakery') || ts.includes('food') || ts.includes('meal_break')) return 'food';
  if (ts.includes('park') || ts.includes('natural_feature')) return 'sightseeing';
  if (ts.includes('amusement_park') || ts.includes('zoo') || ts.includes('aquarium')) return 'adventure';
  if (ts.includes('shopping')) return 'shopping';
  if (ts.includes('spa')) return 'relaxation';
  return 'sightseeing';
}

const createTrip = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { title, description, start_date, end_date, status, aiItinerary } = req.body;
    if (!title) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'Title is required' });
    }
    
    const cover_image = req.file ? `/uploads/${req.file.filename}` : null;
    
    const trip = await Trip.create(
      { user_id: req.user.id, title, description, start_date, end_date, cover_image, status },
      { transaction }
    );

    if (aiItinerary) {
      let parsed;
      try {
        parsed = typeof aiItinerary === 'string' ? JSON.parse(aiItinerary) : aiItinerary;
      } catch (e) {
        // Safe fail
      }
      
      if (parsed && parsed.itinerary) {
        // 1. Create Stops
        for (const day of parsed.itinerary) {
          const stop = await Stop.create({
            trip_id: trip.id,
            city: parsed.summary?.destination || 'Unknown',
            country: 'Unknown',
            order_index: day.day,
            notes: day.theme || '',
          }, { transaction });

          // 2. Create Activities
          if (day.activities && day.activities.length > 0) {
            const activitiesToCreate = day.activities.map((act) => ({
              stop_id: stop.id,
              activity_name: act.name,
              category: mapActivityCategory(act.types),
              cost: act.estimatedCost || 0,
              time: act.time || null,
              notes: JSON.stringify({
                placeId:       act.placeId || null,
                photoUrl:      act.photoUrl || null,
                latitude:      act.location?.lat || null,
                longitude:     act.location?.lng || null,
                rating:        act.rating || null,
                reviewCount:   act.totalRatings || 0,
                placeTypes:    act.types || [],
                address:       act.address || '',
                isMealBreak:   act.isMealBreak || false,
                isEnrichment:  act.isEnrichment || false,
                openNow:       act.openNow || false
              }),
            }));
            await Activity.bulkCreate(activitiesToCreate, { transaction });
          }
        }

        // 3. Create Budget
        if (parsed.summary) {
          const totalBudget = parsed.summary.budgetInput || 0;
          const hotelCost = totalBudget * 0.25;
          const transportCost = totalBudget * 0.10;
          let activityCost = 0;
          let foodCost = 0;
          
          parsed.itinerary.forEach(d => {
             d.activities.forEach(a => {
                if (a.isMealBreak) foodCost += (a.estimatedCost || 0);
                else activityCost += (a.estimatedCost || 0);
             });
          });
          
          await Budget.create({
            trip_id: trip.id,
            hotel_cost: hotelCost,
            transport_cost: transportCost,
            food_cost: foodCost,
            activity_cost: activityCost,
            miscellaneous_cost: 0,
          }, { transaction });
        }
      }
    } else {
       await Budget.create({ trip_id: trip.id }, { transaction });
    }

    await transaction.commit();
    res.status(201).json({ success: true, trip });
  } catch (error) { 
    await transaction.rollback();
    next(error); 
  }
};

const updateTrip = async (req, res, next) => {
  try {
    const trip = await Trip.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });
    const { title, description, start_date, end_date, status, is_public } = req.body;
    const cover_image = req.file ? `/uploads/${req.file.filename}` : undefined;
    const updateData = { title, description, start_date, end_date, status };
    if (is_public !== undefined) updateData.is_public = is_public;
    if (cover_image) updateData.cover_image = cover_image;
    await trip.update(updateData);
    res.json({ success: true, trip });
  } catch (error) { next(error); }
};

const deleteTrip = async (req, res, next) => {
  try {
    const trip = await Trip.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });
    await trip.destroy();
    res.json({ success: true, message: 'Trip deleted' });
  } catch (error) { next(error); }
};

const getPublicTrip = async (req, res, next) => {
  try {
    const trip = await Trip.findOne({
      where: { id: req.params.id, is_public: true },
      include: [
        { model: User, as: 'user', attributes: ['name', 'profile_photo'] },
        { model: Stop, as: 'stops', include: [{ model: Activity, as: 'activities' }], order: [['order_index', 'ASC']] },
        { model: Budget, as: 'budget' },
      ],
    });
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found or not public' });
    res.json({ success: true, trip });
  } catch (error) { next(error); }
};

module.exports = { getTrips, getTrip, createTrip, updateTrip, deleteTrip, getPublicTrip };
