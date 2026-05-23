const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Stop = sequelize.define('Stop', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  trip_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  city: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  country: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  start_date: {
    type: DataTypes.DATEONLY,
    defaultValue: null,
  },
  end_date: {
    type: DataTypes.DATEONLY,
    defaultValue: null,
  },
  order_index: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  notes: {
    type: DataTypes.TEXT,
    defaultValue: null,
  },
}, {
  tableName: 'stops',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Stop;
