const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ChecklistItem = sequelize.define('ChecklistItem', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  trip_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  item_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  category: {
    type: DataTypes.ENUM('clothing', 'electronics', 'documents', 'essentials', 'other'),
    defaultValue: 'other',
  },
  completed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  tableName: 'checklist_items',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = ChecklistItem;
