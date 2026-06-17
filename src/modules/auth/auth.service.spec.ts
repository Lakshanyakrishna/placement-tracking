import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { IamService } from '../iam/iam.service';
import { MailService } from '../mail/mail.service';
import { AppConfigService } from '../../config/config.service';
import { RefreshToken } from './entities/refresh-token.entity';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { Enrollment } from '../enrollments/entities/enrollment.entity';
import { User } from '../users/entities/user.entity';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt', () => ({
  compare: jest.fn().mockImplementation(async (pass: string, _hash: string) => {
    return pass === 'correct-password';
  }),
  hash: jest.fn().mockImplementation(async (pass: string, _rounds: number) => {
    return `hashed-${pass}`;
  }),
}));

const mockUser: User = {
  id: 'user-1',
  email: 'test@example.com',
  passwordHash: '',
  name: 'Test User',
  contactPhone: '+91-9876543210',
  isActive: true,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
};

const mockRoles = [{ role: 'admin', scopeType: 'global', scopeId: null }];

function createMockRepository() {
  return {
    findOne: jest.fn(),
    find: jest.fn(),
    insert: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };
}

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let iamService: jest.Mocked<IamService>;
  let mailService: jest.Mocked<MailService>;
  let refreshTokenRepo: ReturnType<typeof createMockRepository>;
  let passwordResetTokenRepo: ReturnType<typeof createMockRepository>;
  let enrollmentRepo: ReturnType<typeof createMockRepository>;

  beforeEach(async () => {
    refreshTokenRepo = createMockRepository();
    passwordResetTokenRepo = createMockRepository();
    enrollmentRepo = createMockRepository();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
            findById: jest.fn(),
            updatePasswordHash: jest.fn(),
          },
        },
        {
          provide: IamService,
          useValue: {
            findActiveRolesByUser: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock-access-token'),
          },
        },
        {
          provide: AppConfigService,
          useValue: {
            jwt: {
              secret: 'test-secret',
              accessExpiry: '15m',
              refreshExpiry: '7d',
              issuer: 'placement-tracker',
            },
            auth: {
              bcryptRounds: 10,
              maxLoginAttempts: 10,
              loginRateLimitMs: 1000,
              passwordResetExpiryMs: 3600000,
            },
            app: {
              baseUrl: 'http://localhost:3000',
            },
          },
        },
        {
          provide: MailService,
          useValue: {
            send: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(RefreshToken),
          useValue: refreshTokenRepo,
        },
        {
          provide: getRepositoryToken(PasswordResetToken),
          useValue: passwordResetTokenRepo,
        },
        {
          provide: getRepositoryToken(Enrollment),
          useValue: enrollmentRepo,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService) as jest.Mocked<UsersService>;
    iamService = module.get(IamService) as jest.Mocked<IamService>;
    mailService = module.get(MailService) as jest.Mocked<MailService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should return tokens and user data on valid credentials', async () => {
      const passwordHash = await bcrypt.hash('correct-password', 10);
      const user = { ...mockUser, passwordHash };
      usersService.findByEmail.mockResolvedValue(user);
      iamService.findActiveRolesByUser.mockResolvedValue(mockRoles as any);
      enrollmentRepo.findOne.mockResolvedValue(null);

      const result = await service.login('test@example.com', 'correct-password');

      expect(result.accessToken).toBe('mock-access-token');
      expect(result.refreshToken).toBeTruthy();
      expect(result.user.email).toBe('test@example.com');
      expect(result.user.roles).toEqual(mockRoles);
      expect(usersService.findByEmail).toHaveBeenCalledWith('test@example.com');
    });

    it('should throw UnauthorizedException for invalid email', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(service.login('unknown@example.com', 'password')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for deactivated account', async () => {
      const user = { ...mockUser, isActive: false, passwordHash: 'hash' };
      usersService.findByEmail.mockResolvedValue(user);

      await expect(service.login('test@example.com', 'password')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      const user = { ...mockUser, passwordHash: 'hash' };
      usersService.findByEmail.mockResolvedValue(user);

      await expect(service.login('test@example.com', 'wrong-password')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('refresh', () => {
    it('should rotate tokens on valid refresh', async () => {
      const user = { ...mockUser };
      const storedToken = {
        userId: user.id,
        tokenHash: 'hash',
        family: 'family-1',
        expiresAt: new Date(Date.now() + 86400000),
        revokedAt: null,
        user,
      };
      refreshTokenRepo.findOne.mockResolvedValue(storedToken);
      iamService.findActiveRolesByUser.mockResolvedValue(mockRoles as any);
      enrollmentRepo.findOne.mockResolvedValue(null);

      const result = await service.refresh('valid-raw-token');

      expect(result.accessToken).toBe('mock-access-token');
      expect(result.refreshToken).toBeTruthy();
      expect(refreshTokenRepo.save).toHaveBeenCalledTimes(1);
      expect(refreshTokenRepo.insert).toHaveBeenCalledTimes(1);
    });

    it('should throw UnauthorizedException for invalid token', async () => {
      refreshTokenRepo.findOne.mockResolvedValue(null);

      await expect(service.refresh('bad-token')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for revoked token', async () => {
      const storedToken = {
        userId: 'user-1',
        tokenHash: 'hash',
        family: 'family-1',
        expiresAt: new Date(Date.now() + 86400000),
        revokedAt: new Date(),
        user: mockUser,
      };
      refreshTokenRepo.findOne.mockResolvedValue(storedToken);

      await expect(service.refresh('revoked-token')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for expired token', async () => {
      const storedToken = {
        userId: 'user-1',
        tokenHash: 'hash',
        family: 'family-1',
        expiresAt: new Date(Date.now() - 86400000),
        revokedAt: null,
        user: mockUser,
      };
      refreshTokenRepo.findOne.mockResolvedValue(storedToken);

      await expect(service.refresh('expired-token')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should revoke the refresh token', async () => {
      const storedToken = {
        userId: 'user-1',
        tokenHash: 'hash',
        family: 'family-1',
        expiresAt: new Date(Date.now() + 86400000),
        revokedAt: null,
      };
      refreshTokenRepo.findOne.mockResolvedValue(storedToken);

      await service.logout('valid-token');

      expect(refreshTokenRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ revokedAt: expect.any(Date) }),
      );
    });

    it('should not throw if token not found', async () => {
      refreshTokenRepo.findOne.mockResolvedValue(null);

      await expect(service.logout('unknown-token')).resolves.not.toThrow();
    });
  });

  describe('forgotPassword', () => {
    it('should send reset email for existing user', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      passwordResetTokenRepo.insert.mockResolvedValue({} as any);

      await service.forgotPassword('test@example.com');

      expect(mailService.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@example.com',
          subject: 'Password Reset Request',
        }),
      );
    });

    it('should not send email for unknown user', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await service.forgotPassword('unknown@example.com');

      expect(mailService.send).not.toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    it('should reset password with valid token', async () => {
      const storedToken = {
        userId: 'user-1',
        tokenHash: 'hash',
        expiresAt: new Date(Date.now() + 3600000),
        usedAt: null,
        user: mockUser,
      };
      passwordResetTokenRepo.findOne.mockResolvedValue(storedToken);

      await service.resetPassword('valid-token', 'NewPass123!');

      expect(usersService.updatePasswordHash).toHaveBeenCalledWith(
        'user-1',
        expect.stringContaining('hashed-'),
      );
      expect(passwordResetTokenRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ usedAt: expect.any(Date) }),
      );
    });

    it('should throw for invalid token', async () => {
      passwordResetTokenRepo.findOne.mockResolvedValue(null);

      await expect(service.resetPassword('bad-token', 'NewPass123!')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw for already used token', async () => {
      const storedToken = {
        userId: 'user-1',
        tokenHash: 'hash',
        expiresAt: new Date(Date.now() + 3600000),
        usedAt: new Date(),
        user: mockUser,
      };
      passwordResetTokenRepo.findOne.mockResolvedValue(storedToken);

      await expect(service.resetPassword('used-token', 'NewPass123!')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw for expired token', async () => {
      const storedToken = {
        userId: 'user-1',
        tokenHash: 'hash',
        expiresAt: new Date(Date.now() - 3600000),
        usedAt: null,
        user: mockUser,
      };
      passwordResetTokenRepo.findOne.mockResolvedValue(storedToken);

      await expect(service.resetPassword('expired-token', 'NewPass123!')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
