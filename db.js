const mysql = require('mysql2/promise');
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'Bestdavidx23',
    database: 'barbearia',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    // timezone: 'Z' // ajuste se necessário
});
module.exports = pool;