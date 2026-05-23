const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TripNote = sequelize.define('TripNote', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  trip_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  note: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  day_label: {
    type: DataTypes.STRING,
    defaultValue: null,
  },
}, {
  tableName: 'trip_notes',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = TripNote;
