import mysql from 'mysql2/promise';
import env from '../config/env.js';

const pool = mysql.createPool({
  host: env.mysqlHost,
  user: env.mysqlUser,
  password: env.mysqlPassword,
  database: env.mysqlDatabase,
  waitForConnections: true,
  connectionLimit: env.mysqlConnectionLimit,
  queueLimit: 0
});

export default pool;
