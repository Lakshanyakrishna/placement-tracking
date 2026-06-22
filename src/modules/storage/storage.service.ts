import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  S3Client,
  ListBucketsCommand,
  HeadBucketCommand,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  CreateBucketCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { AppConfigService } from '../../config/config.service';
import * as fs from 'node:fs';
import * as fsp from 'node:fs/promises';
import * as path from 'node:path';
import { Readable } from 'node:stream';

interface DownloadResult {
  body: Readable;
  contentType: string;
  contentLength: number;
  originalFilename: string;
}

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private client: S3Client | null = null;
  private readonly bucket: string;
  private readonly useS3: boolean;
  private readonly localDir: string;
  private readonly downloadUrlExpiry: number;

  constructor(private readonly config: AppConfigService) {
    const storageConfig = config.storage;
    this.bucket = storageConfig.bucket;
    this.downloadUrlExpiry = storageConfig.downloadUrlExpiry;
    this.localDir = path.resolve(process.cwd(), 'uploads');

    const endpoint = storageConfig.endpoint;
    this.useS3 = !!endpoint;

    if (this.useS3) {
      this.client = new S3Client({
        endpoint,
        region: storageConfig.region,
        credentials: {
          accessKeyId: storageConfig.accessKeyId,
          secretAccessKey: storageConfig.secretAccessKey,
        },
        forcePathStyle: true,
        requestHandler: {
          requestTimeout: 5000,
        },
      });
      this.logger.log(`S3 storage configured: endpoint=${endpoint}, bucket=${this.bucket}`);
    } else {
      this.logger.warn('No STORAGE_ENDPOINT set — using local filesystem. Uploads will NOT persist across restarts on ephemeral hosts (Railway, Heroku, etc.). Set STORAGE_ENDPOINT to an S3-compatible provider for production.');
    }
  }

  async onModuleInit(): Promise<void> {
    if (this.useS3) {
      await this.ensureBucket();
    } else {
      await fsp.mkdir(this.localDir, { recursive: true });
      this.logger.log(`Local storage directory: ${this.localDir}`);
    }
  }

  private async ensureBucket(): Promise<void> {
    try {
      await this.client!.send(new HeadBucketCommand({ Bucket: this.bucket }));
      this.logger.log(`Bucket "${this.bucket}" exists`);
    } catch {
      this.logger.warn(`Bucket "${this.bucket}" not found, attempting to create...`);
      try {
        await this.client!.send(new CreateBucketCommand({ Bucket: this.bucket }));
        this.logger.log(`Bucket "${this.bucket}" created`);
      } catch (createError: unknown) {
        const message = createError instanceof Error ? createError.message : 'Unknown error';
        this.logger.error(`Failed to create bucket "${this.bucket}": ${message}`);
      }
    }
  }

  async checkConnection(): Promise<{ status: string; latencyMs?: number; driver: string }> {
    if (!this.useS3) {
      try {
        await fsp.access(this.localDir, fs.constants.W_OK);
        return { status: 'ok', latencyMs: 0, driver: 'local' };
      } catch {
        return { status: 'error', latencyMs: 0, driver: 'local' };
      }
    }

    const start = Date.now();
    try {
      await this.client!.send(new HeadBucketCommand({ Bucket: this.bucket }));
      return { status: 'ok', latencyMs: Date.now() - start, driver: 's3' };
    } catch {
      try {
        await this.client!.send(new ListBucketsCommand({}));
        return { status: 'degraded', latencyMs: Date.now() - start, driver: 's3' };
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(`Storage connection failed: ${message}`);
        return { status: 'error', latencyMs: Date.now() - start, driver: 's3' };
      }
    }
  }

  async upload(key: string, buffer: Buffer, contentType: string): Promise<void> {
    if (this.useS3) {
      await this.client!.send(new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      }));
      this.logger.debug(`Uploaded s3://${this.bucket}/${key}`);
    } else {
      const filePath = path.join(this.localDir, key);
      await fsp.mkdir(path.dirname(filePath), { recursive: true });
      await fsp.writeFile(filePath, buffer);
      this.logger.debug(`Uploaded local://${filePath}`);
    }
  }

  async download(key: string): Promise<DownloadResult> {
    if (this.useS3) {
      const result = await this.client!.send(new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }));
      return {
        body: result.Body as Readable,
        contentType: result.ContentType ?? 'application/octet-stream',
        contentLength: Number(result.ContentLength ?? 0),
        originalFilename: path.basename(key),
      };
    }

    const filePath = path.join(this.localDir, key);
    const stat = await fsp.stat(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const mimeMap: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    };
    return {
      body: fs.createReadStream(filePath),
      contentType: mimeMap[ext] ?? 'application/octet-stream',
      contentLength: stat.size,
      originalFilename: path.basename(key),
    };
  }

  async delete(key: string): Promise<void> {
    if (this.useS3) {
      try {
        await this.client!.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
        this.logger.debug(`Deleted s3://${this.bucket}/${key}`);
      } catch {
        // ignore deletion errors
      }
    } else {
      const filePath = path.join(this.localDir, key);
      try {
        await fsp.unlink(filePath);
        this.logger.debug(`Deleted local://${filePath}`);
      } catch {
        // ignore deletion errors
      }
    }
  }

  async getDownloadUrl(key: string): Promise<string | null> {
    if (!this.useS3) return null;

    try {
      const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
      return await getSignedUrl(this.client!, command, { expiresIn: this.downloadUrlExpiry });
    } catch {
      return null;
    }
  }

  /** Legacy: raw S3 client for backwards compat */
  getClient(): S3Client | null {
    return this.client;
  }

  getBucket(): string {
    return this.bucket;
  }
}
