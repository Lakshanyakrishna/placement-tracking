import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { OpportunitiesController } from './opportunities.controller';
import { OpportunitiesService } from './opportunities.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OpportunityState, OpportunityType } from './entities/opportunity.entity';
import { TargetType } from './entities/opportunity-target.entity';
import { OpportunityResponseDto } from './dto/opportunity-response.dto';
import { TargetResponseDto } from './dto/target-response.dto';

const UUID = '550e8400-e29b-41d4-a716-446655440000';
const BRANCH_UUID = '550e8400-e29b-41d4-a716-446655440001';

const mockOpportunity: OpportunityResponseDto = {
  id: UUID,
  academicPeriodId: UUID,
  title: 'Summer Internship',
  description: 'A great opportunity',
  opportunityType: OpportunityType.INTERNSHIP,
  state: OpportunityState.DRAFT,
  createdBy: UUID,
  opensAt: null,
  closesAt: null,
  verificationDeadline: '7 days',
  requireProof: true,
  maxSubmissions: null,
  allowGroupSubmission: false,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
};

const mockTarget: TargetResponseDto = {
  id: UUID,
  opportunityId: UUID,
  targetType: TargetType.BRANCH,
  branchId: BRANCH_UUID,
  sectionId: null,
  groupId: null,
  batchId: null,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
};

function createMockService() {
  return {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    publish: jest.fn(),
    archive: jest.fn(),
    setTargets: jest.fn(),
    getTargets: jest.fn(),
  };
}

describe('Opportunities Controller (Integration)', () => {
  let app: INestApplication;
  let service: jest.Mocked<OpportunitiesService>;

  const mockGuard = { canActivate: jest.fn().mockReturnValue(true) };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [OpportunitiesController],
      providers: [
        { provide: OpportunitiesService, useValue: createMockService() },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();

    service = app.get(OpportunitiesService) as jest.Mocked<OpportunitiesService>;
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/opportunities', () => {
    it('should create an opportunity', async () => {
      service.create.mockResolvedValue(mockOpportunity);

      const response = await request(app.getHttpServer())
        .post('/api/v1/opportunities')
        .send({
          title: 'Summer Internship',
          opportunityType: OpportunityType.INTERNSHIP,
          academicPeriodId: UUID,
        })
        .expect(201);

      expect(response.body.title).toBe('Summer Internship');
      expect(response.body.state).toBe(OpportunityState.DRAFT);
      expect(service.create).toHaveBeenCalled();
    });
  });

  describe('GET /api/v1/opportunities', () => {
    it('should return paginated opportunities', async () => {
      service.findAll.mockResolvedValue({
        data: [mockOpportunity],
        meta: { page: 1, limit: 20, total: 1, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
      });

      const response = await request(app.getHttpServer())
        .get('/api/v1/opportunities')
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.meta.total).toBe(1);
    });

    it('should pass filter params to service', async () => {
      service.findAll.mockResolvedValue({
        data: [],
        meta: { page: 1, limit: 20, total: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false },
      });

      await request(app.getHttpServer())
        .get('/api/v1/opportunities')
        .query({ type: OpportunityType.INTERNSHIP, status: OpportunityState.DRAFT })
        .expect(200);

      expect(service.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ type: OpportunityType.INTERNSHIP, status: OpportunityState.DRAFT }),
      );
    });
  });

  describe('GET /api/v1/opportunities/:id', () => {
    it('should return an opportunity by id', async () => {
      service.findOne.mockResolvedValue(mockOpportunity);

      const response = await request(app.getHttpServer())
        .get(`/api/v1/opportunities/${UUID}`)
        .expect(200);

      expect(response.body.title).toBe('Summer Internship');
    });

    it('should return 404 when not found', async () => {
      service.findOne.mockRejectedValue(new (require('@nestjs/common').NotFoundException)());

      await request(app.getHttpServer())
        .get(`/api/v1/opportunities/${UUID}`)
        .expect(404);
    });
  });

  describe('PATCH /api/v1/opportunities/:id', () => {
    it('should update an opportunity', async () => {
      const updated = { ...mockOpportunity, title: 'Updated Title' };
      service.update.mockResolvedValue(updated);

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/opportunities/${UUID}`)
        .send({ title: 'Updated Title' })
        .expect(200);

      expect(response.body.title).toBe('Updated Title');
    });

    it('should return 404 when not found', async () => {
      service.update.mockRejectedValue(new (require('@nestjs/common').NotFoundException)());

      await request(app.getHttpServer())
        .patch(`/api/v1/opportunities/${UUID}`)
        .send({ title: 'Updated Title' })
        .expect(404);
    });
  });

  describe('DELETE /api/v1/opportunities/:id', () => {
    it('should delete a draft opportunity and return 204', async () => {
      service.remove.mockResolvedValue(undefined);

      await request(app.getHttpServer())
        .delete(`/api/v1/opportunities/${UUID}`)
        .expect(204);
    });

    it('should return 404 when not found', async () => {
      service.remove.mockRejectedValue(new (require('@nestjs/common').NotFoundException)());

      await request(app.getHttpServer())
        .delete(`/api/v1/opportunities/${UUID}`)
        .expect(404);
    });
  });

  describe('POST /api/v1/opportunities/:id/publish', () => {
    it('should publish a draft opportunity', async () => {
      const published = { ...mockOpportunity, state: OpportunityState.PUBLISHED };
      service.publish.mockResolvedValue(published);

      const response = await request(app.getHttpServer())
        .post(`/api/v1/opportunities/${UUID}/publish`)
        .expect(200);

      expect(response.body.state).toBe(OpportunityState.PUBLISHED);
    });

    it('should return 400 when not draft', async () => {
      service.publish.mockRejectedValue(new (require('@nestjs/common').BadRequestException)());

      await request(app.getHttpServer())
        .post(`/api/v1/opportunities/${UUID}/publish`)
        .expect(400);
    });
  });

  describe('POST /api/v1/opportunities/:id/archive', () => {
    it('should archive a published opportunity', async () => {
      const archived = { ...mockOpportunity, state: OpportunityState.ARCHIVED };
      service.archive.mockResolvedValue(archived);

      const response = await request(app.getHttpServer())
        .post(`/api/v1/opportunities/${UUID}/archive`)
        .expect(200);

      expect(response.body.state).toBe(OpportunityState.ARCHIVED);
    });

    it('should return 400 when draft', async () => {
      service.archive.mockRejectedValue(new (require('@nestjs/common').BadRequestException)());

      await request(app.getHttpServer())
        .post(`/api/v1/opportunities/${UUID}/archive`)
        .expect(400);
    });
  });

  describe('POST /api/v1/opportunities/:id/targets', () => {
    it('should set targets for an opportunity', async () => {
      service.setTargets.mockResolvedValue([mockTarget]);

      const response = await request(app.getHttpServer())
        .post(`/api/v1/opportunities/${UUID}/targets`)
        .send({ targets: [{ targetType: TargetType.BRANCH, branchId: BRANCH_UUID }] })
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].targetType).toBe(TargetType.BRANCH);
    });
  });

  describe('GET /api/v1/opportunities/:id/targets', () => {
    it('should return targets for an opportunity', async () => {
      service.getTargets.mockResolvedValue([mockTarget]);

      const response = await request(app.getHttpServer())
        .get(`/api/v1/opportunities/${UUID}/targets`)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].targetType).toBe(TargetType.BRANCH);
    });
  });
});
