import pg from 'pg';
const { Pool } = pg;

let pool;

export function getPool() {
  if (!pool) {
    pool = new Pool({
      host: process.env.DB_HOST || '178.156.252.22',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'budgetgen',
      user: process.env.DB_USER || 'budgetgen',
      password: process.env.DB_PASSWORD,
      max: 5,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 10000,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    });
  }
  return pool;
}
