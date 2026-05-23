const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Activity = sequelize.define('Activity', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  stop_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  activity_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  category: {
    type: DataTypes.ENUM('sightseeing', 'food', 'adventure', 'culture', 'shopping', 'nightlife', 'relaxation', 'transport', 'other'),
    defaultValue: 'other',
  },
  cost: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  duration: {
    type: DataTypes.STRING,
    defaultValue: null,
  },
  notes: {
    type: DataTypes.TEXT,
    defaultValue: null,
  },
  time: {
    type: DataTypes.STRING,
    defaultValue: null,
  },
}, {
  tableName: 'activities',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Activity;
