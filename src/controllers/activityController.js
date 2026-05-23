const { Activity, Stop, Trip } = require('../models');

const getActivities = async (req, res, next) => {
  try {
    const activities = await Activity.findAll({ where: { stop_id: req.params.stopId } });
    res.json({ success: true, activities });
  } catch (error) { next(error); }
};

const addActivity = async (req, res, next) => {
  try {
    const { activity_name, category, cost, duration, notes, time } = req.body;
    if (!activity_name) return res.status(400).json({ success: false, message: 'Activity name required' });
    const activity = await Activity.create({ stop_id: req.params.stopId, activity_name, category, cost, duration, notes, time });
    res.status(201).json({ success: true, activity });
  } catch (error) { next(error); }
};

const updateActivity = async (req, res, next) => {
  try {
    const activity = await Activity.findByPk(req.params.id);
    if (!activity) return res.status(404).json({ success: false, message: 'Activity not found' });
    await activity.update(req.body);
    res.json({ success: true, activity });
  } catch (error) { next(error); }
};

const deleteActivity = async (req, res, next) => {
  try {
    const activity = await Activity.findByPk(req.params.id);
    if (!activity) return res.status(404).json({ success: false, message: 'Activity not found' });
    await activity.destroy();
    res.json({ success: true, message: 'Activity deleted' });
  } catch (error) { next(error); }
};

