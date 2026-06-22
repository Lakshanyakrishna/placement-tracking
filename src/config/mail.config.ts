import { registerAs } from '@nestjs/config';

export default registerAs('mail', () => ({
  host: process.env.MAIL_HOST || 'localhost',
  port: parseInt(process.env.MAIL_PORT || '1025', 10),
  username: process.env.MAIL_USERNAME || '',
  password: process.env.MAIL_PASSWORD || '',
  from: process.env.MAIL_FROM || 'noreply@placement.local',
  templateDir: process.env.MAIL_TEMPLATE_DIR || './templates/email',
  secure: process.env.MAIL_SECURE ? process.env.MAIL_SECURE === 'true' : undefined,
  rejectUnauthorized: process.env.MAIL_REJECT_UNAUTHORIZED ? process.env.MAIL_REJECT_UNAUTHORIZED === 'true' : true,
}));
