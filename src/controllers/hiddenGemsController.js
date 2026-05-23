const { Trip, Stop } = require('../models');
const { getHiddenGems } = require('../services/hiddenGemsService');

const fetchHiddenGems = async (req, res, next) => {
  try {
    const { tripId } = req.params;
    
    // Fetch trip to determine destination and mood
    const trip = await Trip.findOne({
      where: { id: tripId, user_id: req.user.id },
      include: [{ model: Stop, as: 'stops' }]
    });

    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }

    // Try to extract destination from stops or title
    const destination = trip.stops && trip.stops.length > 0 ? trip.stops[0].city : trip.title.split('—')[0].trim();
    
    // Try to extract mood from description (e.g., "AI-generated 3-day Nightlife trip")
    let mood = 'default';
    if (trip.description) {
      const desc = trip.description.toLowerCase();
      if (desc.includes('food')) mood = 'Food';
      else if (desc.includes('nightlife')) mood = 'Nightlife';
      else if (desc.includes('nature')) mood = 'Nature';
      else if (desc.includes('adventure')) mood = 'Adventure';
      else if (desc.includes('culture')) mood = 'Culture';
      else if (desc.includes('relaxation')) mood = 'Relaxation';
      else if (desc.includes('family')) mood = 'Family';
    }

    const gems = await getHiddenGems(destination, mood);

    res.json({ success: true, hiddenGems: gems });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  fetchHiddenGems
};
