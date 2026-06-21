import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { SubmissionsController } from './submissions.controller';
import { SubmissionsService } from './submissions.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

const UUID = '550e8400-e29b-41d4-a716-446655440000';

const mockSubmission = {
  id: UUID,
  participationId: UUID,
  submittedBy: UUID,
  description: null,
  externalLinks: null,
  submittedAt: new Date().toISOString(),
  isLate: false,
  rejectionReason: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  files: [],
};

function createMockService() {
  return {
    create: jest.fn(),
    findOne: jest.fn(),
    findMySubmissions: jest.fn(),
    findByGroup: jest.fn(),
    findBySection: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };
}

describe('Submissions Controller (Integration)', () => {
  let app: INestApplication;
  let service: jest.Mocked<SubmissionsService>;
  const mockGuard = { canActivate: jest.fn().mockReturnValue(true) };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [SubmissionsController],
      providers: [{ provide: SubmissionsService, useValue: createMockService() }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockGuard)
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();
    service = app.get(SubmissionsService) as jest.Mocked<SubmissionsService>;
  });

  afterAll(async () => { await app.close(); });
  afterEach(() => { jest.clearAllMocks(); });

  describe('GET /api/v1/submissions/:id', () => {
    it('should return a submission', async () => {
      service.findOne.mockResolvedValue(mockSubmission as never);
      const res = await request(app.getHttpServer()).get(`/api/v1/submissions/${UUID}`).expect(200);
      expect(res.body.id).toBe(UUID);
    });

    it('should return 404', async () => {
      service.findOne.mockRejectedValue(new (require('@nestjs/common').NotFoundException)());
      await request(app.getHttpServer()).get(`/api/v1/submissions/${UUID}`).expect(404);
    });
  });

  describe('GET /api/v1/submissions/me', () => {
    it('should return my submissions', async () => {
      service.findMySubmissions.mockResolvedValue({
        data: [mockSubmission as never],
        meta: { page: 1, limit: 20, total: 1, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
      });
      const res = await request(app.getHttpServer()).get('/api/v1/submissions/me').expect(200);
      expect(res.body.data).toHaveLength(1);
    });
  });

  describe('GET /api/v1/submissions/group/:groupId', () => {
    it('should return submissions by group', async () => {
      service.findByGroup.mockResolvedValue({
        data: [mockSubmission as never],
        meta: { page: 1, limit: 20, total: 1, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
      });
      const res = await request(app.getHttpServer()).get(`/api/v1/submissions/group/${UUID}`).expect(200);
      expect(res.body.data).toHaveLength(1);
    });
  });

  describe('GET /api/v1/submissions/section/:sectionId', () => {
    it('should return submissions by section', async () => {
      service.findBySection.mockResolvedValue({
        data: [mockSubmission as never],
        meta: { page: 1, limit: 20, total: 1, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
      });
      const res = await request(app.getHttpServer()).get(`/api/v1/submissions/section/${UUID}`).expect(200);
      expect(res.body.data).toHaveLength(1);
    });
  });

  describe('PATCH /api/v1/submissions/:id', () => {
    it('should update a submission', async () => {
      const updated = { ...mockSubmission, description: 'Updated' };
      service.update.mockResolvedValue(updated as never);
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/submissions/${UUID}`)
        .send({ description: 'Updated' })
        .expect(200);
      expect(res.body.description).toBe('Updated');
    });
  });

  describe('DELETE /api/v1/submissions/:id', () => {
    it('should delete a submission', async () => {
      service.remove.mockResolvedValue(undefined);
      await request(app.getHttpServer()).delete(`/api/v1/submissions/${UUID}`).expect(204);
    });
  });
});
