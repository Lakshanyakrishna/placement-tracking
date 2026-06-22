import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { AppConfigService } from '../../config/config.service';
import { IMailOptions } from '../../common/interfaces/i-mailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: nodemailer.Transporter;
  private readonly fromAddress: string;

  constructor(private readonly config: AppConfigService) {
    const mailConfig = config.mail;

    this.transporter = nodemailer.createTransport({
      host: mailConfig.host,
      port: mailConfig.port,
      secure: mailConfig.secure,
      auth:
        mailConfig.username && mailConfig.password
          ? { user: mailConfig.username, pass: mailConfig.password }
          : undefined,
      connectionTimeout: 5000,
      tls: {
        rejectUnauthorized: mailConfig.rejectUnauthorized,
      },
    });

    this.fromAddress = mailConfig.from;
  }

  async send(options: IMailOptions): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.fromAddress,
        to: options.to,
        subject: options.subject,
        text: options.body,
        html: options.html || options.body,
      });
      this.logger.log(`Email sent to ${options.to}: ${options.subject}`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to send email to ${options.to}: ${message}`);
    }
  }

  async checkConnection(): Promise<{ status: string; latencyMs?: number }> {
    const start = Date.now();
    try {
      await this.transporter.verify();
      return { status: 'ok', latencyMs: Date.now() - start };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Mail server not reachable: ${message}`);
      return { status: 'error', latencyMs: Date.now() - start };
    }
  }
}
