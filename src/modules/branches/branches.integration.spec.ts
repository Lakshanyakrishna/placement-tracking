import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { BranchesController } from './branches.controller';
import { BranchesService } from './branches.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { BranchResponseDto } from './dto/branch-response.dto';

const mockBranch: BranchResponseDto = {
  id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  code: 'CSE',
  name: 'Computer Science & Engineering',
  createdAt: new Date('2025-01-01T00:00:00.000Z'),
  updatedAt: new Date('2025-01-01T00:00:00.000Z'),
};

function createMockService() {
  return {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };
}

describe('Branches Controller (Integration)', () => {
  let app: INestApplication;
  let branchesService: jest.Mocked<BranchesService>;

  const mockGuard = { canActivate: jest.fn().mockReturnValue(true) };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [BranchesController],
      providers: [
        { provide: BranchesService, useValue: createMockService() },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();

    branchesService = app.get(BranchesService) as jest.Mocked<BranchesService>;
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/branches', () => {
    it('should return paginated branches', async () => {
      branchesService.findAll.mockResolvedValue({
        data: [mockBranch],
        meta: { page: 1, limit: 20, total: 1, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
      });

      const response = await request(app.getHttpServer())
        .get('/api/v1/branches')
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].code).toBe('CSE');
      expect(response.body.meta.total).toBe(1);
    });

    it('should pass query params to service', async () => {
      branchesService.findAll.mockResolvedValue({
        data: [],
        meta: { page: 1, limit: 10, total: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false },
      });

      await request(app.getHttpServer())
        .get('/api/v1/branches')
        .query({ page: '1', limit: '10', search: 'CSE' })
        .expect(200);

      expect(branchesService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, limit: 10, search: 'CSE' }),
      );
    });
  });

  describe('GET /api/v1/branches/:id', () => {
    it('should return a branch by id', async () => {
      branchesService.findOne.mockResolvedValue(mockBranch);

      const response = await request(app.getHttpServer())
        .get(`/api/v1/branches/${mockBranch.id}`)
        .expect(200);

      expect(response.body.code).toBe('CSE');
    });

    it('should return 404 when branch not found', async () => {
      branchesService.findOne.mockResolvedValue(null);

      await request(app.getHttpServer())
        .get(`/api/v1/branches/${mockBranch.id}`)
        .expect(404);
    });
  });

  describe('POST /api/v1/branches', () => {
    it('should create a branch', async () => {
      branchesService.create.mockResolvedValue(mockBranch);

      const response = await request(app.getHttpServer())
        .post('/api/v1/branches')
        .send({ code: 'CSE', name: 'Computer Science & Engineering' })
        .expect(201);

      expect(response.body.code).toBe('CSE');
    });
  });

  describe('PATCH /api/v1/branches/:id', () => {
    it('should update a branch', async () => {
      const updated = { ...mockBranch, name: 'Updated Name' };
      branchesService.update.mockResolvedValue(updated);

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/branches/${mockBranch.id}`)
        .send({ name: 'Updated Name' })
        .expect(200);

      expect(response.body.name).toBe('Updated Name');
    });

    it('should return 404 when branch not found', async () => {
      branchesService.update.mockRejectedValue(new (require('@nestjs/common').NotFoundException)());

      await request(app.getHttpServer())
        .patch(`/api/v1/branches/${mockBranch.id}`)
        .send({ name: 'Updated Name' })
        .expect(404);
    });
  });

  describe('DELETE /api/v1/branches/:id', () => {
    it('should delete a branch and return 204', async () => {
      branchesService.remove.mockResolvedValue(undefined);

      await request(app.getHttpServer())
        .delete(`/api/v1/branches/${mockBranch.id}`)
        .expect(204);
    });

    it('should return 404 when branch not found', async () => {
      branchesService.remove.mockRejectedValue(new (require('@nestjs/common').NotFoundException)());

      await request(app.getHttpServer())
        .delete(`/api/v1/branches/${mockBranch.id}`)
        .expect(404);
    });
  });
});
