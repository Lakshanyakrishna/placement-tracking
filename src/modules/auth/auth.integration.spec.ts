import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, BadRequestException } from '@nestjs/common';
import request from 'supertest';
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
const cookieParser = require('cookie-parser');
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuthModule } from './auth.module';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { IamModule } from '../iam/iam.module';
import { MailModule } from '../mail/mail.module';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';
import { RefreshToken } from './entities/refresh-token.entity';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { Enrollment } from '../enrollments/entities/enrollment.entity';
import { User } from '../users/entities/user.entity';
import { RoleAssignment } from '../iam/entities/role-assignment.entity';
import { Section } from '../sections/entities/section.entity';
import { Group } from '../groups/entities/group.entity';

function createMockRepository() {
  return {
    findOne: jest.fn(),
    find: jest.fn(),
    insert: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    findOneOrFail: jest.fn(),
    findAndCount: jest.fn(),
    count: jest.fn(),
    delete: jest.fn(),
  };
}

describe('AuthModule (integration)', () => {
  let app: INestApplication;
  let authService: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let refreshTokenRepo: ReturnType<typeof createMockRepository>;

  beforeAll(async () => {
    refreshTokenRepo = createMockRepository();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AuthModule, UsersModule, IamModule, MailModule],
    })
      .overrideProvider(getRepositoryToken(RefreshToken))
      .useValue(refreshTokenRepo)
      .overrideProvider(getRepositoryToken(PasswordResetToken))
      .useValue(createMockRepository())
      .overrideProvider(getRepositoryToken(Enrollment))
      .useValue(createMockRepository())
      .overrideProvider(getRepositoryToken(User))
      .useValue(createMockRepository())
      .overrideProvider(getRepositoryToken(RoleAssignment))
      .useValue(createMockRepository())
      .overrideProvider(getRepositoryToken(Section))
      .useValue(createMockRepository())
      .overrideProvider(getRepositoryToken(Group))
      .useValue(createMockRepository())
      .overrideProvider(MailService)
      .useValue({ send: jest.fn() })
      .compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );
    await app.init();

    authService = app.get(AuthService);
    usersService = app.get(UsersService) as jest.Mocked<UsersService>;
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('POST /api/v1/auth/login', () => {
    it('should return 401 for invalid credentials', () => {
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(null);

      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'nonexistent@test.com', password: 'password' })
        .expect(401);
    });

    it('should validate request body', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'not-an-email', password: '12' })
        .expect(400);
    });

    it('should return 200 and set cookie on success', async () => {
      const mockUser: User = {
        id: 'user-int-1',
        email: 'admin@test.com',
        passwordHash: '',
        name: 'Admin User',
        contactPhone: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(mockUser);

      jest.spyOn(authService, 'login').mockResolvedValue({
        accessToken: 'integration-test-token',
        refreshToken: 'integration-refresh-token',
        user: {
          id: 'user-int-1',
          email: 'admin@test.com',
          name: 'Admin User',
          isActive: true,
          roles: [{ role: 'admin', scopeType: 'global', scopeId: null }],
          enrollment: null,
        },
      });

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'admin@test.com', password: 'seed@123' })
        .expect(200);

      expect(res.body.accessToken).toBe('integration-test-token');
      expect(res.body.user.email).toBe('admin@test.com');
      expect(res.headers['set-cookie']).toBeDefined();
      expect(res.headers['set-cookie'][0]).toContain('refresh_token');
      expect(res.headers['set-cookie'][0]).toContain('HttpOnly');
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('should return 401 without refresh cookie', () => {
      return request(app.getHttpServer()).post('/api/v1/auth/refresh').expect(401);
    });

    it('should return 200 with valid refresh cookie', async () => {
      jest.spyOn(authService, 'refresh').mockResolvedValue({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      });

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .set('Cookie', ['refresh_token=valid-token'])
        .expect(200);

      expect(res.body.accessToken).toBe('new-access-token');
      expect(res.headers['set-cookie']).toBeDefined();
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should return 200 and clear cookie', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Cookie', ['refresh_token=some-token'])
        .expect(200);

      expect(res.body.message).toBe('Logged out successfully');
      expect(res.headers['set-cookie'][0]).toContain('refresh_token=');
    });
  });

  describe('POST /api/v1/auth/forgot-password', () => {
    it('should return 200 with success message', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'user@test.com' })
        .expect(200)
        .expect((res: request.Response) => {
          expect(res.body.message).toContain('reset link');
        });
    });

    it('should validate email format', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'not-an-email' })
        .expect(400);
    });
  });

  describe('POST /api/v1/auth/reset-password', () => {
    it('should return 400 with invalid token', async () => {
      jest
        .spyOn(authService, 'resetPassword')
        .mockRejectedValue(new BadRequestException('Invalid or expired reset token'));

      return request(app.getHttpServer())
        .post('/api/v1/auth/reset-password')
        .send({ token: 'bad-token', password: 'NewPass123!' })
        .expect(400);
    });

    it('should validate password length', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/reset-password')
        .send({ token: 'some-token', password: '123' })
        .expect(400);
    });
  });
});
