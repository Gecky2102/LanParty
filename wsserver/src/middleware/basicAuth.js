import env from '../config/env.js';

function parseBasicAuth(authHeader) {
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return null;
  }

  try {
    const base64Part = authHeader.slice(6).trim();
    const decoded = Buffer.from(base64Part, 'base64').toString('utf8');
    const separatorIndex = decoded.indexOf(':');

    if (separatorIndex < 0) {
      return null;
    }

    return {
      username: decoded.slice(0, separatorIndex),
      password: decoded.slice(separatorIndex + 1)
    };
  } catch (error) {
    return null;
  }
}

export function requireAdmin(req, res, next) {
  const credentials = parseBasicAuth(req.headers.authorization);

  if (!credentials || credentials.username !== env.adminUser || credentials.password !== env.adminPassword) {
    return res.status(401).json({ message: 'Credenziali admin non valide' });
  }

  return next();
}
