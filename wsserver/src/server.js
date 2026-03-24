const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env'), override: true });

const app = require('./app');
const env = require('./config/env');
const pool = require('./db/pool');

const RETRY_DELAY_MS = 3000;
const MAX_RETRIES = 20;

async function waitForDb(retries = 0) {
  try {
    await pool.query('SELECT 1');
    console.log('Database connection ready.');
  } catch (error) {
    if (retries >= MAX_RETRIES) {
      console.error('Could not connect to database after max retries. Exiting.');
      process.exit(1);
    }
    console.log(`Database not ready, retrying in ${RETRY_DELAY_MS / 1000}s... (${retries + 1}/${MAX_RETRIES})`);
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    return waitForDb(retries + 1);
  }
}

async function ensureSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS studenti (
      id        INT         NOT NULL AUTO_INCREMENT,
      username  VARCHAR(64) NOT NULL,
      sezione   VARCHAR(10) NOT NULL,
      punteggio INT         NOT NULL DEFAULT 0,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  console.log('Schema ready.');
}

async function startServer() {
  await waitForDb();
  await ensureSchema();
  app.listen(env.port, () => {
    console.log(`Server running at http://localhost:${env.port}`);
  });
}

startServer();
