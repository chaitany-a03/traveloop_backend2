/**
 * plannerEngine.js
 * ─────────────────────────────────────────────────────────────────
 * Smart Itinerary Generation Engine for Traveloop.
 * Generates highly realistic, destination-aware, geographically
 * clustered, and mood-personalized itineraries.
 *
 * Exported function:
 *   generateSmartItinerary(options) → Promise<ItineraryResult>
 * ─────────────────────────────────────────────────────────────────
 */

const { searchPlaces, getNearbyPlaces, normalizePlace } = require('./googlePlacesService');

// ─── Constants ────────────────────────────────────────────────────

const MAX_PER_DAY = 5;
const MIN_PER_DAY = 2;

const TIME_SLOTS = ['Morning', 'Late Morning', 'Afternoon', 'Late Afternoon', 'Evening'];

const CITY_PROFILES = {
  kolkata: {
    name: 'Kolkata',
    tags: ['colonial', 'literature', 'sweets', 'tram culture', 'heritage'],
    themes: ['colonial heritage', 'culture', 'street food', 'literature'],
    landmarks: ['Victoria Memorial', 'Indian Museum', 'Howrah Bridge', 'Marble Palace', 'Kumartuli', 'Dakshineswar Temple', 'Princep Ghat', 'College Street'],
    localities: ['Park Street', 'Salt Lake', 'Gariahat', 'North Kolkata', 'Sudder Street', 'Ballygunge'],
    keywords: {
      Adventure: ['Nicco Park Kolkata', 'Science City Kolkata', 'Eco Park boating', 'sailing Princep Ghat'],
      Food: ['Park Street restaurants', 'Bengali sweet shops Kolkata', 'Arslan Biryani Kolkata', 'Kolkata street food places', 'Flurys Kolkata'],
      Nature: ['Eco Park Kolkata', 'Botanical Garden Sibpur', 'Rabindra Sarobar Lake', 'Alipore Zoo'],
      Nightlife: ['Park Street bars', 'Someplace Else Kolkata', 'Roxy Lounge Kolkata', 'Lord of the Drinks Kolkata'],
      Culture: ['Kumartuli pottery Kolkata', 'Victoria Memorial Kolkata', 'Indian Museum Kolkata', 'Dakshineswar Temple Kolkata', 'Jonasanko Thakurbari'],
      Relaxation: ['Princep Ghat peaceful walk', 'spas in Ballygunge Kolkata', 'quiet cafes in Salt Lake'],
      Family: ['Science City Kolkata', 'Nicco Park', 'Birla Planetarium', 'Alipore Zoo']
    },
    fallbacks: [
      { name: 'Victoria Memorial', rating: 4.7, totalRatings: 48000, types: ['tourist_attraction', 'museum'], address: 'Queens Way, Maidan, Kolkata', priceLevel: 1, location: { lat: 22.5448, lng: 88.3426 }, photoUrl: 'https://images.unsplash.com/photo-1558431382-27e303142255?auto=format&fit=crop&w=400&q=80' },
      { name: 'Indian Museum', rating: 4.5, totalRatings: 22000, types: ['museum', 'tourist_attraction'], address: 'Jawaharlal Nehru Rd, Colootola, Kolkata', priceLevel: 1, location: { lat: 22.5579, lng: 88.3511 }, photoUrl: 'https://images.unsplash.com/photo-1601999109332-542b18dbec57?auto=format&fit=crop&w=400&q=80' },
      { name: 'Dakshineswar Kali Temple', rating: 4.8, totalRatings: 65000, types: ['hindu_temple', 'place_of_worship', 'tourist_attraction'], address: 'Dakshineswar, Kolkata', priceLevel: 0, location: { lat: 22.6550, lng: 88.3575 }, photoUrl: 'https://images.unsplash.com/photo-1588538260466-88d40ef67fae?auto=format&fit=crop&w=400&q=80' },
      { name: 'Flurys', rating: 4.3, totalRatings: 8500, types: ['cafe', 'restaurant', 'food'], address: 'Park Street, Kolkata', priceLevel: 2, location: { lat: 22.5484, lng: 88.3524 }, photoUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=400&q=80' },
      { name: 'College Street Boi Para', rating: 4.6, totalRatings: 12000, types: ['shopping_mall', 'tourist_attraction'], address: 'College Street, Bowbazar, Kolkata', priceLevel: 1, location: { lat: 22.5744, lng: 88.3639 }, photoUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=400&q=80' },
      { name: 'Howrah Bridge', rating: 4.6, totalRatings: 25000, types: ['tourist_attraction', 'natural_feature'], address: 'Howrah Bridge, Kolkata', priceLevel: 0, location: { lat: 22.5851, lng: 88.3468 }, photoUrl: 'https://images.unsplash.com/photo-1590490359854-dfba19688d70?auto=format&fit=crop&w=400&q=80' },
      { name: 'Kumartuli Potter\'s Town', rating: 4.5, totalRatings: 6000, types: ['tourist_attraction', 'culture'], address: 'Kumartuli, Shobhabazar, Kolkata', priceLevel: 0, location: { lat: 22.5991, lng: 88.3592 }, photoUrl: 'https://images.unsplash.com/photo-1566847438217-76e82d383f84?auto=format&fit=crop&w=400&q=80' }
    ]
  },
  delhi: {
    name: 'Delhi',
    tags: ['monuments', 'street food', 'heritage', 'busy markets', 'political hub'],
    themes: ['mughal heritage', 'street food', 'historic monuments', 'markets'],
    landmarks: ['Red Fort', 'Qutub Minar', 'India Gate', 'Humayun\'s Tomb', 'Lotus Temple', 'Akshardham', 'Chandni Chowk', 'Connaught Place'],
    localities: ['Connaught Place', 'Hauz Khas', 'Old Delhi', 'South Extension', 'Khan Market', 'Karol Bagh'],
    keywords: {
      Adventure: ['Hauz Khas Social adventure', 'gaming zones Connaught Place', 'Adventure Island Delhi'],
      Food: ['Chandni Chowk street food', 'restaurants in Connaught Place', 'Khan Market cafes', 'Karim\'s Old Delhi', 'famous paranthe wali gali'],
      Nature: ['Lodhi Gardens Delhi', 'Sunder Nursery Delhi', 'Deer Park Hauz Khas', 'Garden of Five Senses'],
      Nightlife: ['Hauz Khas Village nightlife', 'Connaught Place pubs', 'bars in GK M-Block', 'Aerocity lounges'],
      Culture: ['Red Fort Delhi', 'Qutub Minar Delhi', 'Humayun\'s Tomb Delhi', 'National Museum Delhi', 'Lotus Temple'],
      Relaxation: ['Sunder Nursery quiet walk', 'peaceful cafes in Lodhi Colony', 'spas in Connaught Place'],
      Family: ['National Science Centre', 'Nehru Planetarium Delhi', 'National Zoological Park', 'Akshardham Temple light show']
    },
    fallbacks: [
      { name: 'Qutub Minar', rating: 4.7, totalRatings: 42000, types: ['tourist_attraction'], address: 'Mehrauli, New Delhi', priceLevel: 1, location: { lat: 28.5245, lng: 77.1855 }, photoUrl: 'https://images.unsplash.com/photo-1585128792020-803d29415281?auto=format&fit=crop&w=400&q=80' },
      { name: 'India Gate', rating: 4.6, totalRatings: 55000, types: ['tourist_attraction'], address: 'Rajpath, Central Secretariat, New Delhi', priceLevel: 0, location: { lat: 28.6129, lng: 77.2295 }, photoUrl: 'https://images.unsplash.com/photo-1587135941948-670b381f08e9?auto=format&fit=crop&w=400&q=80' },
      { name: 'Humayun\'s Tomb', rating: 4.7, totalRatings: 32000, types: ['tourist_attraction', 'museum'], address: 'Mathura Rd, Nizamuddin East, New Delhi', priceLevel: 1, location: { lat: 28.5933, lng: 77.2507 }, photoUrl: 'https://images.unsplash.com/photo-1598977123418-45f04b616a0e?auto=format&fit=crop&w=400&q=80' },
      { name: 'Lodhi Gardens', rating: 4.6, totalRatings: 18000, types: ['park'], address: 'Lodhi Rd, Lodhi Estate, New Delhi', priceLevel: 0, location: { lat: 28.5931, lng: 77.2197 }, photoUrl: 'https://images.unsplash.com/photo-1562979314-bee7453e911c?auto=format&fit=crop&w=400&q=80' },
      { name: 'Karim\'s Restaurant', rating: 4.3, totalRatings: 15000, types: ['restaurant', 'food'], address: 'Gali Kababian, Jama Masjid, Old Delhi', priceLevel: 2, location: { lat: 28.6499, lng: 77.2338 }, photoUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80' },
      { name: 'Chandni Chowk Market', rating: 4.4, totalRatings: 28000, types: ['shopping_mall', 'tourist_attraction'], address: 'Chandni Chowk, Old Delhi', priceLevel: 1, location: { lat: 28.6506, lng: 77.2303 }, photoUrl: 'https://images.unsplash.com/photo-1597075687490-8f673c6c17f6?auto=format&fit=crop&w=400&q=80' },
      { name: 'Hauz Khas Social', rating: 4.5, totalRatings: 9000, types: ['bar', 'restaurant'], address: 'Hauz Khas Village, New Delhi', priceLevel: 2, location: { lat: 28.5540, lng: 77.2062 }, photoUrl: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=400&q=80' }
    ]
  },
  goa: {
    name: 'Goa',
    tags: ['beaches', 'nightlife', 'Portuguese', 'sunsets'],
    themes: ['beaches', 'nightlife', 'cafes', 'water sports'],
    landmarks: ['Baga Beach', 'Tito\'s Lane', 'Fontainhas', 'Chapora Fort', 'Anjuna Flea Market', 'Dudhsagar Falls', 'Basilica of Bom Jesus'],
    localities: ['Calangute', 'Panjim', 'Anjuna', 'Assagao', 'Palolem', 'Morjim'],
    keywords: {
      Adventure: ['water sports Baga Beach', 'scuba diving Grande Island Goa', 'parasailing Calangute', 'ATV rides Goa'],
      Food: ['Gunpowder Goa Assagao', 'seafood restaurants Goa', 'Thalassa beach dinner', 'Curlies Beach Shack'],
      Nature: ['Dudhsagar Waterfalls', 'Palolem Beach sunset', 'Netravali wildlife sanctuary', 'spice plantation Ponda'],
      Nightlife: ['Tito\'s Lane clubs', 'Club Cubana night party', 'Curlies Anjuna nightlife', 'LPK Waterfront Goa'],
      Culture: ['Basilica of Bom Jesus Panjim', 'Fontainhas Latin Quarter', 'Fort Aguada Goa', 'Mangueshi Temple'],
      Relaxation: ['yoga retreats Mandrem', 'sunset lounge Morjim', 'peaceful spice plantation walk'],
      Family: ['dolphin watching boat cruise', 'Dudhsagar waterfalls tour', 'Goa Science Centre']
    },
    fallbacks: [
      { name: 'Baga Beach', rating: 4.6, totalRatings: 13200, types: ['natural_feature'], address: 'Baga, North Goa', priceLevel: 1, location: { lat: 15.5528, lng: 73.7517 }, photoUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80' },
      { name: 'Fort Aguada', rating: 4.7, totalRatings: 15100, types: ['tourist_attraction'], address: 'Candolim, Goa', priceLevel: 0, location: { lat: 15.4926, lng: 73.7739 }, photoUrl: 'https://images.unsplash.com/photo-1590001155093-a3c66ab0c3ff?auto=format&fit=crop&w=400&q=80' },
      { name: 'Fontainhas Latin Quarter', rating: 4.7, totalRatings: 9000, types: ['tourist_attraction', 'culture'], address: 'Panaji, Goa', priceLevel: 0, location: { lat: 15.4989, lng: 73.8278 }, photoUrl: 'https://images.unsplash.com/photo-1616847438217-76e82d383f84?auto=format&fit=crop&w=400&q=80' },
      { name: 'Curlies Beach Shack', rating: 4.5, totalRatings: 9700, types: ['restaurant', 'bar'], address: 'Anjuna Beach, Goa', priceLevel: 1, location: { lat: 15.5728, lng: 73.7431 }, photoUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80' },
      { name: 'Tito\'s Lane Nightclubs', rating: 4.4, totalRatings: 8800, types: ['night_club', 'bar'], address: 'Baga, Goa', priceLevel: 2, location: { lat: 15.5562, lng: 73.7554 }, photoUrl: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=400&q=80' },
      { name: 'Basilica of Bom Jesus', rating: 4.8, totalRatings: 18000, types: ['church', 'tourist_attraction'], address: 'Old Goa, Goa', priceLevel: 0, location: { lat: 15.5009, lng: 73.9116 }, photoUrl: 'https://images.unsplash.com/photo-1544015759-1124e4d58481?auto=format&fit=crop&w=400&q=80' },
      { name: 'Gunpowder', rating: 4.6, totalRatings: 6200, types: ['restaurant', 'food'], address: 'Assagao, Goa', priceLevel: 2, location: { lat: 15.5925, lng: 73.7712 }, photoUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80' }
    ]
  },
  bangalore: {
    name: 'Bangalore',
    tags: ['breweries', 'startups', 'gardens', 'cafes'],
    themes: ['cafes', 'breweries', 'tech culture', 'food scene'],
    landmarks: ['Lalbagh Botanical Garden', 'Cubbon Park', 'Bangalore Palace', 'Toit Microbrewery', 'Vidyarthi Bhavan', 'Commercial Street', 'Nandi Hills'],
    localities: ['Indiranagar', 'Koramangala', 'Malleswaram', 'Basavanagudi', 'MG Road', 'Whitefield'],
    keywords: {
      Adventure: ['gokarting Whitefield', 'Play Arena Bangalore', 'trekking in Nandi Hills', 'microbrewery crawl'],
      Food: ['Vidyarthi Bhavan dosa', 'Toit Indiranagar', 'breweries in Koramangala', 'South Indian breakfast Basavanagudi'],
      Nature: ['Lalbagh Botanical Garden', 'Cubbon Park morning walk', 'lakes in Bellandur', 'Nandi Hills sunrise'],
      Nightlife: ['Toit Microbrewery Bangalore', 'Windmills Craftworks Whitefield', 'Social Koramangala', 'Arbor Brewing Company'],
      Culture: ['Bangalore Palace tour', 'Visvesvaraya Museum', 'National Gallery of Modern Art', 'Bull Temple Basavanagudi'],
      Relaxation: ['Cubbon Park quiet corners', 'spa in Indiranagar', 'book cafes in Koramangala'],
      Family: ['Visvesvaraya Technological Museum', 'Lalbagh Flower Show', 'Bannerghatta National Park safari']
    },
    fallbacks: [
      { name: 'Lalbagh Botanical Garden', rating: 4.6, totalRatings: 25000, types: ['park', 'natural_feature'], address: 'Mavalli, Bangalore', priceLevel: 0, location: { lat: 12.9507, lng: 77.5848 }, photoUrl: 'https://images.unsplash.com/photo-1562979314-bee7453e911c?auto=format&fit=crop&w=400&q=80' },
      { name: 'Bangalore Palace', rating: 4.5, totalRatings: 18000, types: ['tourist_attraction'], address: 'Vasanth Nagar, Bangalore', priceLevel: 2, location: { lat: 12.9980, lng: 77.5921 }, photoUrl: 'https://images.unsplash.com/photo-1598977123418-45f04b616a0e?auto=format&fit=crop&w=400&q=80' },
      { name: 'Cubbon Park', rating: 4.7, totalRatings: 35000, types: ['park'], address: 'Kasturba Road, Bangalore', priceLevel: 0, location: { lat: 12.9739, lng: 77.5959 }, photoUrl: 'https://images.unsplash.com/photo-1562979314-bee7453e911c?auto=format&fit=crop&w=400&q=80' },
      { name: 'Toit Microbrewery', rating: 4.6, totalRatings: 22000, types: ['bar', 'restaurant'], address: 'Indiranagar, Bangalore', priceLevel: 2, location: { lat: 12.9791, lng: 77.6406 }, photoUrl: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=400&q=80' },
      { name: 'Vidyarthi Bhavan', rating: 4.5, totalRatings: 15000, types: ['restaurant', 'cafe'], address: 'Basavanagudi, Bangalore', priceLevel: 1, location: { lat: 12.9439, lng: 77.5739 }, photoUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80' },
      { name: 'Visvesvaraya Museum', rating: 4.6, totalRatings: 12000, types: ['museum', 'tourist_attraction'], address: 'Kasturba Road, Bangalore', priceLevel: 1, location: { lat: 12.9719, lng: 77.5959 }, photoUrl: 'https://images.unsplash.com/photo-1601999109332-542b18dbec57?auto=format&fit=crop&w=400&q=80' },
      { name: 'Commercial Street', rating: 4.4, totalRatings: 28000, types: ['shopping_mall'], address: 'Tasker Town, Bangalore', priceLevel: 1, location: { lat: 12.9822, lng: 77.6083 }, photoUrl: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=400&q=80' }
    ]
  },
  jaipur: {
    name: 'Jaipur',
    tags: ['heritage', 'culture', 'forts', 'architecture'],
    themes: ['heritage', 'culture', 'forts', 'architecture'],
    landmarks: ['Amer Fort', 'Hawa Mahal', 'City Palace', 'Jantar Mantar', 'Nahargarh Fort', 'Chokhi Dhani', 'Johari Bazar', 'Jal Mahal'],
    localities: ['Pink City', 'C-Scheme', 'Amer', 'Malviya Nagar', 'Raja Park', 'Vaishali Nagar'],
    keywords: {
      Adventure: ['Nahargarh Fort cycling', 'hot air balloon Jaipur', 'elephant sanctuary Amer', 'trekking in Aravallis'],
      Food: ['Rajasthani Thali Chokhi Dhani', 'LMB Laxmi Mishthan Bhandar', 'Tapri Tea House', 'rooftop restaurants Pink City'],
      Nature: ['Nahargarh leopard safari', 'Central Park Jaipur', 'Sisodia Rani Ka Bagh', 'Jal Mahal lake view'],
      Nightlife: ['rooftop bars C-Scheme', 'Nahargarh sunset lounge', 'light and sound show Amer Fort'],
      Culture: ['Amer Fort heritage tour', 'Hawa Mahal architecture', 'City Palace Museum', 'Jantar Mantar observatory'],
      Relaxation: ['ayurvedic spa C-Scheme', 'quiet walks in Central Park', 'palace garden retreats'],
      Family: ['Chokhi Dhani cultural village', 'Albert Hall Museum pigeons', 'science park Shastri Nagar']
    },
    fallbacks: [
      { name: 'Amer Fort', rating: 4.7, totalRatings: 42000, types: ['tourist_attraction'], address: 'Devisinghpura, Amer, Jaipur', priceLevel: 1, location: { lat: 26.9855, lng: 75.8513 }, photoUrl: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=400&q=80' },
      { name: 'Hawa Mahal', rating: 4.6, totalRatings: 38000, types: ['tourist_attraction'], address: 'Badi Choupad, Pink City, Jaipur', priceLevel: 0, location: { lat: 26.9239, lng: 75.8267 }, photoUrl: 'https://images.unsplash.com/photo-1603262110263-fb0112e7cc33?auto=format&fit=crop&w=400&q=80' },
      { name: 'City Palace', rating: 4.5, totalRatings: 29000, types: ['tourist_attraction', 'museum'], address: 'Tulsi Marg, Pink City, Jaipur', priceLevel: 2, location: { lat: 26.9258, lng: 75.8237 }, photoUrl: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=400&q=80' },
      { name: 'Chokhi Dhani', rating: 4.3, totalRatings: 21000, types: ['restaurant'], address: '12 Mile, Tonk Road, Jaipur', priceLevel: 3, location: { lat: 26.7667, lng: 75.8450 }, photoUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80' },
      { name: 'Jantar Mantar', rating: 4.6, totalRatings: 17000, types: ['museum', 'tourist_attraction'], address: 'Kanwar Nagar, Jaipur', priceLevel: 1, location: { lat: 26.9248, lng: 75.8245 }, photoUrl: 'https://images.unsplash.com/photo-1601999109332-542b18dbec57?auto=format&fit=crop&w=400&q=80' },
      { name: 'Johari Bazar', rating: 4.4, totalRatings: 11000, types: ['shopping_mall'], address: 'Johri Bazar, Pink City, Jaipur', priceLevel: 1, location: { lat: 26.9214, lng: 75.8285 }, photoUrl: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=400&q=80' },
      { name: 'Nahargarh Fort', rating: 4.7, totalRatings: 25000, types: ['tourist_attraction'], address: 'Aravalli Hills, Jaipur', priceLevel: 0, location: { lat: 26.9374, lng: 75.8156 }, photoUrl: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=400&q=80' }
    ]
  },
  mumbai: {
    name: 'Mumbai',
    tags: ['nightlife', 'skyline', 'street food', 'coastal attractions'],
    themes: ['nightlife', 'skyline', 'street food', 'coastal attractions'],
    landmarks: ['Gateway of India', 'Marine Drive', 'Colaba Causeway', 'Elephanta Caves', 'Juhu Beach', 'Haji Ali Dargah', 'Siddhivinayak Temple', 'Bandra-Worli Sea Link'],
    localities: ['Colaba', 'Bandra', 'Fort', 'Juhu', 'Lower Parel', 'Dadar'],
    keywords: {
      Adventure: ['sailing Gateway of India', 'cycling Marine Drive', 'Sanjay Gandhi National Park trek'],
      Food: ['Bandra cafes', 'Irani cafes Fort Mumbai', 'coastal seafood Colaba', 'street food Khau Galli', 'Britannia Cafe pulao'],
      Nature: ['Marine Drive sunset', 'Sanjay Gandhi National Park', 'Juhu Beach walk', 'Hanging Gardens Malabar Hill'],
      Nightlife: ['nightclubs in Bandra', 'Lower Parel lounges', 'Aer Lounge Worli', 'Tryst Nightclub Mumbai'],
      Culture: ['Gateway of India', 'Chhatrapati Shivaji Maharaj Museum', 'Elephanta Caves ferry', 'Kala Ghoda art district'],
      Relaxation: ['Bandra Bandstand walk', 'peaceful cafes in Colaba', 'luxury spas in Lower Parel'],
      Family: ['Nehru Science Centre', 'Taraporewala Aquarium', 'Elephanta Caves tour', 'Essel World Mumbai']
    },
    fallbacks: [
      { name: 'Marine Drive', rating: 4.8, totalRatings: 45200, types: ['natural_feature'], address: 'Netaji Subhash Chandra Bose Rd, Mumbai', priceLevel: 0, location: { lat: 18.9431, lng: 72.8230 }, photoUrl: 'https://images.unsplash.com/photo-1568849676085-51415703900f?auto=format&fit=crop&w=400&q=80' },
      { name: 'Gateway of India', rating: 4.7, totalRatings: 58000, types: ['tourist_attraction'], address: 'Apollo Bandar, Colaba, Mumbai', priceLevel: 0, location: { lat: 18.9220, lng: 72.8347 }, photoUrl: 'https://images.unsplash.com/photo-1566552881560-0be862a7c445?auto=format&fit=crop&w=400&q=80' },
      { name: 'Colaba Causeway', rating: 4.5, totalRatings: 15100, types: ['shopping_mall'], address: 'Colaba, Mumbai', priceLevel: 1, location: { lat: 18.9242, lng: 72.8315 }, photoUrl: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=400&q=80' },
      { name: 'Juhu Beach', rating: 4.3, totalRatings: 32700, types: ['natural_feature'], address: 'Juhu, Mumbai', priceLevel: 0, location: { lat: 19.0988, lng: 72.8264 }, photoUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80' },
      { name: 'Aer Lounge', rating: 4.6, totalRatings: 3400, types: ['bar', 'night_club'], address: 'Worli, Mumbai', priceLevel: 3, location: { lat: 18.9950, lng: 72.8208 }, photoUrl: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=400&q=80' },
      { name: 'Elephanta Caves', rating: 4.6, totalRatings: 16200, types: ['tourist_attraction'], address: 'Gharapuri, Mumbai', priceLevel: 1, location: { lat: 18.9633, lng: 72.9315 }, photoUrl: 'https://images.unsplash.com/photo-1601999109332-542b18dbec57?auto=format&fit=crop&w=400&q=80' }
    ]
  },
  manali: {
    name: 'Manali',
    tags: ['mountains', 'adventure', 'trekking', 'nature'],
    themes: ['mountains', 'adventure', 'trekking', 'nature'],
    landmarks: ['Solang Valley', 'Hadimba Devi Temple', 'Jogini Waterfalls', 'Mall Road', 'Old Manali Cafes', 'Vashisht Hot Springs', 'Atal Tunnel'],
    localities: ['Old Manali', 'New Manali Mall Road', 'Vashisht Village', 'Solang', 'Sissu', 'Naggar'],
    keywords: {
      Adventure: ['paragliding Solang Valley', 'rafting Beas River', 'trekking to Jogini Falls', 'snow skiing Solang'],
      Food: ['Old Manali woodfired pizza', 'Johnson Cafe Manali', 'Tibetan restaurants Mall Road', 'local trout fish dining'],
      Nature: ['Jogini Waterfalls trek', 'Solang Valley meadows', 'Beas River viewpoints', 'Rahala Falls'],
      Nightlife: ['Old Manali live music cafes', 'bars on Mall Road', 'beer gardens in Vashisht'],
      Culture: ['Hadimba Temple old woods', 'Manu Temple historic walk', 'Tibetan Monasteries Manali', 'Naggar Castle heritage'],
      Relaxation: ['Vashisht Hot Springs bath', 'quiet walks in Pine Forest', 'riverside coffee Old Manali'],
      Family: ['Van Vihar National Park', 'Club House Manali game zones', 'Mall Road shopping']
    },
    fallbacks: [
      { name: 'Solang Valley', rating: 4.5, totalRatings: 23000, types: ['tourist_attraction', 'natural_feature'], address: 'Solang, Manali', priceLevel: 1, location: { lat: 32.3167, lng: 77.1667 }, photoUrl: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=400&q=80' },
      { name: 'Hadimba Temple', rating: 4.6, totalRatings: 19000, types: ['tourist_attraction'], address: 'Hadimba Temple Road, Manali', priceLevel: 0, location: { lat: 32.2472, lng: 77.1794 }, photoUrl: 'https://images.unsplash.com/photo-1544015759-1124e4d58481?auto=format&fit=crop&w=400&q=80' },
      { name: 'Jogini Waterfalls', rating: 4.7, totalRatings: 8000, types: ['natural_feature'], address: 'Vashisht, Manali', priceLevel: 0, location: { lat: 32.2694, lng: 77.1983 }, photoUrl: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=400&q=80' },
      { name: 'Mall Road', rating: 4.4, totalRatings: 15000, types: ['shopping_mall'], address: 'Mall Road, Manali', priceLevel: 1, location: { lat: 32.2448, lng: 77.1884 }, photoUrl: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=400&q=80' },
      { name: 'Johnson Cafe', rating: 4.5, totalRatings: 4000, types: ['restaurant', 'cafe'], address: 'Circuit House Road, Manali', priceLevel: 2, location: { lat: 32.2492, lng: 77.1869 }, photoUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80' },
      { name: 'Old Manali Village', rating: 4.6, totalRatings: 6000, types: ['tourist_attraction'], address: 'Old Manali, Manali', priceLevel: 1, location: { lat: 32.2530, lng: 77.1770 }, photoUrl: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=400&q=80' }
    ]
  },
  bangkok: {
    name: 'Bangkok',
    tags: ['temples', 'street food', 'nightlife', 'river views', 'shopping hubs'],
    themes: ['temples', 'street food', 'nightlife', 'shopping hubs'],
    landmarks: ['Grand Palace', 'Wat Arun', 'Wat Pho', 'Khao San Road', 'Chatuchak Weekend Market', 'Chinatown Yaowarat', 'Chao Phraya River', 'Jim Thompson House'],
    localities: ['Sukhumvit', 'Siam', 'Chinatown', 'Old City Rattanakosin', 'Pratunam', 'Silom'],
    keywords: {
      Adventure: ['Chao Phraya river boating', 'Muay Thai live show Bangkok', 'cycling tour in Bang Krachao'],
      Food: ['Yaowarat Chinatown street food', 'Jay Fai crab omelette', 'local Thai cafes Sukhumvit', 'Som Tum restaurants Siam'],
      Nature: ['Lumpini Park monitor lizards', 'Benchakitti Forest Park', 'Chao Phraya river viewpoints'],
      Nightlife: ['Khao San Road bars', 'rooftop bars Sukhumvit', 'Vertigo Rooftop Silom', 'Octave Rooftop Bar'],
      Culture: ['Grand Palace Bangkok', 'Wat Arun temple of dawn', 'Wat Pho reclining buddha', 'Jim Thompson House museum'],
      Relaxation: ['traditional Thai massage Wat Pho', 'Lumpini Park quiet walks', 'canal boat rides Thonburi'],
      Family: ['Sea Life Bangkok Ocean World', 'Safari World Bangkok', 'Asiatique Riverfront ferris wheel']
    },
    fallbacks: [
      { name: 'Grand Palace', rating: 4.7, totalRatings: 55000, types: ['tourist_attraction'], address: 'Na Phra Lan Rd, Rattanakosin, Bangkok', priceLevel: 2, location: { lat: 13.7500, lng: 100.4913 }, photoUrl: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&w=400&q=80' },
      { name: 'Wat Arun', rating: 4.6, totalRatings: 32000, types: ['tourist_attraction'], address: 'Wang Doem Rd, Wat Arun, Bangkok', priceLevel: 1, location: { lat: 13.7437, lng: 100.4889 }, photoUrl: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=400&q=80' },
      { name: 'Khao San Road', rating: 4.3, totalRatings: 28000, types: ['tourist_attraction', 'bar'], address: 'Talat Yot, Bangkok', priceLevel: 1, location: { lat: 13.7590, lng: 100.4972 }, photoUrl: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=400&q=80' },
      { name: 'Chatuchak Weekend Market', rating: 4.5, totalRatings: 41000, types: ['shopping_mall'], address: 'Kamphaeng Phet 2 Rd, Bangkok', priceLevel: 1, location: { lat: 13.7999, lng: 100.5504 }, photoUrl: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=400&q=80' },
      { name: 'Vertigo Rooftop Bar', rating: 4.6, totalRatings: 5000, types: ['bar', 'restaurant'], address: 'Sathon Tai Rd, Silom, Bangkok', priceLevel: 3, location: { lat: 13.7234, lng: 100.5398 }, photoUrl: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=400&q=80' },
      { name: 'Chinatown Yaowarat', rating: 4.5, totalRatings: 19000, types: ['restaurant', 'food'], address: 'Yaowarat Rd, Chinatown, Bangkok', priceLevel: 1, location: { lat: 13.7411, lng: 100.5083 }, photoUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80' },
      { name: 'Jim Thompson House', rating: 4.6, totalRatings: 9500, types: ['museum', 'tourist_attraction'], address: 'Rama I Rd, Pathum Wan, Bangkok', priceLevel: 2, location: { lat: 13.7493, lng: 100.5284 }, photoUrl: 'https://images.unsplash.com/photo-1601999109332-542b18dbec57?auto=format&fit=crop&w=400&q=80' }
    ]
  }
};

// ─── Mood-First Query Ecosystems ─────────────────────────────────
// Each mood has its own targeted search vocabulary.
// Generic "tourist attractions" is NEVER used as primary query.
const MOOD_QUERY_ECOSYSTEMS = {
  Adventure: [
    'trekking trails in',
    'adventure sports in',
    'river rafting in',
    'zipline and ATV rides in',
    'hiking in'
  ],
  Food: [
    'street food in',
    'local restaurants in',
    'famous cafes and eateries in',
    'food markets in',
    'best local cuisine in'
  ],
  Nature: [
    'waterfalls near',
    'lakes and parks in',
    'scenic viewpoints in',
    'botanical gardens in',
    'nature reserves near'
  ],
  Nightlife: [
    'rooftop bars in',
    'nightclubs in',
    'live music venues in',
    'cocktail lounges in',
    'late night cafes in'
  ],
  Culture: [
    'museums in',
    'historical monuments in',
    'art galleries in',
    'temples and heritage sites in',
    'heritage walks in'
  ],
  Family: [
    'amusement parks in',
    'zoos and aquariums in',
    'science centres in',
    'family parks in',
    'kid friendly activities in'
  ],
  Relaxation: [
    'spas and wellness centres in',
    'quiet parks in',
    'peaceful cafes in',
    'sunset viewpoints in',
    'garden retreats in'
  ],
  default: ['top sightseeing spots in', 'local experiences in', 'hidden gems near']
};

// ─── Per-Mood strict Google Place Type allowlists ─────────────────
// Places with NONE of these types are soft-rejected (unless broad tourist_attraction)
const MOOD_ALLOWED_TYPES = {
  Nightlife: ['bar', 'night_club', 'casino', 'cafe'],
  Food: ['restaurant', 'cafe', 'bakery', 'meal_takeaway', 'meal_delivery', 'food'],
  Culture: ['museum', 'art_gallery', 'tourist_attraction', 'church', 'hindu_temple', 'mosque', 'place_of_worship', 'synagogue'],
  Nature: ['natural_feature', 'park', 'zoo', 'campground', 'aquarium'],
  Adventure: ['natural_feature', 'park', 'tourist_attraction', 'amusement_park', 'stadium'],
  Family: ['amusement_park', 'zoo', 'aquarium', 'park', 'museum', 'tourist_attraction'],
  Relaxation: ['spa', 'park', 'cafe', 'natural_feature', 'restaurant'],
};

// ─── Per-Mood Nearby Search type ─────────────────────────────────
const MOOD_NEARBY_TYPE = {
  Nightlife: 'bar',
  Food: 'restaurant',
  Nature: 'park',
  Culture: 'museum',
  Adventure: 'tourist_attraction',
  Family: 'amusement_park',
  Relaxation: 'spa',
  default: 'tourist_attraction',
};

function getQueryList(destination, mood) {
  const destKey = destination.toLowerCase().trim();
  const profileKey = Object.keys(CITY_PROFILES).find(k => destKey.includes(k));
  let queries = [];

  if (profileKey) {
    const profile = CITY_PROFILES[profileKey];

    // 1. MOOD-FIRST: Use city-specific mood keywords as primary queries
    const moodKeywords = profile.keywords[mood] || [];
    if (moodKeywords.length > 0) {
      queries.push(moodKeywords[0]);
      if (moodKeywords[1]) queries.push(moodKeywords[1]);
      if (moodKeywords[2]) queries.push(moodKeywords[2]);
    } else {
      // Fallback: generic mood ecosystem with destination prefix
      const ecosystem = MOOD_QUERY_ECOSYSTEMS[mood] || MOOD_QUERY_ECOSYSTEMS.default;
      queries.push(`${ecosystem[0]} ${destination}`);
      if (ecosystem[1]) queries.push(`${ecosystem[1]} ${destination}`);
    }

    // 2. One landmark-specific query to seed geographic clustering
    if (profile.landmarks && profile.landmarks.length > 0) {
      queries.push(profile.landmarks[0]);
    }

    // 3. Locality-aware query for this mood
    if (profile.localities && profile.localities.length > 0) {
      const ecosystem = MOOD_QUERY_ECOSYSTEMS[mood] || MOOD_QUERY_ECOSYSTEMS.default;
      queries.push(`${profile.localities[0]} ${ecosystem[0].split(' ')[0]}`);
    }

  } else {
    // Non-profiled city: entirely mood-first queries with destination prefix
    const ecosystem = MOOD_QUERY_ECOSYSTEMS[mood] || MOOD_QUERY_ECOSYSTEMS.default;
    queries.push(`${ecosystem[0]} ${destination}`);
    queries.push(`${ecosystem[1]} ${destination}`);
    if (ecosystem[2]) queries.push(`${ecosystem[2]} ${destination}`);
    // One generic query as 4th slot for enrichment only
    queries.push(`best places to visit in ${destination}`);
  }

  // Ensure unique queries, limit to 4
  const uniqueQueries = [...new Set(queries)].slice(0, 4);
  console.log(`[PlannerEngine] Query list for ${destination} / ${mood}:`, uniqueQueries);
  return uniqueQueries;
}

const TYPE_BASE_COST = {
  tourist_attraction: 300,
  museum: 250,
  art_gallery: 200,
  amusement_park: 1200,
  zoo: 400,
  aquarium: 500,
  restaurant: 600,
  cafe: 200,
  bar: 400,
  night_club: 800,
  spa: 1500,
  park: 100,
  natural_feature: 150,
  stadium: 500,
  casino: 1000,
  shopping_mall: 800,
  movie_theater: 300,
  default: 250,
};

// ─── Helpers ───────────────────────────────────────────────────────

function getBudgetTier(totalBudget, days) {
  const daily = totalBudget / days;
  if (daily < 2000) return 'budget';
  if (daily < 6000) return 'mid';
  return 'premium';
}

const BUDGET_MULTIPLIER = { budget: 0.6, mid: 1.0, premium: 1.8 };
const BUDGET_LABEL = { budget: 'Budget-Friendly', mid: 'Mid-Range', premium: 'Premium' };
const TARGET_UTILIZATION = { budget: 0.75, mid: 0.85, premium: 0.95 };

function resolveBaseCost(types = []) {
  for (const t of types) {
    if (TYPE_BASE_COST[t] !== undefined) return TYPE_BASE_COST[t];
  }
  return TYPE_BASE_COST.default;
}

function getPlaceCategory(types = []) {
  const ts = types.join(' ');
  if (ts.includes('night_club') || ts.includes('bar') || ts.includes('casino')) return 'nightlife';
  if (ts.includes('museum') || ts.includes('art_gallery') || ts.includes('church') || ts.includes('hindu_temple')) return 'culture';
  if (ts.includes('restaurant') || ts.includes('cafe') || ts.includes('bakery') || ts.includes('food')) return 'food';
  if (ts.includes('park') || ts.includes('natural_feature')) return 'nature';
  if (ts.includes('amusement_park') || ts.includes('zoo') || ts.includes('aquarium')) return 'family';
  if (ts.includes('shopping')) return 'shopping';
  return 'sightseeing';
}

function getPreferredTimeSlots(category) {
  switch (category) {
    case 'nightlife': return ['Evening'];
    case 'nature': return ['Morning', 'Late Morning', 'Late Afternoon'];
    case 'food': return ['Late Morning', 'Afternoon', 'Evening'];
    case 'culture': return ['Morning', 'Late Morning', 'Afternoon'];
    case 'family': return ['Morning', 'Late Morning', 'Afternoon'];
    default: return ['Morning', 'Late Morning', 'Afternoon', 'Late Afternoon'];
  }
}

// ─── Scoring & Filtering ───────────────────────────────────────────

function scoreAttraction(place, mood, budgetTier, travelType) {
  let score = 0;

  // Rating Quality & Popularity
  score += (place.rating || 3.5) * 10;
  if (place.totalRatings > 0) {
    score += Math.min(25, Math.log10(place.totalRatings) * 6);
  }

  const category = getPlaceCategory(place.types);

  // Mood Relevance
  const moodMap = { Nightlife: 'nightlife', Culture: 'culture', Food: 'food', Nature: 'nature', Family: 'family' };
  if (category === moodMap[mood]) score += 15;

  // Travel Type Compatibility
  if (travelType === 'Family' && category === 'nightlife') score -= 20;
  if (travelType === 'Couple' && category === 'family') score -= 10;

  // Budget Compatibility
  if (budgetTier === 'budget' && (place.priceLevel || 0) >= 3) score -= 20;
  if (budgetTier === 'mid' && (place.priceLevel || 0) >= 4) score -= 10;

  // Google Place Type Boosting & Penalization
  if (Array.isArray(place.types)) {
    const boostTypes = ['tourist_attraction', 'museum', 'cafe', 'restaurant', 'bar', 'night_club', 'natural_feature', 'shopping_mall', 'art_gallery'];
    const penalizeTypes = ['finance', 'office', 'political', 'route', 'lodging', 'locality', 'sublocality', 'neighborhood', 'colloquial_area'];

    for (const t of place.types) {
      if (boostTypes.includes(t)) {
        score += 15;
      }
      if (penalizeTypes.includes(t)) {
        score -= 30;
      }
    }

    // Penalize if it only has establishment-level generic types
    if (place.types.length === 1 && place.types[0] === 'establishment') {
      score -= 25;
    }
  }

  return score;
}

const EXCLUDED_TYPES = new Set([
  'hospital', 'bank', 'atm', 'pharmacy', 'dentist', 'doctor', 'physiotherapist',
  'lawyer', 'accounting', 'post_office', 'police', 'embassy', 'cemetery',
  'funeral_home', 'school', 'university', 'transit_station', 'bus_station',
  'subway_station', 'train_station', 'light_rail_station', 'airport', 'local_government_office',
  'gas_station', 'car_repair', 'car_dealer', 'car_rental', 'parking', 'storage', 'real_estate_agency',
  'travel_agency', 'lodging'
]);

function isPlaceValid(p, mood) {
  if (!p.name || p.name === 'Unknown') return false;

  // Exclude unwanted business/administrative types
  if (Array.isArray(p.types)) {
    for (const t of p.types) {
      if (EXCLUDED_TYPES.has(t)) return false;
    }
  }

  // Name keyword exclusions for common administrative terms
  const lowerName = p.name.toLowerCase();
  const administrativeKeywords = ['hospital', 'airport', 'clinic', 'police station', 'railway station', 'bus stand', 'metro station', 'embassy', 'bank branch', 'atm', 'cemetery'];
  if (administrativeKeywords.some(kw => lowerName.includes(kw))) {
    return false;
  }

  // ─── Strict Mood-Type Filtering ──────────────────────────────────
  // Reject places that have ZERO overlap with the mood's allowed types.
  // Exception: 'tourist_attraction' is always allowed for non-Food/Nightlife moods.
  if (mood && MOOD_ALLOWED_TYPES[mood] && Array.isArray(p.types) && p.types.length > 0) {
    const allowed = MOOD_ALLOWED_TYPES[mood];
    const hasAllowedType = p.types.some(t => allowed.includes(t));
    // tourist_attraction is a broad fallback pass for Culture/Adventure/Nature/Family/Relaxation
    const broadPass = ['Culture', 'Adventure', 'Nature', 'Family', 'Relaxation'].includes(mood)
      && p.types.includes('tourist_attraction');
    if (!hasAllowedType && !broadPass) {
      return false;
    }
  }

  // Rating Thresholds
  const rating = p.rating ? parseFloat(p.rating) : null;
  if (rating !== null) {
    const category = getPlaceCategory(p.types);
    let minRating = 4.0;

    // Food/Nightlife rating: >= 4.2
    if (category === 'food' || category === 'nightlife') {
      minRating = 4.2;
    }
    // Hidden gems rating: >= 4.3 (can be checked if total ratings are lower but rating is high)
    const isHiddenGem = p.totalRatings && p.totalRatings < 500 && rating >= 4.3;
    if (isHiddenGem) {
      minRating = 4.3;
    }

    if (rating < minRating) return false;
  }

  return true;
}

function normalizeName(name) {
  return name.toLowerCase()
    .replace(/[^a-z0-9]/g, '') // remove all non-alphanumeric characters
    .trim();
}

function deduplicate(places) {
  const seenIds = new Set();
  const seenNames = new Set();
  const result = [];
  for (const p of places) {
    if (!p.name || p.name === 'Unknown') continue;
    const normName = normalizeName(p.name);
    if (p.placeId && seenIds.has(p.placeId)) continue;
    if (seenNames.has(normName)) continue;

    if (p.placeId) seenIds.add(p.placeId);
    seenNames.add(normName);
    result.push(p);
  }
  return result;
}

// ─── Geographic Clustering ─────────────────────────────────────────

// Simple Haversine distance in km
function haversineDist(loc1, loc2) {
  if (!loc1 || !loc2) return 0;
  const toRad = x => x * Math.PI / 180;
  const R = 6371; // km
  const dLat = toRad(loc2.lat - loc1.lat);
  const dLon = toRad(loc2.lng - loc1.lng);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(loc1.lat)) * Math.cos(toRad(loc2.lat)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Lightweight proximity-based grouping.
 */
function groupPlacesByProximity(places, numDays) {
  if (places.length === 0) return Array.from({ length: numDays }, () => []);

  const validPlaces = places.filter(p => p.location && p.location.lat);
  const groups = Array.from({ length: numDays }, () => []);

  if (validPlaces.length === 0) {
    places.forEach((p, i) => groups[i % numDays].push(p));
    return groups;
  }

  // 1. Pick distinct centers
  const centers = [validPlaces[0]];
  for (let i = 1; i < numDays; i++) {
    let bestCandidate = null;
    let maxDist = -1;
    for (const p of validPlaces) {
      const minDistToCenters = Math.min(...centers.map(c => haversineDist(c.location, p.location)));
      if (minDistToCenters > maxDist) {
        maxDist = minDistToCenters;
        bestCandidate = p;
      }
    }
    centers.push(bestCandidate || validPlaces[Math.floor(Math.random() * validPlaces.length)]);
  }

  // 2. Assign to nearest center
  for (const p of places) {
    if (!p.location) {
      groups[0].push(p);
      continue;
    }
    let closestIdx = 0;
    let minDist = Infinity;
    for (let i = 0; i < centers.length; i++) {
      const d = haversineDist(p.location, centers[i].location);
      if (d < minDist) {
        minDist = d;
        closestIdx = i;
      }
    }
    groups[closestIdx].push(p);
  }

  return groups;
}

const FAMOUS_LOCALITIES = {
  goa: ['anjuna', 'baga', 'calangute', 'panaji', 'panjim', 'margao', 'candolim', 'vagator', 'morjim', 'arambol', 'colva'],
  bangalore: ['indiranagar', 'koramangala', 'jayanagar', 'malleswaram', 'whitefield', 'hsr', 'mg road', 'cubbon', 'sadashivanagar'],
  bengaluru: ['indiranagar', 'koramangala', 'jayanagar', 'malleswaram', 'whitefield', 'hsr', 'mg road', 'cubbon', 'sadashivanagar'],
  mumbai: ['bandra', 'colaba', 'juhu', 'andheri', 'fort', 'worli', 'dadar', 'marine drive', 'powai', 'versova'],
  jaipur: ['c-scheme', 'malviya nagar', 'amer', 'pink city', 'bapu bazar', 'johari bazar'],
  manali: ['old manali', 'solang', 'mall road', 'vashisht'],
  bangkok: ['sukhumvit', 'siam', 'silom', 'khao san', 'chinatown', 'yaowarat', 'riverside', 'pratunam']
};

function isFoodOrDrink(types = []) {
  const ts = types.map(t => t.toLowerCase());
  return ts.includes('restaurant') || ts.includes('cafe') || ts.includes('bar') || ts.includes('food') || ts.includes('bakery') || ts.includes('meal_takeaway') || ts.includes('meal_delivery') || ts.includes('night_club');
}

function getRegionLabel(group, destination, mood) {
  if (!group || group.length === 0) return `Exploring ${destination}`;

  const destLower = destination.toLowerCase();
  let foundLocality = null;

  const profiledCity = Object.keys(FAMOUS_LOCALITIES).find(city => destLower.includes(city));
  if (profiledCity) {
    const list = FAMOUS_LOCALITIES[profiledCity];
    const localityCounts = {};
    for (const p of group) {
      if (!p.address) continue;
      const addrLower = p.address.toLowerCase();
      for (const loc of list) {
        if (addrLower.includes(loc)) {
          localityCounts[loc] = (localityCounts[loc] || 0) + 1;
        }
      }
    }
    let maxCount = 0;
    for (const loc in localityCounts) {
      if (localityCounts[loc] > maxCount) {
        maxCount = localityCounts[loc];
        foundLocality = loc.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      }
    }
  }

  if (!foundLocality) {
    const addressLocalities = [];
    for (const p of group) {
      if (!p.address) continue;
      const parts = p.address.split(',');
      if (parts.length >= 2) {
        const candidate = parts[parts.length - 2]?.trim();
        if (candidate && candidate.length > 3 && !candidate.toLowerCase().includes(destLower) && !/\d{5,}/.test(candidate)) {
          addressLocalities.push(candidate);
        }
      }
    }
    if (addressLocalities.length > 0) {
      const counts = {};
      addressLocalities.forEach(x => counts[x] = (counts[x] || 0) + 1);
      let maxCount = 0;
      for (const loc in counts) {
        if (counts[loc] > maxCount) {
          maxCount = counts[loc];
          foundLocality = loc;
        }
      }
    }
  }

  const types = group.map(p => getPlaceCategory(p.types));
  const hasNightlife = types.includes('nightlife');
  const hasNature = types.includes('nature');
  const hasCulture = types.includes('culture');
  const hasFood = types.includes('food');

  const locPrefix = foundLocality ? foundLocality : destination;

  if (mood === 'Food' || hasFood) {
    return `${locPrefix} Food & Dining Trail`;
  }
  if (mood === 'Nightlife' || hasNightlife) {
    return `${locPrefix} Nightlife & Lounge Experience`;
  }
  if (mood === 'Culture' || hasCulture) {
    return `${locPrefix} Heritage & Historical Walking Tour`;
  }
  if (mood === 'Nature' || hasNature) {
    return `${locPrefix} Scenic Nature & Sightseeing Trail`;
  }
  return `${locPrefix} Local Sights & Explorer Circuit`;
}

// ─── Day distribution ─────────────────────────────────────────────

function actionsPerDay(days, budgetTier) {
  let base = days <= 2 ? 4 : days <= 5 ? 3 : 2;
  if (budgetTier === 'premium') return Math.min(MAX_PER_DAY, base + 1);
  if (budgetTier === 'budget') return Math.max(MIN_PER_DAY, base - 1);
  return base;
}

/**
 * Assign activities ensuring a humanized flow and preventing repetitive types.
 */
function scheduleHumanizedDay(pool, perDay, costMultiplier, destination) {
  pool.sort((a, b) => b._score - a._score);
  const dayAttractions = [];
  const usedCategories = new Set();

  const destKey = destination.toLowerCase().trim();
  const profileKey = Object.keys(CITY_PROFILES).find(k => destKey.includes(k));
  let themeCategories = [];
  if (profileKey) {
    themeCategories = CITY_PROFILES[profileKey].themes;
  }

  for (let s = 0; s < TIME_SLOTS.length; s++) {
    const slot = TIME_SLOTS[s];
    if (dayAttractions.length >= perDay) break;

    let bestIdx = -1;
    for (let i = 0; i < pool.length; i++) {
      const p = pool[i];
      if (p._used) continue;

      const cat = getPlaceCategory(p.types);
      const prefSlots = getPreferredTimeSlots(cat);

      // Strict exclusions
      if (slot === 'Morning' && cat === 'nightlife') continue;
      if (slot === 'Late Morning' && cat === 'nightlife') continue;

      // Try to avoid repetitive categories unless theme-appropriate or desperate
      const isThemeAppropriate = themeCategories.includes(cat) ||
        (cat === 'food' && themeCategories.includes('cafes')) ||
        (cat === 'nightlife' && themeCategories.includes('nightlife')) ||
        (cat === 'culture' && themeCategories.includes('heritage')) ||
        (cat === 'nature' && themeCategories.includes('mountains'));

      if (usedCategories.has(cat) && !isThemeAppropriate && pool.filter(x => !x._used).length > 2) {
        continue;
      }

      // Preference matching
      if (prefSlots.includes(slot) || bestIdx === -1) {
        bestIdx = i;
        if (prefSlots.includes(slot)) break; // Perfect match
      }
    }

    if (bestIdx !== -1) {
      pool[bestIdx]._used = true;
      const p = pool[bestIdx];
      usedCategories.add(getPlaceCategory(p.types));

      const baseCost = resolveBaseCost(p.types);
      dayAttractions.push({
        name: p.name,
        placeId: p.placeId || null,
        address: p.address || '',
        time: slot,
        rating: p.rating || null,
        totalRatings: p.totalRatings || 0,
        types: p.types || [],
        location: p.location || null,
        photoUrl: p.photoUrl || null,
        estimatedCost: Math.round(baseCost * costMultiplier),
        openNow: p.openNow,
      });
    }
  }

  // Sort chronologically
  dayAttractions.sort((a, b) => TIME_SLOTS.indexOf(a.time) - TIME_SLOTS.indexOf(b.time));
  return dayAttractions;
}

function distributeAcrossDays(attractions, days, mood, budgetTier, costMultiplier, dailyTarget, destination) {
  const perDay = Math.min(MAX_PER_DAY, Math.max(MIN_PER_DAY, actionsPerDay(days, budgetTier)));

  // Group geographically
  const clusters = groupPlacesByProximity(attractions, days);
  const dayPlans = [];

  for (let d = 1; d <= days; d++) {
    const clusterPool = clusters[d - 1] || [];
    const dayAttractions = scheduleHumanizedDay(clusterPool, perDay, costMultiplier, destination);

    // Inject a meal break hint for days with >= 2 activities
    if (dayAttractions.length >= 2) {
      dayAttractions.splice(
        Math.floor(dayAttractions.length / 2), 0,
        buildMealBreak(d, mood, budgetTier, costMultiplier, clusterPool, destination)
      );
    }

    // Safety Rule: Max 1 enrichment activity per day. Only if budget allows or real activities are sparse.
    let currentTotal = dayAttractions.reduce((s, a) => s + (a.estimatedCost || 0), 0);
    const realAttractionsCount = dayAttractions.filter(a => !a.isMealBreak && !a.isEnrichment).length;

    // Prioritize adding another real attraction from the pool if available, otherwise build local experience
    if (realAttractionsCount < 2) {
      const unusedReal = clusterPool.find(p => !p._used);
      if (unusedReal) {
        unusedReal._used = true;
        const baseCost = resolveBaseCost(unusedReal.types);
        dayAttractions.push({
          name: unusedReal.name,
          placeId: unusedReal.placeId || null,
          address: unusedReal.address || '',
          time: 'Evening',
          rating: unusedReal.rating || null,
          totalRatings: unusedReal.totalRatings || 0,
          types: unusedReal.types || [],
          location: unusedReal.location || null,
          photoUrl: unusedReal.photoUrl || null,
          estimatedCost: Math.round(baseCost * costMultiplier),
          openNow: unusedReal.openNow,
        });
      } else {
        dayAttractions.push(buildExperience(d, mood, budgetTier, costMultiplier, dailyTarget - currentTotal, destination));
      }
    }

    // Sort chronologically (Midday is index 1.5)
    const getSortIdx = time => time === 'Midday' ? 1.5 : TIME_SLOTS.indexOf(time);
    dayAttractions.sort((a, b) => getSortIdx(a.time) - getSortIdx(b.time));

    const dayTotal = dayAttractions.reduce((s, a) => s + (a.estimatedCost || 0), 0);
    const theme = getRegionLabel(dayAttractions.filter(a => !a.isMealBreak && !a.isEnrichment), destination, mood);

    dayPlans.push({
      day: d,
      theme,
      activities: dayAttractions,
      dayTotal,
    });
  }

  return dayPlans;
}

function buildMealBreak(day, mood, budgetTier, costMultiplier, pool, destination) {
  const mealCosts = { budget: 150, mid: 400, premium: 900 };
  const baseMeal = mealCosts[budgetTier] || 400;

  // Try to find a real unused restaurant/cafe/bar in the day's cluster pool
  if (pool && pool.length > 0) {
    const realFoodPlace = pool.find(p => !p._used && isFoodOrDrink(p.types));
    if (realFoodPlace) {
      realFoodPlace._used = true;
      const baseCost = resolveBaseCost(realFoodPlace.types);
      return {
        name: realFoodPlace.name,
        placeId: realFoodPlace.placeId || null,
        address: realFoodPlace.address || '',
        time: 'Midday',
        rating: realFoodPlace.rating || null,
        totalRatings: realFoodPlace.totalRatings || 0,
        types: realFoodPlace.types || [],
        location: realFoodPlace.location || null,
        photoUrl: realFoodPlace.photoUrl || null,
        estimatedCost: Math.round(baseCost * costMultiplier),
        openNow: realFoodPlace.openNow,
        isMealBreak: true,
      };
    }
  }

  // City-specific highly realistic fallback names if no real food place is in the pool
  const destLower = destination.toLowerCase();
  let fallbackName = '🍛 Curated Local Lunch';
  if (destLower.includes('bangalore') || destLower.includes('bengaluru')) {
    fallbackName = mood === 'Food' ? '☕ South Indian Breakfast & Filter Coffee Trail' : '🍺 Local Microbrewery Lunch';
  } else if (destLower.includes('goa')) {
    fallbackName = mood === 'Nightlife' || mood === 'Relaxation' ? '🍹 Coastal Seafood Beach Shack Lunch' : '🐟 Authentic Goan Fish Curry Meal';
  } else if (destLower.includes('jaipur')) {
    fallbackName = '🍛 Traditional Rajasthani Thali Lunch';
  } else if (destLower.includes('mumbai')) {
    fallbackName = mood === 'Food' ? '🥪 Mumbai Street Food & Irani Cafe Break' : '🍛 Coastal Malvani Seafood Dining';
  } else if (destLower.includes('manali')) {
    fallbackName = '🥟 Authentic Himachali Siddu & Cafe Stop';
  } else if (destLower.includes('bangkok')) {
    fallbackName = '🍜 Authentic Thai Street Food Lunch';
  } else if (destLower.includes('kolkata')) {
    fallbackName = mood === 'Food' ? '☕ Flurys & Park Street Cafe Break' : '🍛 Traditional Bengali Lunch';
  } else if (destLower.includes('delhi')) {
    fallbackName = mood === 'Food' ? '🥪 Famous Paranthe Wali Gali & Street Food Lunch' : '🍛 Mughlai Dining';
  }

  return {
    name: fallbackName,
    placeId: null,
    address: '',
    time: 'Midday',
    rating: 4.5,
    totalRatings: 100,
    types: ['restaurant', 'food', 'meal_break'],
    location: null,
    photoUrl: null,
    estimatedCost: Math.round(baseMeal * costMultiplier),
    isMealBreak: true,
  };
}

function buildExperience(day, mood, budgetTier, costMultiplier, budgetGap, destination) {
  const isPremium = budgetTier === 'premium';
  const destLower = destination.toLowerCase();

  // Create city-specific premium or standard realistic experiences
  let expName = '';
  if (destLower.includes('bangalore') || destLower.includes('bengaluru')) {
    if (mood === 'Food') {
      expName = isPremium ? '🥂 Exclusive Chef Table Tasting Menu' : '🍛 Guided Food Walk & Street Eats';
    } else if (mood === 'Nightlife') {
      expName = isPremium ? '🍷 VIP Brewery Hopping & Craft Beer Tasting' : '🍺 Local Pub Crawl & Craft Beer Trail';
    } else if (mood === 'Culture') {
      expName = isPremium ? '🏛️ Private Guided Heritage Walk at Bangalore Palace' : '🎨 Traditional Silk Weaving & Artisans Walk';
    } else {
      expName = isPremium ? '🌸 Private Botanical Garden & Glass House Tour' : '🌿 Morning Walk in Cubbon Park';
    }
  } else if (destLower.includes('goa')) {
    if (mood === 'Nightlife') {
      expName = isPremium ? '🛥️ Premium Sunset Dinner Yacht Cruise' : '🍹 Night Market & Beach Club Crawl';
    } else if (mood === 'Nature') {
      expName = isPremium ? '🌿 Private Spice Plantation Tour & Elephant Bathing' : '🚶 Dudhsagar Jungle Trekking';
    } else if (mood === 'Adventure') {
      expName = isPremium ? '🤿 Private Scuba Diving & Island Exploration' : '🏄 Parasailing & Water Sports Adventure';
    } else {
      expName = isPremium ? '⛪ Old Goa Heritage Churches Private Tour' : '🚶 Sunset Beach Walk & Local Drinks';
    }
  } else if (destLower.includes('jaipur')) {
    if (mood === 'Culture') {
      expName = isPremium ? '🏰 Private Royal Tour of City Palace & Observatory' : '🚶 Old City Heritage Walking Tour';
    } else if (mood === 'Food') {
      expName = isPremium ? '🥂 Rajasthani Royal Thali & Live Folk Performance' : '🍲 Old City Street Food Tasting Walk';
    } else {
      expName = isPremium ? '🎈 Private Hot Air Balloon Flight over Forts' : '🚶 Scenic Sunset Fort Walk';
    }
  } else if (destLower.includes('mumbai')) {
    if (mood === 'Food') {
      expName = isPremium ? '🥂 Five-Star Coastal Seafood Dining Experience' : '🍲 Guided Chowpatty Street Food Safari';
    } else if (mood === 'Culture') {
      expName = isPremium ? '🏛️ Private Heritage Art Walk & Gallery Tour' : '🚶 Gateway & Colaba Heritage Walk';
    } else {
      expName = isPremium ? '⛵ Private Sailing Yacht Experience in Mumbai Harbour' : '🚶 Marine Drive Sunset Promenade Walk';
    }
  } else if (destLower.includes('manali')) {
    if (mood === 'Adventure') {
      expName = isPremium ? '🪂 Premium Tandem Paragliding at Solang Valley' : '🚶 Scenic Jogini Waterfall Trek';
    } else {
      expName = isPremium ? '🌿 Private Riverside Campfire & Trout Dinner' : '🚶 Old Manali Cafe Hopping';
    }
  } else if (destLower.includes('bangkok')) {
    if (mood === 'Food') {
      expName = isPremium ? '🥂 Michelin-Starred Thai Tasting Menu' : '🍲 Chinatown Midnight Food Tuk-Tuk Safari';
    } else if (mood === 'Nightlife') {
      expName = isPremium ? '🥂 Premium Rooftop Champagne Bar Night' : '🍹 Riverside Night Bazaar & Cabaret';
    } else {
      expName = isPremium ? '🛥️ Luxury Chao Phraya River Dinner Cruise' : '🚶 Old City Temples & Grand Palace Walk';
    }
  } else if (destLower.includes('kolkata')) {
    if (mood === 'Food') {
      expName = isPremium ? '🥂 Exclusive Bengali Fine Dining & Tasting Menu' : '🍛 Guided Park Street Food & Heritage Walk';
    } else if (mood === 'Culture') {
      expName = isPremium ? '🏛️ Private Guided Tour of Jorasanko Thakurbari & Victoria Memorial' : '🚶 Kumartuli Pottery Town Walk';
    } else {
      expName = isPremium ? '🛥️ Private Sunset Boat Cruise on Hooghly River' : '🚶 Prinsep Ghat Riverside Sunset Walk';
    }
  } else if (destLower.includes('delhi')) {
    if (mood === 'Food') {
      expName = isPremium ? '🥂 Premium Mughlai Dinner at Chor Bizarre' : '🍲 Old Delhi Street Food Safari';
    } else if (mood === 'Culture') {
      expName = isPremium ? '🏛️ Private Guided Heritage Tour of Qutub Minar & Lodhi Tombs' : '🚶 Hauz Khas Fort Walking Tour';
    } else {
      expName = isPremium ? '🚗 Private Chauffeur-Driven Heritage City Tour' : '🚶 Lodhi Art District Walk';
    }
  }

  // Curated experience libraries by mood/category to avoid procedural generation and fake landmarks
  if (!expName) {
    const pools = {
      Adventure: [
        isPremium ? 'VIP Guided Adventure Safari' : 'River Rafting Session',
        isPremium ? 'Helicopter Sightseeing Flight' : 'ATV Offroad Adventure',
        isPremium ? 'Private Mountain Guide Trek' : 'Guided Trekking Trail',
        isPremium ? 'Premium Ziplining Canopy Tour' : 'Zipline Experience'
      ],
      Food: [
        isPremium ? 'Premium Fine Dining & Tasting Experience' : 'Street Food Crawl',
        isPremium ? 'Chef Private Table Dinner' : 'Rooftop Dinner Experience',
        isPremium ? 'Exclusive Winery & Food Pairing' : 'Local Cafe Trail'
      ],
      Culture: [
        isPremium ? 'Private Historical Monument Tour' : 'Heritage Walking Tour',
        isPremium ? 'Exclusive Palace & Museum Guided Tour' : 'Temple Trail',
        isPremium ? 'Masterclass Artisanal Workshop' : 'Handicraft Workshop'
      ],
      Nature: [
        isPremium ? 'Private Wildlife Sanctuary Safari' : 'Scenic Nature Trail',
        isPremium ? 'Luxury Botanical & Orchid Gardens Tour' : 'Botanical Walk',
        isPremium ? 'Private Yacht Sunset Cruise' : 'Sunset Viewpoint Visit'
      ],
      Nightlife: [
        isPremium ? 'VIP Lounge & Club Guestlist' : 'Local Pub Crawl',
        isPremium ? 'Exclusive Jazz & Cigar Lounge Night' : 'Live Music Lounge Night',
        isPremium ? 'High-end Rooftop Champagne Bar' : 'Rooftop Lounge Experience'
      ],
      Relaxation: [
        isPremium ? 'Luxury Couple Spa & Wellness Retreat' : 'Ayurvedic Wellness Spa Session',
        isPremium ? 'Private Meditation Garden Walk' : 'Quiet Garden Walk',
        isPremium ? 'Premium Lakeside Tea Tasting' : 'Riverside Cafe Stop'
      ],
      Family: [
        isPremium ? 'VIP Theme Park Guided Tour' : 'Amusement Park Day',
        isPremium ? 'Interactive Science Center Show' : 'Science Center Visit',
        isPremium ? 'Private Wildlife Reserve Safari' : 'Local Zoo Tour'
      ],
      default: [
        isPremium ? 'Curated Premium Local Experience' : 'Guided City Exploration Walk',
        isPremium ? 'VIP Chauffeur City Tour' : 'Local Heritage Sightseeing Tour',
        isPremium ? 'Exclusive Vista Point Excursion' : 'Scenic Viewpoint Stop'
      ]
    };

    const pool = pools[mood] || pools.default;
    const index = (day - 1) % pool.length;
    expName = pool[index];
  }

  return {
    name: expName,
    placeId: null,
    address: '',
    time: 'Evening',
    rating: 4.8,
    totalRatings: 150,
    types: ['tourist_attraction'],
    location: null,
    photoUrl: null,
    estimatedCost: Math.max(Math.round(400 * costMultiplier), Math.min(budgetGap, Math.round(4000 * costMultiplier))),
    openNow: true,
    isEnrichment: true,
  };
}

function buildRecommendations(mood, budgetTier, days, totalAttractions, destination, remainingBudget, budget) {
  const recs = [];
  const moodRecs = {
    Adventure: [`Bring comfortable footwear — ${destination} has excellent outdoor trails.`],
    Relaxation: [`${destination} has excellent spas — pre-book to avoid queues.`],
    Culture: [`Visit museums in ${destination} on weekday mornings for smaller crowds.`],
    Food: [`Try street food at local ${destination} markets for the most authentic flavours.`],
    Nature: [`Early morning visits to natural sites offer the best wildlife sightings.`],
    Nightlife: [`Most venues in ${destination} open after 9 PM — plan dinners early.`],
    Family: [`Book theme parks online to skip ticket queues in ${destination}.`],
  };
  recs.push(...(moodRecs[mood] || []));

  if (remainingBudget > budget * 0.15) {
    recs.push(`You have ₹${remainingBudget.toLocaleString()} remaining in your total budget for premium accommodation and flights.`);
  }

  if (budgetTier === 'budget') {
    recs.push('Prioritized free/public attractions and affordable local eats.');
  } else if (budgetTier === 'mid') {
    recs.push('Local guided experiences have been included to enrich your trip.');
  } else {
    recs.push('Included luxury dining and VIP experiences to maximize your trip.');
  }

  recs.push(`${totalAttractions} curated real attractions clustered intelligently using Google Places data.`);
  return recs;
}

function classifyIntensity(avgActivitiesPerDay) {
  if (avgActivitiesPerDay <= 2) return 'Relaxed Trip 🌿';
  if (avgActivitiesPerDay <= 3) return 'Balanced Trip ✈️';
  if (avgActivitiesPerDay <= 4) return 'Active Trip 🏃';
  return 'Packed Adventure Trip 🔥';
}

function buildDemoAttractions(destination, mood) {
  const destLower = destination.toLowerCase();

  if (destLower.includes('mumbai')) {
    if (mood === 'Nightlife') {
      return [
        { name: `Aer Lounge`, rating: 4.6, totalRatings: 3400, types: ['bar', 'night_club'], address: 'Mumbai', priceLevel: 3 },
        { name: `Tryst Nightclub`, rating: 4.4, totalRatings: 2100, types: ['night_club', 'bar'], address: 'Lower Parel, Mumbai', priceLevel: 3 },
        { name: `Social Colaba`, rating: 4.5, totalRatings: 8500, types: ['bar', 'cafe', 'restaurant'], address: 'Colaba, Mumbai', priceLevel: 2 },
        { name: `Olive Bar & Kitchen`, rating: 4.6, totalRatings: 5200, types: ['restaurant', 'bar'], address: 'Khar, Mumbai', priceLevel: 4 },
        { name: `Toto's Garage`, rating: 4.5, totalRatings: 4100, types: ['bar'], address: 'Bandra, Mumbai', priceLevel: 2 },
      ];
    }
    if (mood === 'Culture') {
      return [
        { name: `Gateway of India`, rating: 4.7, totalRatings: 58000, types: ['tourist_attraction', 'historical_landmark'], address: 'Mumbai', priceLevel: 0 },
        { name: `Chhatrapati Shivaji Maharaj Vastu Sangrahalaya`, rating: 4.6, totalRatings: 12500, types: ['museum', 'tourist_attraction'], address: 'Fort, Mumbai', priceLevel: 1 },
        { name: `Elephanta Caves`, rating: 4.6, totalRatings: 16200, types: ['tourist_attraction', 'hindu_temple'], address: 'Mumbai', priceLevel: 1 },
        { name: `Dr. Bhau Daji Lad Museum`, rating: 4.5, totalRatings: 4200, types: ['museum'], address: 'Byculla, Mumbai', priceLevel: 1 },
        { name: `Kala Ghoda Art District`, rating: 4.7, totalRatings: 3800, types: ['art_gallery', 'tourist_attraction'], address: 'Fort, Mumbai', priceLevel: 0 },
      ];
    }
    // Default Mumbai demo data
    return [
      { name: `Marine Drive`, rating: 4.8, totalRatings: 45200, types: ['natural_feature'], address: 'Mumbai', priceLevel: 0 },
      { name: `Gateway of India`, rating: 4.7, totalRatings: 58000, types: ['tourist_attraction'], address: 'Mumbai', priceLevel: 0 },
      { name: `Colaba Causeway`, rating: 4.5, totalRatings: 15100, types: ['shopping_mall'], address: 'Mumbai', priceLevel: 1 },
      { name: `Juhu Beach`, rating: 4.3, totalRatings: 32700, types: ['natural_feature'], address: 'Mumbai', priceLevel: 0 },
      { name: `Aer Lounge`, rating: 4.6, totalRatings: 3400, types: ['bar', 'night_club'], address: 'Mumbai', priceLevel: 3 },
      { name: `Elephanta Caves`, rating: 4.6, totalRatings: 16200, types: ['tourist_attraction'], address: 'Mumbai', priceLevel: 1 },
    ];
  }

  if (destLower.includes('goa')) {
    if (mood === 'Relaxation') {
      return [
        { name: `Ashwem Beach`, rating: 4.7, totalRatings: 5200, types: ['natural_feature'], address: 'North Goa', priceLevel: 0 },
        { name: `Devaaya Ayurveda & Nature Cure Centre`, rating: 4.5, totalRatings: 800, types: ['spa', 'health'], address: 'Divar Island, Goa', priceLevel: 3 },
        { name: `Palolem Beach`, rating: 4.6, totalRatings: 18000, types: ['natural_feature'], address: 'South Goa', priceLevel: 0 },
        { name: `Artjuna Cafe`, rating: 4.5, totalRatings: 3200, types: ['cafe', 'restaurant'], address: 'Anjuna, Goa', priceLevel: 2 },
        { name: `Spice Plantation Walk`, rating: 4.4, totalRatings: 2100, types: ['park', 'tourist_attraction'], address: 'Ponda, Goa', priceLevel: 1 },
      ];
    }
    return [
      { name: `Baga Beach`, rating: 4.6, totalRatings: 13200, types: ['natural_feature'], address: 'Goa', priceLevel: 1 },
      { name: `Tito's Lane`, rating: 4.4, totalRatings: 8800, types: ['night_club'], address: 'Goa', priceLevel: 2 },
      { name: `Fort Aguada`, rating: 4.7, totalRatings: 15100, types: ['tourist_attraction'], address: 'Goa', priceLevel: 0 },
      { name: `Curlies Beach Shack`, rating: 4.5, totalRatings: 9700, types: ['restaurant', 'bar'], address: 'Goa', priceLevel: 1 },
      { name: `Dudhsagar Waterfalls`, rating: 4.5, totalRatings: 11400, types: ['natural_feature'], address: 'Goa', priceLevel: 0 },
      { name: `Club Cubana`, rating: 4.8, totalRatings: 6200, types: ['night_club'], address: 'Goa', priceLevel: 3 },
    ];
  }

  if (destLower.includes('bangalore') || destLower.includes('bengaluru')) {
    return [
      { name: `Lalbagh Botanical Garden`, rating: 4.6, totalRatings: 25000, types: ['park', 'natural_feature'], address: 'Malleswaram, Bangalore', priceLevel: 0 },
      { name: `Bangalore Palace`, rating: 4.5, totalRatings: 18000, types: ['tourist_attraction'], address: 'Vasanth Nagar, Bangalore', priceLevel: 2 },
      { name: `Cubbon Park`, rating: 4.7, totalRatings: 35000, types: ['park'], address: 'Kasturba Road, Bangalore', priceLevel: 0 },
      { name: `Toit Microbrewery`, rating: 4.6, totalRatings: 22000, types: ['bar', 'restaurant'], address: 'Indiranagar, Bangalore', priceLevel: 2 },
      { name: `Vidyarthi Bhavan`, rating: 4.5, totalRatings: 15000, types: ['restaurant', 'cafe'], address: 'Basavanagudi, Bangalore', priceLevel: 1 },
      { name: `Visvesvaraya Industrial & Technological Museum`, rating: 4.6, totalRatings: 12000, types: ['museum', 'tourist_attraction'], address: 'Kasturba Road, Bangalore', priceLevel: 1 },
      { name: `Commercial Street`, rating: 4.4, totalRatings: 28000, types: ['shopping_mall'], address: 'Tasker Town, Bangalore', priceLevel: 1 },
    ];
  }

  if (destLower.includes('jaipur')) {
    return [
      { name: `Amer Fort`, rating: 4.7, totalRatings: 42000, types: ['tourist_attraction'], address: 'Amer, Jaipur', priceLevel: 1 },
      { name: `Hawa Mahal`, rating: 4.6, totalRatings: 38000, types: ['tourist_attraction'], address: 'Pink City, Jaipur', priceLevel: 0 },
      { name: `City Palace`, rating: 4.5, totalRatings: 29000, types: ['tourist_attraction', 'museum'], address: 'Tulsi Marg, Jaipur', priceLevel: 2 },
      { name: `Chokhi Dhani`, rating: 4.3, totalRatings: 21000, types: ['restaurant'], address: 'Tonk Road, Jaipur', priceLevel: 3 },
      { name: `Jantar Mantar`, rating: 4.6, totalRatings: 17000, types: ['museum', 'tourist_attraction'], address: 'Kanwar Nagar, Jaipur', priceLevel: 1 },
      { name: `Johari Bazar`, rating: 4.4, totalRatings: 11000, types: ['shopping_mall'], address: 'Johri Bazar, Jaipur', priceLevel: 1 },
    ];
  }

  if (destLower.includes('manali')) {
    return [
      { name: `Solang Valley`, rating: 4.5, totalRatings: 23000, types: ['tourist_attraction', 'natural_feature'], address: 'Solang, Manali', priceLevel: 1 },
      { name: `Hadimba Temple`, rating: 4.6, totalRatings: 19000, types: ['tourist_attraction'], address: 'Hadimba Temple Road, Manali', priceLevel: 0 },
      { name: `Jogini Waterfalls`, rating: 4.7, totalRatings: 8000, types: ['natural_feature'], address: 'Vashisht, Manali', priceLevel: 0 },
      { name: `Mall Road`, rating: 4.4, totalRatings: 15000, types: ['shopping_mall'], address: 'Mall Road, Manali', priceLevel: 1 },
      { name: `Johnson Cafe`, rating: 4.5, totalRatings: 4000, types: ['restaurant', 'cafe'], address: 'Circuit House Road, Manali', priceLevel: 2 },
      { name: `Old Manali`, rating: 4.6, totalRatings: 6000, types: ['tourist_attraction'], address: 'Old Manali, Manali', priceLevel: 1 },
    ];
  }

  if (destLower.includes('bangkok')) {
    return [
      { name: `Grand Palace`, rating: 4.7, totalRatings: 55000, types: ['tourist_attraction'], address: 'Na Phra Lan Rd, Bangkok', priceLevel: 2 },
      { name: `Wat Arun`, rating: 4.6, totalRatings: 32000, types: ['tourist_attraction'], address: 'Wang Doem Rd, Bangkok', priceLevel: 1 },
      { name: `Khao San Road`, rating: 4.3, totalRatings: 28000, types: ['tourist_attraction', 'bar'], address: 'Khao San Rd, Bangkok', priceLevel: 1 },
      { name: `Chatuchak Weekend Market`, rating: 4.5, totalRatings: 41000, types: ['shopping_mall'], address: 'Kamphaeng Phet 2 Rd, Bangkok', priceLevel: 1 },
      { name: `Vertigo Rooftop Bar`, rating: 4.6, totalRatings: 5000, types: ['bar', 'restaurant'], address: 'Sathon Tai Rd, Bangkok', priceLevel: 3 },
      { name: `Chinatown Yaowarat`, rating: 4.5, totalRatings: 19000, types: ['restaurant', 'food'], address: 'Yaowarat Rd, Bangkok', priceLevel: 1 },
    ];
  }

  if (destLower.includes('kolkata')) {
    return [
      { name: `Victoria Memorial`, rating: 4.7, totalRatings: 48000, types: ['tourist_attraction', 'museum'], address: 'Queens Way, Maidan, Kolkata', priceLevel: 1 },
      { name: `Indian Museum`, rating: 4.5, totalRatings: 22000, types: ['museum', 'tourist_attraction'], address: 'Jawaharlal Nehru Rd, Kolkata', priceLevel: 1 },
      { name: `Dakshineswar Kali Temple`, rating: 4.8, totalRatings: 65000, types: ['hindu_temple', 'place_of_worship'], address: 'Dakshineswar, Kolkata', priceLevel: 0 },
      { name: `Flurys`, rating: 4.3, totalRatings: 8500, types: ['cafe', 'restaurant'], address: 'Park Street, Kolkata', priceLevel: 2 },
      { name: `College Street Boi Para`, rating: 4.6, totalRatings: 12000, types: ['shopping_mall'], address: 'College Street, Kolkata', priceLevel: 1 },
      { name: `Howrah Bridge`, rating: 4.6, totalRatings: 25000, types: ['tourist_attraction'], address: 'Howrah Bridge, Kolkata', priceLevel: 0 },
    ];
  }

  if (destLower.includes('delhi')) {
    return [
      { name: `Qutub Minar`, rating: 4.7, totalRatings: 42000, types: ['tourist_attraction'], address: 'Mehrauli, New Delhi', priceLevel: 1 },
      { name: `India Gate`, rating: 4.6, totalRatings: 55000, types: ['tourist_attraction'], address: 'Rajpath, New Delhi', priceLevel: 0 },
      { name: `Humayun's Tomb`, rating: 4.7, totalRatings: 32000, types: ['tourist_attraction', 'museum'], address: 'Mathura Rd, New Delhi', priceLevel: 1 },
      { name: `Lodhi Gardens`, rating: 4.6, totalRatings: 18000, types: ['park'], address: 'Lodhi Rd, New Delhi', priceLevel: 0 },
      { name: `Karim's Restaurant`, rating: 4.3, totalRatings: 15000, types: ['restaurant'], address: 'Jama Masjid, Old Delhi', priceLevel: 2 },
      { name: `Chandni Chowk Market`, rating: 4.4, totalRatings: 28000, types: ['shopping_mall'], address: 'Chandni Chowk, Old Delhi', priceLevel: 1 },
    ];
  }

  // Generic fallback with purely generic category experiences to avoid synthetic/fake landmark names
  const cap = destination.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  if (mood === 'Nightlife') {
    return [
      { name: `Rooftop Lounge Experience`, rating: 4.6, totalRatings: 1200, types: ['bar', 'night_club'], address: `${cap}`, priceLevel: 3 },
      { name: `Local Pub Crawl`, rating: 4.5, totalRatings: 800, types: ['bar'], address: `${cap}`, priceLevel: 2 },
      { name: `Live Music Venue`, rating: 4.7, totalRatings: 500, types: ['night_club', 'bar'], address: `${cap}`, priceLevel: 2 },
    ];
  }
  if (mood === 'Culture') {
    return [
      { name: `Guided Heritage Walk`, rating: 4.6, totalRatings: 3200, types: ['tourist_attraction', 'culture'], address: `${cap}`, priceLevel: 0 },
      { name: `City History Museum`, rating: 4.5, totalRatings: 1500, types: ['museum', 'tourist_attraction'], address: `${cap}`, priceLevel: 1 },
      { name: `Historical Monument Visit`, rating: 4.7, totalRatings: 4000, types: ['tourist_attraction', 'historical_landmark'], address: `${cap}`, priceLevel: 0 },
    ];
  }

  return [
    { name: `Guided Heritage Walk`, rating: 4.6, totalRatings: 3200, types: ['tourist_attraction', 'culture'], address: `${cap}`, priceLevel: 0 },
    { name: `Local Street Food Experience`, rating: 4.5, totalRatings: 1800, types: ['restaurant', 'food'], address: `${cap}`, priceLevel: 1 },
    { name: `Scenic Sunset Viewpoint`, rating: 4.7, totalRatings: 5100, types: ['natural_feature', 'tourist_attraction'], address: `${cap}`, priceLevel: 0 },
    { name: `Riverside Cafe Stop`, rating: 4.5, totalRatings: 2700, types: ['cafe', 'food'], address: `${cap}`, priceLevel: 1 },
    { name: `Local Market Exploration`, rating: 4.4, totalRatings: 1400, types: ['shopping_mall'], address: `${cap}`, priceLevel: 1 },
    { name: `Scenic Nature Trail Walk`, rating: 4.6, totalRatings: 6200, types: ['park', 'natural_feature'], address: `${cap}`, priceLevel: 0 },
  ];
}

// ─── Main exported function ───────────────────────────────────────

async function generateSmartItinerary({ destination, days, budget, mood, travelType }) {
  const apiKeyPresent = !!process.env.GOOGLE_MAPS_API_KEY && process.env.GOOGLE_MAPS_API_KEY !== 'your_google_maps_api_key_here';

  let rawPlaces = [];
  let dataSource = 'google_places';

  console.log(`\n[PlannerEngine] ═══ Generating: ${destination} | Mood: ${mood} | Days: ${days} ═══`);

  if (apiKeyPresent) {
    // ── Step 1: Mood-first targeted queries ──────────────────────────
    const moodQueries = getQueryList(destination, mood);
    console.log(`[PlannerEngine] Running ${moodQueries.length} mood-first queries...`);

    const settled = await Promise.allSettled(
      moodQueries.map(q => searchPlaces(destination, q))
    );
    const moodResults = settled
      .filter(r => r.status === 'fulfilled')
      .flatMap(r => r.value);

    const failedCount = settled.filter(r => r.status === 'rejected').length;
    console.log(`[PlannerEngine] Mood queries → ${moodResults.length} raw results (${failedCount} queries failed)`);

    let combined = moodResults;

    // ── Step 2: Mood-aware Nearby Search for spatial enrichment ──────
    const nearbyType = MOOD_NEARBY_TYPE[mood] || MOOD_NEARBY_TYPE.default;
    if (combined.length > 0 && combined[0].location) {
      try {
        const nearby = await getNearbyPlaces(
          combined[0].location.lat,
          combined[0].location.lng,
          nearbyType,
          5000
        );
        console.log(`[PlannerEngine] Nearby search (${nearbyType}) → ${nearby.length} additional results`);
        combined = [...combined, ...nearby];
      } catch (e) {
        console.warn(`[PlannerEngine] Nearby search failed: ${e.message}`);
      }
    }

    // ── Step 3: Fallback enrichment if mood results are thin ─────────
    // Only trigger generic query if we don't have enough mood-specific results
    const minNeeded = days * 3;
    if (combined.length < minNeeded) {
      console.log(`[PlannerEngine] Only ${combined.length} results; need ${minNeeded}. Running generic enrichment...`);
      try {
        const generic = await searchPlaces(destination, `top places to visit in ${destination}`);
        console.log(`[PlannerEngine] Generic enrichment → ${generic.length} additional results`);
        combined = [...combined, ...generic];
      } catch (e) {
        console.warn(`[PlannerEngine] Generic enrichment failed: ${e.message}`);
      }
    }

    rawPlaces = combined;
    console.log(`[PlannerEngine] Total raw places before dedup: ${rawPlaces.length}`);
  } else {
    rawPlaces = buildDemoAttractions(destination, mood);
    dataSource = 'demo_data';
    console.log(`[PlannerEngine] No API key — using demo data (${rawPlaces.length} places)`);
  }

  const unique = deduplicate(rawPlaces);
  console.log(`[PlannerEngine] After dedup: ${unique.length} unique places`);

  // ── Step 4: Strict mood-type filter ─────────────────────────────
  let filtered = unique.filter(p => isPlaceValid(p, mood));
  const withPhoto = filtered.filter(p => !!p.photoUrl).length;
  const withoutPhoto = filtered.length - withPhoto;
  console.log(`[PlannerEngine] After mood filter: ${filtered.length} valid places (${withPhoto} with Google photo, ${withoutPhoto} using fallback image)`);

  if (filtered.length < days * 2) {
    console.log(`[PlannerEngine] Insufficient mood-filtered results. Relaxing filter to EXCLUDED_TYPES only...`);
    // Relaxed threshold fallback to ensure itinerary generation succeeds
    filtered = unique.filter(p => {
      if (Array.isArray(p.types)) {
        for (const t of EXCLUDED_TYPES) {
          if (p.types.includes(t)) return false;
        }
      }
      return true;
    });
    console.log(`[PlannerEngine] After relaxed filter: ${filtered.length} places`);
  }

  const budgetTier = getBudgetTier(budget, days);
  const costMultiplier = BUDGET_MULTIPLIER[budgetTier];
  const targetRate = TARGET_UTILIZATION[budgetTier];
  const assumedFixedCosts = (budget * 0.25) + (budget * 0.10);
  const dailyTarget = Math.max(0, (budget * targetRate) - assumedFixedCosts) / days;

  const scored = filtered
    .map(p => ({ ...p, _score: scoreAttraction(p, mood, budgetTier, travelType) }))
    .sort((a, b) => b._score - a._score);

  const dayPlans = distributeAcrossDays(scored, days, mood, budgetTier, costMultiplier, dailyTarget, destination);

  const estimatedItineraryCost = dayPlans.reduce((s, d) => s + d.dayTotal, 0);
  const estimatedBudget = Math.round(estimatedItineraryCost + assumedFixedCosts);
  const avgDailySpend = Math.round(estimatedBudget / days);

  const totalAttractions = dayPlans.reduce((s, d) => s + d.activities.filter(a => !a.isMealBreak).length, 0);
  const intensity = classifyIntensity(totalAttractions / days);

  const budgetUtilization = Math.min(100, Math.round((estimatedBudget / budget) * 100));
  const remainingBudget = Math.max(0, budget - estimatedBudget);

  const experienceLevels = { budget: 'Budget Explorer', mid: 'Comfort Standard', premium: 'Premium Luxury' };
  const tripRichnessMapping = { budget: 'Standard', mid: 'Balanced', premium: 'High' };

  const budgetStatus = remainingBudget > 0
    ? `Within budget (₹${remainingBudget.toLocaleString()} remaining)`
    : `Slightly over budget by ₹${Math.abs(remainingBudget).toLocaleString()}`;

  const recommendations = buildRecommendations(mood, budgetTier, days, totalAttractions, destination, remainingBudget, budget);

  return {
    summary: {
      destination, days, travelType: travelType || 'Solo', mood,
      tripStyle: `${mood} — ${travelType || 'Solo'}`, budgetInput: budget,
      estimatedBudget, budgetCategory: BUDGET_LABEL[budgetTier], budgetStatus,
    },
    metadata: {
      totalAttractions, avgDailySpend, tripIntensity: intensity,
      budgetUtilization, remainingBudget, experienceLevel: experienceLevels[budgetTier],
      tripRichness: tripRichnessMapping[budgetTier], dataSource, generatedAt: new Date().toISOString(),
    },
    itinerary: dayPlans.map(({ day, theme, activities, dayTotal }) => ({
      day, theme, dayTotal,
      activities: activities.map(({ _score, _used, ...rest }) => rest),
    })),
    recommendations,
  };
}

module.exports = { generateSmartItinerary };
