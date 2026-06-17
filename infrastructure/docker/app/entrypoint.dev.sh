#!/bin/sh
set -e

echo "=== Waiting for dependencies ==="

echo "Waiting for PostgreSQL..."
until pg_isready -h db -U "$DB_USERNAME" -d "$DB_DATABASE" 2>/dev/null; do
  sleep 1
done
echo "PostgreSQL is ready."

echo "Waiting for MinIO..."
until curl -sf "http://minio:9000/minio/health/live" > /dev/null 2>&1; do
  sleep 1
done
echo "MinIO is ready."

echo "Waiting for MailHog..."
until nc -z mailhog 1025 2>/dev/null; do
  sleep 1
done
echo "MailHog is ready."

echo "=== Running database migrations ==="
npm run migration:run

echo "=== Creating MinIO bucket ==="
node -e "
const { S3Client, CreateBucketCommand, HeadBucketCommand } = require('@aws-sdk/client-s3');
const client = new S3Client({
  endpoint: process.env.STORAGE_ENDPOINT,
  region: process.env.STORAGE_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.STORAGE_ACCESS_KEY_ID,
    secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true,
});
const bucket = process.env.STORAGE_BUCKET || 'placement-proofs';
client.send(new HeadBucketCommand({ Bucket: bucket }))
  .then(() => console.log('Bucket already exists.'))
  .catch(() => client.send(new CreateBucketCommand({ Bucket: bucket }))
    .then(() => console.log('Bucket created.'))
    .catch(() => {}));
" 2>/dev/null || echo "Bucket setup skipped (will be created at runtime)."

echo "=== Starting application ==="
exec "$@"
