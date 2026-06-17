import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DashboardController } from '../dashboard.controller';
import { DashboardService } from '../dashboard.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';

const UUID = '550e8400-e29b-41d4-a716-446655440000';

function createMockService() {
  return {
    getAdminDashboard: jest.fn(),
    getMentorDashboard: jest.fn(),
    getTeamLeaderDashboard: jest.fn(),
    getStudentDashboard: jest.fn(),
  };
}

describe('Dashboard Controller (Integration)', () => {
  let app: INestApplication;
  let service: jest.Mocked<DashboardService>;
  const mockGuard = { canActivate: jest.fn().mockReturnValue(true) };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [{ provide: DashboardService, useValue: createMockService() }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
    service = app.get(DashboardService) as jest.Mocked<DashboardService>;
  });

  afterAll(async () => { await app.close(); });
  afterEach(() => { jest.clearAllMocks(); });

  describe('GET /api/v1/dashboard/admin', () => {
    it('should return admin dashboard data', async () => {
      service.getAdminDashboard.mockResolvedValue({
        totalStudents: 500,
        totalOpportunities: 25,
        activeOpportunities: 12,
        participations: 1200,
        submitted: 300,
        verified: 200,
        rejected: 50,
        completionRate: 36.36,
      });
      const res = await request(app.getHttpServer()).get('/api/v1/dashboard/admin').expect(200);
      expect(res.body.totalStudents).toBe(500);
      expect(res.body.totalOpportunities).toBe(25);
      expect(res.body.completionRate).toBe(36.36);
    });
  });

  describe('GET /api/v1/dashboard/mentor', () => {
    it('should return mentor dashboard data', async () => {
      service.getMentorDashboard.mockResolvedValue({
        assignedSections: 3,
        totalStudents: 90,
        opportunitiesActive: 6,
        submitted: 45,
        verified: 30,
        rejected: 8,
        completionRate: 36.14,
      });
      const res = await request(app.getHttpServer()).get('/api/v1/dashboard/mentor').expect(200);
      expect(res.body.assignedSections).toBe(3);
      expect(res.body.totalStudents).toBe(90);
      expect(res.body.completionRate).toBe(36.14);
    });

    it('should pass userId from JWT', async () => {
      mockGuard.canActivate.mockImplementationOnce((ctx) => {
        ctx.switchToHttp().getRequest().user = { id: UUID };
        return true;
      });
      service.getMentorDashboard.mockResolvedValue({
        assignedSections: 1, totalStudents: 10, opportunitiesActive: 2,
        submitted: 5, verified: 3, rejected: 1, completionRate: 33.33,
      });
      await request(app.getHttpServer()).get('/api/v1/dashboard/mentor').expect(200);
      expect(service.getMentorDashboard).toHaveBeenCalledWith(UUID);
    });
  });

  describe('GET /api/v1/dashboard/team-leader', () => {
    it('should return team leader dashboard data', async () => {
      service.getTeamLeaderDashboard.mockResolvedValue({
        assignedGroups: 2,
        students: 20,
        pendingVerifications: 5,
        verified: 10,
        rejected: 3,
      });
      const res = await request(app.getHttpServer()).get('/api/v1/dashboard/team-leader').expect(200);
      expect(res.body.assignedGroups).toBe(2);
      expect(res.body.students).toBe(20);
      expect(res.body.pendingVerifications).toBe(5);
    });
  });

  describe('GET /api/v1/dashboard/student', () => {
    it('should return student dashboard data', async () => {
      service.getStudentDashboard.mockResolvedValue({
        assignedOpportunities: 8,
        inProgress: 3,
        submitted: 2,
        verified: 2,
        completed: 1,
      });
      const res = await request(app.getHttpServer()).get('/api/v1/dashboard/student').expect(200);
      expect(res.body.assignedOpportunities).toBe(8);
      expect(res.body.inProgress).toBe(3);
      expect(res.body.completed).toBe(1);
    });
  });

  describe('authentication', () => {
    it('should reject unauthenticated requests', async () => {
      mockGuard.canActivate.mockReturnValue(false);
      await request(app.getHttpServer()).get('/api/v1/dashboard/admin').expect(403);
    });
  });
});
