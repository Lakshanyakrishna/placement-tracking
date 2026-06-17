import { registerAs } from '@nestjs/config';

export default registerAs('auth', () => ({
  bcryptRounds: parseInt(process.env.AUTH_BCRYPT_ROUNDS || '10', 10),
  maxLoginAttempts: parseInt(process.env.AUTH_MAX_LOGIN_ATTEMPTS || '10', 10),
  loginRateLimitMs: parseInt(process.env.AUTH_LOGIN_RATE_LIMIT_MS || '1000', 10),
  passwordResetExpiryMs: parseInt(process.env.AUTH_PASSWORD_RESET_EXPIRY_MS || '3600000', 10),
}));
