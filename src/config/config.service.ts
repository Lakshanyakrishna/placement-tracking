import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppConfigService {
  constructor(private readonly configService: ConfigService) {}

  get database() {
    return {
      host: this.configService.get<string>('database.host') || 'localhost',
      port: this.configService.get<number>('database.port') || 5432,
      username: this.configService.get<string>('database.username') || 'postgres',
      // database.config.ts already fails fast in production and warns in dev, so this is always set.
      password: this.configService.get<string>('database.password') as string,
      database: this.configService.get<string>('database.database') || 'placement_tracker',
      ssl: this.configService.get<boolean>('database.ssl') || false,
    };
  }

  get jwt() {
    return {
      // jwt.config.ts already fails fast in production and warns in dev, so this is always set.
      secret: this.configService.get<string>('jwt.secret') as string,
      accessExpiry: this.configService.get<string>('jwt.accessExpiry') || '15m',
      refreshExpiry: this.configService.get<string>('jwt.refreshExpiry') || '7d',
      issuer: this.configService.get<string>('jwt.issuer') || 'placement-tracker',
    };
  }

  get storage() {
    return {
      endpoint: this.configService.get<string>('storage.endpoint') ?? '',
      region: this.configService.get<string>('storage.region') || 'us-east-1',
      accessKeyId: this.configService.get<string>('storage.accessKeyId') ?? '',
      secretAccessKey: this.configService.get<string>('storage.secretAccessKey') ?? '',
      bucket: this.configService.get<string>('storage.bucket') || 'placement-proofs',
      uploadUrlExpiry: this.configService.get<number>('storage.uploadUrlExpiry') || 3600,
      downloadUrlExpiry: this.configService.get<number>('storage.downloadUrlExpiry') || 300,
      useSsl: this.configService.get<boolean>('storage.useSsl') || false,
    };
  }

  get mail() {
    return {
      host: this.configService.get<string>('mail.host') || 'localhost',
      port: this.configService.get<number>('mail.port') || 1025,
      username: this.configService.get<string>('mail.username') || '',
      password: this.configService.get<string>('mail.password') || '',
      from: this.configService.get<string>('mail.from') || 'noreply@placement.local',
      templateDir: this.configService.get<string>('mail.templateDir') || './templates/email',
      secure: this.configService.get('mail.secure') as boolean | undefined,
      rejectUnauthorized: (this.configService.get<boolean>('mail.rejectUnauthorized')) ?? true,
    };
  }

  get app() {
    return {
      port: this.configService.get<number>('app.port') || 3000,
      corsOrigin: this.configService.get<string>('app.corsOrigin') || 'http://localhost:5173',
      logLevel: this.configService.get<string>('app.logLevel') || 'debug',
      baseUrl: this.configService.get<string>('app.baseUrl') || 'http://localhost:3000',
      environment: this.configService.get<string>('app.environment') || 'development',
    };
  }

  get auth() {
    return {
      bcryptRounds: this.configService.get<number>('auth.bcryptRounds') || 10,
      maxLoginAttempts: this.configService.get<number>('auth.maxLoginAttempts') || 10,
      loginRateLimitMs: this.configService.get<number>('auth.loginRateLimitMs') || 1000,
      passwordResetExpiryMs: this.configService.get<number>('auth.passwordResetExpiryMs') || 3600000,
    };
  }
}
