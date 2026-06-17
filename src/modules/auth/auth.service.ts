import { Injectable, Logger, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { AppConfigService } from '../../config/config.service';
import { UsersService } from '../users/users.service';
import { IamService } from '../iam/iam.service';
import { MailService } from '../mail/mail.service';
import { User } from '../users/entities/user.entity';
import { Enrollment } from '../enrollments/entities/enrollment.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { PasswordResetToken } from './entities/password-reset-token.entity';

interface TokenPayload {
  sub: string;
  email: string;
  name: string;
  roles: Array<{ role: string; scopeType: string; scopeId: string | null }>;
  enrollment: {
    id: string;
    academicPeriodId: string;
    branchId: string;
    sectionId: string;
    groupId?: string;
    batchId: string;
  } | null;
}

interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    isActive: boolean;
    mustChangePassword: boolean;
    roles: Array<{ role: string; scopeType: string; scopeId: string | null }>;
    enrollment: TokenPayload['enrollment'] | null;
  };
}

function sha256(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

function generateRandomToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly iamService: IamService,
    private readonly jwtService: JwtService,
    private readonly config: AppConfigService,
    private readonly mailService: MailService,

    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,

    @InjectRepository(PasswordResetToken)
    private readonly passwordResetTokenRepository: Repository<PasswordResetToken>,

    @InjectRepository(Enrollment)
    private readonly enrollmentRepository: Repository<Enrollment>,
  ) {}

  async login(email: string, password: string): Promise<LoginResult> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const roles = await this.iamService.findActiveRolesByUser(user.id);
    const enrollment = await this.findActiveEnrollment(user.id);

    const tokenPayload = this.buildTokenPayload(user, roles, enrollment);
    const accessToken = this.jwtService.sign(tokenPayload);
    const refreshToken = await this.createRefreshToken(user.id);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isActive: user.isActive,
        mustChangePassword: user.mustChangePassword,
        roles: tokenPayload.roles,
        enrollment: tokenPayload.enrollment ?? null,
      },
    };
  }

  async refresh(rawToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const tokenHash = sha256(rawToken);
    const storedToken = await this.refreshTokenRepository.findOne({
      where: { tokenHash },
      relations: ['user'],
    });

    if (!storedToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (storedToken.revokedAt) {
      await this.revokeTokenFamily(storedToken.userId, storedToken.family);
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    if (new Date() > storedToken.expiresAt) {
      throw new UnauthorizedException('Refresh token has expired');
    }

    storedToken.revokedAt = new Date();
    await this.refreshTokenRepository.save(storedToken);

    const user = storedToken.user;

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    const roles = await this.iamService.findActiveRolesByUser(user.id);
    const enrollment = await this.findActiveEnrollment(user.id);

    const tokenPayload = this.buildTokenPayload(user, roles, enrollment);
    const accessToken = this.jwtService.sign(tokenPayload);

    const newRefreshToken = await this.createRefreshToken(user.id, storedToken.family);

    return { accessToken, refreshToken: newRefreshToken };
  }

  async logout(rawToken: string): Promise<void> {
    const tokenHash = sha256(rawToken);
    const storedToken = await this.refreshTokenRepository.findOne({
      where: { tokenHash },
    });

    if (storedToken) {
      storedToken.revokedAt = new Date();
      await this.refreshTokenRepository.save(storedToken);
    }
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      return;
    }

    const rawToken = generateRandomToken();
    const tokenHash = sha256(rawToken);
    const expiresAt = new Date(Date.now() + this.config.auth.passwordResetExpiryMs);

    await this.passwordResetTokenRepository.insert({
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    const resetUrl = `${this.config.app.baseUrl}/auth/reset-password?token=${rawToken}`;

    await this.mailService.send({
      to: user.email,
      subject: 'Password Reset Request',
      body: `Use this link to reset your password: ${resetUrl}\n\nThis link expires in ${this.config.auth.passwordResetExpiryMs / 60000} minutes.`,
      html: `<p>Use this link to reset your password:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>This link expires in ${this.config.auth.passwordResetExpiryMs / 60000} minutes.</p>`,
    });
  }

  async resetPassword(rawToken: string, newPassword: string): Promise<void> {
    const tokenHash = sha256(rawToken);
    const storedToken = await this.passwordResetTokenRepository.findOne({
      where: { tokenHash },
      relations: ['user'],
    });

    if (!storedToken) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    if (storedToken.usedAt) {
      throw new BadRequestException('Reset token has already been used');
    }

    if (new Date() > storedToken.expiresAt) {
      throw new BadRequestException('Reset token has expired');
    }

    const rounds = this.config.auth.bcryptRounds ?? 10;
    const newHash = await bcrypt.hash(newPassword, rounds);

    storedToken.usedAt = new Date();
    await this.passwordResetTokenRepository.save(storedToken);
    await this.usersService.updatePasswordHash(storedToken.userId, newHash);

    await this.refreshTokenRepository.update(
      { userId: storedToken.userId, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      throw new BadRequestException('Current password is incorrect');
    }

    const rounds = this.config.auth.bcryptRounds ?? 10;
    const newHash = await bcrypt.hash(newPassword, rounds);
    await this.usersService.updatePasswordHash(userId, newHash);
    await this.usersService.clearMustChangePassword(userId);
  }

  private async findActiveEnrollment(userId: string): Promise<{
    id: string;
    academicPeriodId: string;
    branchId: string;
    sectionId: string;
    groupId?: string;
    batchId: string;
  } | null> {
    const now = new Date();
    const enrollment = await this.enrollmentRepository.findOne({
      where: {
        userId,
        isActive: true,
      },
      relations: {
        academicPeriod: true,
      },
    });

    if (!enrollment) {
      return null;
    }

    const period = enrollment.academicPeriod;
    if (!period || period.startDate > now || period.endDate < now) {
      return null;
    }

    return {
      id: enrollment.id,
      academicPeriodId: enrollment.academicPeriodId,
      branchId: enrollment.branchId,
      sectionId: enrollment.sectionId,
      groupId: enrollment.groupId ?? undefined,
      batchId: enrollment.batchId,
    };
  }

  private buildTokenPayload(
    user: User,
    roles: Array<{ role: string; scopeType: string; scopeId: string | null }>,
    enrollment: {
      id: string;
      academicPeriodId: string;
      branchId: string;
      sectionId: string;
      groupId?: string;
      batchId: string;
    } | null,
  ): TokenPayload {
    return {
      sub: user.id,
      email: user.email,
      name: user.name,
      roles: roles.map((r) => ({
        role: r.role,
        scopeType: r.scopeType,
        scopeId: r.scopeId,
      })),
      enrollment: enrollment ?? null,
    };
  }

  private async createRefreshToken(userId: string, family?: string): Promise<string> {
    const tokenFamily = family || crypto.randomBytes(16).toString('hex');
    const rawToken = generateRandomToken();
    const tokenHash = sha256(rawToken);

    const refreshConfig = this.config.jwt.refreshExpiry;
    const match = refreshConfig.match(/^(\d+)([dhms])$/);
    let expiresInMs = 7 * 24 * 60 * 60 * 1000;

    const multipliers: Record<string, number> = {
      d: 24 * 60 * 60 * 1000,
      h: 60 * 60 * 1000,
      m: 60 * 1000,
      s: 1000,
    };

    if (match) {
      const value = parseInt(match[1], 10);
      const unit = match[2];
      expiresInMs = value * (multipliers[unit] || 1);
    }

    const expiresAt = new Date(Date.now() + expiresInMs);

    await this.refreshTokenRepository.insert({
      userId,
      tokenHash,
      family: tokenFamily,
      expiresAt,
    });

    return rawToken;
  }

  private async revokeTokenFamily(userId: string, family: string): Promise<void> {
    await this.refreshTokenRepository.update(
      { userId, family, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
  }
}
