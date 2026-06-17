import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { VerificationController } from './verification.controller';
import { VerificationService } from './verification.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { VerificationAction } from './entities/verification-log.entity';

const UUID = '550e8400-e29b-41d4-a716-446655440000';

const mockLog = {
  id: UUID,
  submissionId: UUID,
  action: VerificationAction.VERIFIED,
  actorUserId: UUID,
  reason: null,
  createdAt: new Date().toISOString(),
};

function createMockService() {
  return {
    findPending: jest.fn(),
    findByGroup: jest.fn(),
    findBySection: jest.fn(),
    findBySubmission: jest.fn(),
    approve: jest.fn(),
    reject: jest.fn(),
  };
}

describe('Verification Controller (Integration)', () => {
  let app: INestApplication;
  let service: jest.Mocked<VerificationService>;
  const mockGuard = { canActivate: jest.fn().mockReturnValue(true) };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [VerificationController],
      providers: [{ provide: VerificationService, useValue: createMockService() }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();
    service = app.get(VerificationService) as jest.Mocked<VerificationService>;
  });

  afterAll(async () => { await app.close(); });
  afterEach(() => { jest.clearAllMocks(); });

  describe('GET /api/v1/verifications/pending', () => {
    it('should return pending submissions', async () => {
      service.findPending.mockResolvedValue([{
        submissionId: UUID, participationId: UUID, opportunityTitle: 'Intern', opportunityId: UUID,
        studentName: 'S', studentEmail: 's@t.com', submittedAt: new Date(), description: null, fileCount: 1,
      }]);
      const res = await request(app.getHttpServer()).get('/api/v1/verifications/pending').expect(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].opportunityTitle).toBe('Intern');
    });
  });

  describe('GET /api/v1/verifications/group/:groupId', () => {
    it('should return logs by group', async () => {
      service.findByGroup.mockResolvedValue({
        data: [mockLog as never],
        meta: { page: 1, limit: 20, total: 1, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
      });
      const res = await request(app.getHttpServer()).get(`/api/v1/verifications/group/${UUID}`).expect(200);
      expect(res.body.data).toHaveLength(1);
    });
  });

  describe('GET /api/v1/verifications/section/:sectionId', () => {
    it('should return logs by section', async () => {
      service.findBySection.mockResolvedValue({
        data: [mockLog as never],
        meta: { page: 1, limit: 20, total: 1, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
      });
      const res = await request(app.getHttpServer()).get(`/api/v1/verifications/section/${UUID}`).expect(200);
      expect(res.body.data).toHaveLength(1);
    });
  });

  describe('GET /api/v1/verifications/submission/:submissionId', () => {
    it('should return logs by submission', async () => {
      service.findBySubmission.mockResolvedValue({ data: [mockLog as never] });
      const res = await request(app.getHttpServer()).get(`/api/v1/verifications/submission/${UUID}`).expect(200);
      expect(res.body.data).toHaveLength(1);
    });
  });

  describe('POST /api/v1/verifications/:submissionId/approve', () => {
    it('should approve a submission', async () => {
      service.approve.mockResolvedValue(mockLog as never);
      const res = await request(app.getHttpServer()).post(`/api/v1/verifications/${UUID}/approve`).expect(200);
      expect(res.body.action).toBe(VerificationAction.VERIFIED);
    });
  });

  describe('POST /api/v1/verifications/:submissionId/reject', () => {
    it('should reject a submission with reason', async () => {
      const rejected = { ...mockLog, action: VerificationAction.REJECTED, reason: 'Insufficient proof' };
      service.reject.mockResolvedValue(rejected as never);
      const res = await request(app.getHttpServer())
        .post(`/api/v1/verifications/${UUID}/reject`)
        .send({ reason: 'Insufficient proof' })
        .expect(200);
      expect(res.body.action).toBe(VerificationAction.REJECTED);
    });

    it('should validate rejection reason', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/verifications/${UUID}/reject`)
        .send({ reason: 'no' })
        .expect(400);
    });
  });
});