// Curated activity search dataset
const curatedActivities = [
  // Paris
  { city: 'Paris', name: 'Eiffel Tower Visit', category: 'sightseeing', cost: 26, duration: '2-3 hours', image: 'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=400' },
  { city: 'Paris', name: 'Louvre Museum', category: 'culture', cost: 17, duration: '3-4 hours', image: 'https://images.unsplash.com/photo-1564415315949-7a0c4c73aab4?w=400' },
  { city: 'Paris', name: 'Seine River Cruise', category: 'sightseeing', cost: 15, duration: '1 hour', image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400' },
  { city: 'Paris', name: 'Montmartre Food Tour', category: 'food', cost: 45, duration: '3 hours', image: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400' },
  { city: 'Paris', name: 'Palace of Versailles', category: 'culture', cost: 20, duration: '4-5 hours', image: 'https://images.unsplash.com/photo-1572554046-7fae4e5e1a60?w=400' },
  // Tokyo
  { city: 'Tokyo', name: 'Shibuya Crossing Walk', category: 'sightseeing', cost: 0, duration: '1 hour', image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400' },
  { city: 'Tokyo', name: 'Tsukiji Fish Market', category: 'food', cost: 30, duration: '2 hours', image: 'https://images.unsplash.com/photo-1553621042-f6e147245754?w=400' },
  { city: 'Tokyo', name: 'TeamLab Borderless', category: 'culture', cost: 32, duration: '3 hours', image: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=400' },
  { city: 'Tokyo', name: 'Mount Fuji Day Trip', category: 'adventure', cost: 60, duration: '8 hours', image: 'https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?w=400' },
  { city: 'Tokyo', name: 'Akihabara Electronics Tour', category: 'shopping', cost: 0, duration: '2 hours', image: 'https://images.unsplash.com/photo-1536096136903-68d7a7dae779?w=400' },
  // New York
  { city: 'New York', name: 'Central Park Walk', category: 'relaxation', cost: 0, duration: '2 hours', image: 'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=400' },
  { city: 'New York', name: 'Statue of Liberty Tour', category: 'sightseeing', cost: 24, duration: '3 hours', image: 'https://images.unsplash.com/photo-1503023345310-bd7c1de61c7d?w=400' },
  { city: 'New York', name: 'Broadway Show', category: 'culture', cost: 150, duration: '2.5 hours', image: 'https://images.unsplash.com/photo-1543857778-c4a1a3e0b2eb?w=400' },
  { city: 'New York', name: 'Brooklyn Food Tour', category: 'food', cost: 55, duration: '3 hours', image: 'https://images.unsplash.com/photo-1567529692333-de9fd6772897?w=400' },
  { city: 'New York', name: 'Empire State Building', category: 'sightseeing', cost: 44, duration: '2 hours', image: 'https://images.unsplash.com/photo-1548802673-380ab8ebc7b7?w=400' },
  // Bali
  { city: 'Bali', name: 'Ubud Monkey Forest', category: 'adventure', cost: 10, duration: '2 hours', image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400' },
  { city: 'Bali', name: 'Tanah Lot Temple', category: 'culture', cost: 5, duration: '2 hours', image: 'https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=400' },
  { city: 'Bali', name: 'Kuta Beach Surfing', category: 'adventure', cost: 20, duration: '2 hours', image: 'https://images.unsplash.com/photo-1516815231560-8f41ec531527?w=400' },
  { city: 'Bali', name: 'Tegallalang Rice Terraces', category: 'sightseeing', cost: 2, duration: '2 hours', image: 'https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=400' },
  { city: 'Bali', name: 'Traditional Balinese Spa', category: 'relaxation', cost: 35, duration: '2 hours', image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400' },
  // Barcelona
  { city: 'Barcelona', name: 'Sagrada Familia', category: 'culture', cost: 26, duration: '2 hours', image: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=400' },
  { city: 'Barcelona', name: 'Park Güell', category: 'sightseeing', cost: 10, duration: '2 hours', image: 'https://images.unsplash.com/photo-1559827291-72ee739d0d9a?w=400' },
  { city: 'Barcelona', name: 'La Boqueria Market', category: 'food', cost: 0, duration: '1 hour', image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400' },
  { city: 'Barcelona', name: 'Barceloneta Beach', category: 'relaxation', cost: 0, duration: '3 hours', image: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=400' },
  { city: 'Barcelona', name: 'Flamenco Show', category: 'nightlife', cost: 40, duration: '2 hours', image: 'https://images.unsplash.com/photo-1518977956812-cd3dbadaaf31?w=400' },
  // London
  { city: 'London', name: 'Tower of London', category: 'culture', cost: 33, duration: '3 hours', image: 'https://images.unsplash.com/photo-1526129318478-62ed807ebdf9?w=400' },
  { city: 'London', name: 'British Museum', category: 'culture', cost: 0, duration: '3 hours', image: 'https://images.unsplash.com/photo-1549778399-f94fd24d4697?w=400' },
  { city: 'London', name: 'Borough Market', category: 'food', cost: 20, duration: '2 hours', image: 'https://images.unsplash.com/photo-1533900298318-6b8da08a523e?w=400' },
  { city: 'London', name: 'London Eye', category: 'sightseeing', cost: 32, duration: '1 hour', image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400' },
  { city: 'London', name: 'Soho Nightlife Tour', category: 'nightlife', cost: 30, duration: '3 hours', image: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=400' },
  // Dubai
  { city: 'Dubai', name: 'Burj Khalifa Observation', category: 'sightseeing', cost: 35, duration: '2 hours', image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400' },
  { city: 'Dubai', name: 'Desert Safari', category: 'adventure', cost: 65, duration: '6 hours', image: 'https://images.unsplash.com/photo-1509233725247-49e657c54213?w=400' },
  { city: 'Dubai', name: 'Dubai Mall Shopping', category: 'shopping', cost: 0, duration: '4 hours', image: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=400' },
  { city: 'Dubai', name: 'Dubai Creek Dhow Cruise', category: 'relaxation', cost: 30, duration: '2 hours', image: 'https://images.unsplash.com/photo-1548778052-311f4bc2b502?w=400' },
  // Rome
  { city: 'Rome', name: 'Colosseum Tour', category: 'culture', cost: 18, duration: '2 hours', image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=400' },
  { city: 'Rome', name: 'Vatican Museums', category: 'culture', cost: 20, duration: '4 hours', image: 'https://images.unsplash.com/photo-1531572753322-ad063cecc140?w=400' },
  { city: 'Rome', name: 'Trastevere Food Walk', category: 'food', cost: 40, duration: '3 hours', image: 'https://images.unsplash.com/photo-1506354666786-959d6d497f1a?w=400' },
  { city: 'Rome', name: 'Trevi Fountain Visit', category: 'sightseeing', cost: 0, duration: '1 hour', image: 'https://images.unsplash.com/photo-1555992643-9fd3dbb3c84c?w=400' },
];

const searchActivities = async (req, res, next) => {
  try {
    const { q, city, category, max_cost, min_cost } = req.query;
    let results = [...curatedActivities];
    if (q) results = results.filter(a => a.name.toLowerCase().includes(q.toLowerCase()));
    if (city) results = results.filter(a => a.city.toLowerCase().includes(city.toLowerCase()));
    if (category) results = results.filter(a => a.category === category);
    if (max_cost) results = results.filter(a => a.cost <= parseFloat(max_cost));
    if (min_cost) results = results.filter(a => a.cost >= parseFloat(min_cost));
    res.json({ success: true, activities: results, total: results.length });
  } catch (error) { next(error); }
};

module.exports = { getActivities, addActivity, updateActivity, deleteActivity, searchActivities };
