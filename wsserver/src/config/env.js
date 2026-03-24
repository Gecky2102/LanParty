const DEFAULTS = {
  port: 3000,
  mysqlHost: 'mysql',
  mysqlUser: 'root',
  mysqlPassword: 'cisco',
  mysqlDatabase: 'lanparty',
  mysqlConnectionLimit: 10,
  adminUser: 'admin',
  adminPassword: 'admin123',
  corsOrigin: '*'
};

function toNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

const env = {
  port: toNumber(process.env.PORT, DEFAULTS.port),
  mysqlHost: process.env.MYSQL_HOST || DEFAULTS.mysqlHost,
  mysqlUser: process.env.MYSQL_USER || DEFAULTS.mysqlUser,
  mysqlPassword: process.env.MYSQL_ROOT_PASSWORD || DEFAULTS.mysqlPassword,
  mysqlDatabase: process.env.MYSQL_DATABASE || DEFAULTS.mysqlDatabase,
  mysqlConnectionLimit: toNumber(process.env.MYSQL_CONNECTION_LIMIT, DEFAULTS.mysqlConnectionLimit),
  adminUser: process.env.ADMIN_USER || DEFAULTS.adminUser,
  adminPassword: process.env.ADMIN_PASSWORD || DEFAULTS.adminPassword,
  corsOrigin: process.env.CORS_ORIGIN || DEFAULTS.corsOrigin
};

module.exports = env;
