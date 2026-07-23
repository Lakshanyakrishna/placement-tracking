import { DataSource } from 'typeorm';

const isProduction = process.env.APP_ENV === 'production' || process.env.NODE_ENV === 'production';

function resolvePassword(): string {
  if (process.env.DB_PASSWORD) return process.env.DB_PASSWORD;
  if (isProduction) {
    throw new Error('DB_PASSWORD must be set when running in production (APP_ENV or NODE_ENV=production).');
  }
  console.warn('[data-source] DB_PASSWORD is not set — using an insecure development-only fallback. Never use this in production.');
  return 'dev_password_only';
}

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: resolvePassword(),
  database: process.env.DB_DATABASE || 'placement_tracker',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});
