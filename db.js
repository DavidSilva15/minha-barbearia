const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'barbearia',
  password: process.env.DB_PASS || 'SENHA_FORTE_AQUI',
  database: process.env.DB_NAME || 'barbearia',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // timezone: 'Z'
});

module.exports = pool;