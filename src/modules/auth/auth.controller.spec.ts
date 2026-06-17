import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  const mockRequest = (cookie?: string) =>
    ({
      cookies: cookie ? { refresh_token: cookie } : {},
    }) as any;

  const mockResponse = () => {
    const res: any = {};
    res.cookie = jest.fn().mockReturnValue(res);
    res.clearCookie = jest.fn().mockReturnValue(res);
    return res;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            login: jest.fn(),
            refresh: jest.fn(),
            logout: jest.fn(),
            forgotPassword: jest.fn(),
            resetPassword: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService) as jest.Mocked<AuthService>;
  });

  describe('POST /auth/login', () => {
    it('should return access token and set refresh cookie', async () => {
      authService.login.mockResolvedValue({
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-456',
        user: {
          id: 'user-1',
          email: 'test@example.com',
          name: 'Test User',
          isActive: true,
          roles: [{ role: 'admin', scopeType: 'global', scopeId: null }],
          enrollment: null,
        },
      });

      const res = mockResponse();
      const result = await controller.login(
        { email: 'test@example.com', password: 'password' },
        res,
      );

      expect(result.accessToken).toBe('access-token-123');
      expect(result.user.email).toBe('test@example.com');
      expect(res.cookie).toHaveBeenCalledWith(
        'refresh_token',
        'refresh-token-456',
        expect.objectContaining({ httpOnly: true }),
      );
    });
  });

  describe('POST /auth/refresh', () => {
    it('should return new access token and rotate refresh cookie', async () => {
      authService.refresh.mockResolvedValue({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      });

      const req = mockRequest('old-refresh-token');
      const res = mockResponse();
      const result = await controller.refresh(req, res);

      expect(result.accessToken).toBe('new-access-token');
      expect(res.cookie).toHaveBeenCalledWith(
        'refresh_token',
        'new-refresh-token',
        expect.any(Object),
      );
    });

    it('should throw when no refresh cookie', async () => {
      const req = mockRequest();
      const res = mockResponse();

      await expect(controller.refresh(req, res)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('POST /auth/logout', () => {
    it('should clear cookie and revoke token', async () => {
      const req = mockRequest('some-token');
      const res = mockResponse();

      const result = await controller.logout(req, res);

      expect(authService.logout).toHaveBeenCalledWith('some-token');
      expect(res.clearCookie).toHaveBeenCalledWith('refresh_token', expect.any(Object));
      expect(result.message).toBe('Logged out successfully');
    });

    it('should clear cookie even without token', async () => {
      const req = mockRequest();
      const res = mockResponse();

      const result = await controller.logout(req, res);

      expect(authService.logout).not.toHaveBeenCalled();
      expect(res.clearCookie).toHaveBeenCalled();
      expect(result.message).toBe('Logged out successfully');
    });
  });

  describe('POST /auth/forgot-password', () => {
    it('should return success message', async () => {
      const result = await controller.forgotPassword({
        email: 'test@example.com',
      });

      expect(authService.forgotPassword).toHaveBeenCalledWith('test@example.com');
      expect(result.message).toContain('reset link');
    });
  });

  describe('POST /auth/reset-password', () => {
    it('should return success message', async () => {
      const result = await controller.resetPassword({
        token: 'reset-token',
        password: 'NewPass123!',
      });

      expect(authService.resetPassword).toHaveBeenCalledWith('reset-token', 'NewPass123!');
      expect(result.message).toBe('Password has been reset successfully.');
    });
  });
});
