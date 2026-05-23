const sequelize = require('../config/database');
const User = require('./User');
const Trip = require('./Trip');
const Stop = require('./Stop');
const Activity = require('./Activity');
const Budget = require('./Budget');
const ChecklistItem = require('./ChecklistItem');
const TripNote = require('./TripNote');

// User <-> Trip
User.hasMany(Trip, { foreignKey: 'user_id', as: 'trips', onDelete: 'CASCADE' });
Trip.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Trip <-> Stop
Trip.hasMany(Stop, { foreignKey: 'trip_id', as: 'stops', onDelete: 'CASCADE' });
Stop.belongsTo(Trip, { foreignKey: 'trip_id', as: 'trip' });

// Stop <-> Activity
Stop.hasMany(Activity, { foreignKey: 'stop_id', as: 'activities', onDelete: 'CASCADE' });
Activity.belongsTo(Stop, { foreignKey: 'stop_id', as: 'stop' });

// Trip <-> Budget (one-to-one)
Trip.hasOne(Budget, { foreignKey: 'trip_id', as: 'budget', onDelete: 'CASCADE' });
Budget.belongsTo(Trip, { foreignKey: 'trip_id', as: 'trip' });

// Trip <-> ChecklistItem
Trip.hasMany(ChecklistItem, { foreignKey: 'trip_id', as: 'checklist_items', onDelete: 'CASCADE' });
ChecklistItem.belongsTo(Trip, { foreignKey: 'trip_id', as: 'trip' });

// Trip <-> TripNote
Trip.hasMany(TripNote, { foreignKey: 'trip_id', as: 'notes', onDelete: 'CASCADE' });
TripNote.belongsTo(Trip, { foreignKey: 'trip_id', as: 'trip' });

const syncDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected successfully');
    
    // Only run database sync with alter: true in non-production environments
    if (process.env.NODE_ENV !== 'production') {
      await sequelize.sync({ alter: true });
      console.log('✅ Database synchronized');
    } else {
      console.log('ℹ️ Skipping database sync in production mode');
    }
  } catch (error) {
    console.error('❌ Database connection or sync failed:', error);
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }
    throw error;
  }
};

module.exports = {
  sequelize,
  User,
  Trip,
  Stop,
  Activity,
  Budget,
  ChecklistItem,
  TripNote,
  syncDatabase,
};
