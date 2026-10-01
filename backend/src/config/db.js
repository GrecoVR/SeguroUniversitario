const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'db',
  user: process.env.DB_USER || 'ssu_user',
  password: process.env.DB_PASSWORD || 'ssu_password',
  database: process.env.DB_NAME || 'ssu_db',
  port: process.env.DB_PORT || 5432,
});

pool.on('connect', () => {
  console.log('Conectado exitosamente a PostgreSQL');
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};