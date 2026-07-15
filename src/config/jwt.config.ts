import { registerAs } from '@nestjs/config';

const isProduction = process.env.APP_ENV === 'production' || process.env.NODE_ENV === 'production';

function resolveSecret(): string {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  if (isProduction) {
    throw new Error('JWT_SECRET must be set when running in production (APP_ENV or NODE_ENV=production).');
  }
  console.warn('[jwt.config] JWT_SECRET is not set — using an insecure development-only fallback. Never use this in production.');
  return 'dev-jwt-secret-change-in-production';
}

export default registerAs('jwt', () => ({
  secret: resolveSecret(),
  accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
  refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  issuer: process.env.JWT_ISSUER || 'placement-tracker',
}));
