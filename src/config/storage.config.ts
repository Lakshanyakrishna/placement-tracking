import { registerAs } from '@nestjs/config';

export default registerAs('storage', () => ({
  endpoint: process.env.STORAGE_ENDPOINT || 'http://localhost:9000',
  region: process.env.STORAGE_REGION || 'us-east-1',
  accessKeyId: process.env.STORAGE_ACCESS_KEY_ID || 'minioadmin',
  secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY || 'minioadmin',
  bucket: process.env.STORAGE_BUCKET || 'placement-proofs',
  uploadUrlExpiry: parseInt(process.env.STORAGE_UPLOAD_URL_EXPIRY || '3600', 10),
  downloadUrlExpiry: parseInt(process.env.STORAGE_DOWNLOAD_URL_EXPIRY || '300', 10),
  useSsl: process.env.STORAGE_USE_SSL === 'true',
}));
