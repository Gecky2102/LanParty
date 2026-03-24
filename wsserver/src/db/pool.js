const mysql = require('mysql2/promise');
const env = require('../config/env');

const pool = mysql.createPool({
  host: env.mysqlHost,
  user: env.mysqlUser,
  password: env.mysqlPassword,
  database: env.mysqlDatabase,
  waitForConnections: true,
  connectionLimit: env.mysqlConnectionLimit,
  queueLimit: 0
});

module.exports = pool;
