const { Sequelize } = require('sequelize');
require('dotenv').config();

// Force the Vercel bundler (@vercel/nft) to package the pg/pg-hstore dependencies
require('pg');
require('pg-hstore');

const isProduction = process.env.NODE_ENV === 'production';

// Managed databases like Neon, Supabase, Render require SSL in production
const dialectOptions = isProduction
  ? {
      ssl: {
        require: true,
        rejectUnauthorized: false, // Prevents certificate chain verification failures
      },
    }
  : {};

let sequelize;

if (process.env.DATABASE_URL) {
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: isProduction ? false : console.log,
    dialectOptions,
    pool: {
      max: isProduction ? 2 : 10, // Serverless environments need a smaller connection pool limit
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  });
} else {
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      dialect: 'postgres',
      logging: isProduction ? false : console.log,
      dialectOptions,
      pool: {
        max: isProduction ? 2 : 10,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
    }
  );
}

module.exports = sequelize;
