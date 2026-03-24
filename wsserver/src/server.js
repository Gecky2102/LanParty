const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env'), override: true });

const app = require('./app');
const env = require('./config/env');
const pool = require('./db/pool');

async function startServer() {
  try {
    await pool.query('SELECT 1');
    console.log('Database connection ready.');

    app.listen(env.port, () => {
      console.log(`Server running at http://localhost:${env.port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
