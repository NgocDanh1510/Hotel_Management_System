const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql', // change this to postgres, sqlite, or mariadb if needed
    logging: false, // set to console.log to see the raw SQL queries
  }
);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('MySQL/Sequelize Connected successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error.message);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
