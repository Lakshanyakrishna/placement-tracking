import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { ParticipationsController } from './participations.controller';
import { ParticipationsService } from './participations.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ParticipationStatus } from './entities/participation.entity';

const UUID = '550e8400-e29b-41d4-a716-446655440000';

const mockParticipation = {
  id: UUID,
  opportunityId: UUID,
  enrollmentId: UUID,
  status: ParticipationStatus.NOT_STARTED,
  teamLeaderUserId: null,
  startedAt: null,
  submittedAt: null,
  verifiedAt: null,
  verifiedBy: null,
  notes: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

function createMockService() {
  return {
    create: jest.fn(),
    findMyParticipations: jest.fn(),
    findOne: jest.fn(),
    updateStatus: jest.fn(),
    findByOpportunity: jest.fn(),
    findByGroup: jest.fn(),
    findBySection: jest.fn(),
    findByMentor: jest.fn(),
  };
}

describe('Participations Controller (Integration)', () => {
  let app: INestApplication;
  let service: jest.Mocked<ParticipationsService>;
  const mockGuard = { canActivate: jest.fn().mockReturnValue(true) };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ParticipationsController],
      providers: [{ provide: ParticipationsService, useValue: createMockService() }],
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
    service = app.get(ParticipationsService) as jest.Mocked<ParticipationsService>;
  });

  afterAll(async () => { await app.close(); });
  afterEach(() => { jest.clearAllMocks(); });

  describe('POST /api/v1/participations', () => {
    it('should create a participation', async () => {
      service.create.mockResolvedValue(mockParticipation as never);
      const res = await request(app.getHttpServer())
        .post('/api/v1/participations')
        .send({ opportunityId: UUID })
        .expect(201);
      expect(res.body.status).toBe(ParticipationStatus.NOT_STARTED);
    });

    it('should validate request body', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/participations')
        .send({ opportunityId: 'bad' })
        .expect(400);
    });
  });

  describe('GET /api/v1/participations/me', () => {
    it('should return my participations', async () => {
      service.findMyParticipations.mockResolvedValue({
        data: [mockParticipation as never],
        meta: { page: 1, limit: 20, total: 1, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
      });
      const res = await request(app.getHttpServer()).get('/api/v1/participations/me').expect(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.meta.total).toBe(1);
    });
  });

  describe('GET /api/v1/participations/:id', () => {
    it('should return a participation', async () => {
      service.findOne.mockResolvedValue(mockParticipation as never);
      const res = await request(app.getHttpServer()).get(`/api/v1/participations/${UUID}`).expect(200);
      expect(res.body.status).toBe(ParticipationStatus.NOT_STARTED);
    });

    it('should return 404', async () => {
      service.findOne.mockRejectedValue(new (require('@nestjs/common').NotFoundException)());
      await request(app.getHttpServer()).get(`/api/v1/participations/${UUID}`).expect(404);
    });
  });

  describe('PATCH /api/v1/participations/:id/status', () => {
    it('should update status', async () => {
      const updated = { ...mockParticipation, status: ParticipationStatus.IN_PROGRESS, startedAt: new Date().toISOString() };
      service.updateStatus.mockResolvedValue(updated as never);
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/participations/${UUID}/status`)
        .send({ status: ParticipationStatus.IN_PROGRESS })
        .expect(200);
      expect(res.body.status).toBe(ParticipationStatus.IN_PROGRESS);
    });

    it('should return 400 for invalid transition', async () => {
      service.updateStatus.mockRejectedValue(new (require('@nestjs/common').BadRequestException)());
      await request(app.getHttpServer())
        .patch(`/api/v1/participations/${UUID}/status`)
        .send({ status: ParticipationStatus.VERIFIED })
        .expect(400);
    });
  });

  describe('GET /api/v1/participations/opportunity/:opportunityId', () => {
    it('should return participations by opportunity', async () => {
      service.findByOpportunity.mockResolvedValue({
        data: [mockParticipation as never],
        meta: { page: 1, limit: 20, total: 1, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
      });
      const res = await request(app.getHttpServer())
        .get(`/api/v1/participations/opportunity/${UUID}`)
        .expect(200);
      expect(res.body.data).toHaveLength(1);
    });
  });

  describe('GET /api/v1/participations/group/:groupId', () => {
    it('should return participations by group', async () => {
      service.findByGroup.mockResolvedValue({
        data: [mockParticipation as never],
        meta: { page: 1, limit: 20, total: 1, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
      });
      const res = await request(app.getHttpServer())
        .get(`/api/v1/participations/group/${UUID}`)
        .expect(200);
      expect(res.body.data).toHaveLength(1);
    });
  });

  describe('GET /api/v1/participations/section/:sectionId', () => {
    it('should return participations by section', async () => {
      service.findBySection.mockResolvedValue({
        data: [mockParticipation as never],
        meta: { page: 1, limit: 20, total: 1, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
      });
      const res = await request(app.getHttpServer())
        .get(`/api/v1/participations/section/${UUID}`)
        .expect(200);
      expect(res.body.data).toHaveLength(1);
    });
  });

  describe('GET /api/v1/participations/mentor/:mentorId', () => {
    it('should return participations by mentor', async () => {
      service.findByMentor.mockResolvedValue({
        data: [mockParticipation as never],
        meta: { page: 1, limit: 20, total: 1, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
      });
      const res = await request(app.getHttpServer())
        .get(`/api/v1/participations/mentor/${UUID}`)
        .expect(200);
      expect(res.body.data).toHaveLength(1);
    });
  });
});
