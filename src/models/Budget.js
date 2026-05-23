const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Budget = sequelize.define('Budget', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  trip_id: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true,
  },
  transport_cost: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  hotel_cost: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  food_cost: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  activity_cost: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  miscellaneous_cost: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  total_budget: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
}, {
  tableName: 'budgets',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  hooks: {
    beforeSave: (budget) => {
      budget.total_budget =
        parseFloat(budget.transport_cost || 0) +
        parseFloat(budget.hotel_cost || 0) +
        parseFloat(budget.food_cost || 0) +
        parseFloat(budget.activity_cost || 0) +
        parseFloat(budget.miscellaneous_cost || 0);
    },
  },
});

module.exports = Budget;
