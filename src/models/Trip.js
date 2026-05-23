const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Trip = sequelize.define('Trip', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    defaultValue: null,
  },
  start_date: {
    type: DataTypes.DATEONLY,
    defaultValue: null,
  },
  end_date: {
    type: DataTypes.DATEONLY,
    defaultValue: null,
  },
  cover_image: {
    type: DataTypes.STRING,
    defaultValue: null,
  },
  status: {
    type: DataTypes.ENUM('draft', 'planned', 'ongoing', 'completed'),
    defaultValue: 'planned',
  },
  is_public: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  tableName: 'trips',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Trip;
