import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import env from './config/env.js';
import publicRoutes from './routes/publicRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
const staticDir = join(__dirname, '..', 'sito');

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', env.corsOrigin);
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  return next();
});

app.use(express.json());
app.use(express.static(staticDir));

app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

app.get('/admin/dashboard', (req, res) => {
  res.sendFile(join(staticDir, 'admin.html'));
});

app.get('/admin/login', (req, res) => {
  res.sendFile(join(staticDir, 'admin-login.html'));
});

app.post('/admin/login-check', (req, res) => {
  const { username, password } = req.body || {};
  const ok = username === env.adminUser && password === env.adminPassword;

  console.log(`[login-check] user="${username}" ok=${ok} expected_user="${env.adminUser}"`);

  if (!ok) {
    return res.status(200).json({ ok: false, message: 'Credenziali admin non valide' });
  }

  return res.status(200).json({ ok: true });
});

app.use(publicRoutes);
app.use(adminRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
