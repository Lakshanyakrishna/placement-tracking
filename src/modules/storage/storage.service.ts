import { Injectable, Logger } from '@nestjs/common';
import { S3Client, ListBucketsCommand, HeadBucketCommand } from '@aws-sdk/client-s3';
import { AppConfigService } from '../../config/config.service';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(private readonly config: AppConfigService) {
    const storageConfig = config.storage;

    this.client = new S3Client({
      endpoint: storageConfig.endpoint,
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

    this.bucket = storageConfig.bucket;
  }

  async checkConnection(): Promise<{ status: string; latencyMs?: number }> {
    const start = Date.now();
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
      return { status: 'ok', latencyMs: Date.now() - start };
    } catch {
      try {
        await this.client.send(new ListBucketsCommand({}));
        return { status: 'degraded', latencyMs: Date.now() - start };
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(`Storage connection failed: ${message}`);
        return { status: 'error', latencyMs: Date.now() - start };
      }
    }
  }

  getClient(): S3Client {
    return this.client;
  }

  getBucket(): string {
    return this.bucket;
  }
}
