import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import { DashboardService } from '../dashboard.service';

const UUID = '550e8400-e29b-41d4-a716-446655440000';

function mockDataSource() {
  const query = jest.fn();
  return { query };
}

describe('DashboardService', () => {
  let service: DashboardService;
  let ds: ReturnType<typeof mockDataSource>;

  function createService(): DashboardService {
    return new DashboardService(ds as any);
  }

  describe('getAdminDashboard', () => {
    it('should return aggregated admin metrics', async () => {
      ds = mockDataSource();
      ds.query.mockResolvedValue([{
        totalStudents: '500',
        totalOpportunities: '25',
        activeOpportunities: '12',
        participations: '1200',
        submitted: '300',
        verified: '200',
        rejected: '50',
      }]);
      service = createService();

      const result = await service.getAdminDashboard();

      expect(result.totalStudents).toBe(500);
      expect(result.totalOpportunities).toBe(25);
      expect(result.activeOpportunities).toBe(12);
      expect(result.participations).toBe(1200);
      expect(result.submitted).toBe(300);
      expect(result.verified).toBe(200);
      expect(result.rejected).toBe(50);
      expect(result.completionRate).toBe(36.36);
    });

    it('should return zero completion rate when no participations submitted', async () => {
      ds = mockDataSource();
      ds.query.mockResolvedValue([{
        totalStudents: '0',
        totalOpportunities: '0',
        activeOpportunities: '0',
        participations: '0',
        submitted: '0',
        verified: '0',
        rejected: '0',
      }]);
      service = createService();

      const result = await service.getAdminDashboard();

      expect(result.completionRate).toBe(0);
    });
  });

  describe('getMentorDashboard', () => {
    it('should return mentor metrics for the given user', async () => {
      ds = mockDataSource();
      ds.query.mockResolvedValue([{
        assignedSections: '3',
        totalStudents: '90',
        opportunitiesActive: '6',
        submitted: '45',
        verified: '30',
        rejected: '8',
      }]);
      service = createService();

      const result = await service.getMentorDashboard(UUID);

      expect(result.assignedSections).toBe(3);
      expect(result.totalStudents).toBe(90);
      expect(result.opportunitiesActive).toBe(6);
      expect(result.submitted).toBe(45);
      expect(result.verified).toBe(30);
      expect(result.rejected).toBe(8);
      expect(result.completionRate).toBe(Math.round((30 / (30 + 45 + 8)) * 10000) / 100);
      expect(ds.query).toHaveBeenCalledWith(expect.any(String), [UUID]);
    });

    it('should return zeros when mentor has no data', async () => {
      ds = mockDataSource();
      ds.query.mockResolvedValue([{
        assignedSections: '0',
        totalStudents: '0',
        opportunitiesActive: '0',
        submitted: '0',
        verified: '0',
        rejected: '0',
      }]);
      service = createService();

      const result = await service.getMentorDashboard(UUID);

      expect(result.assignedSections).toBe(0);
      expect(result.completionRate).toBe(0);
    });
  });

  describe('getTeamLeaderDashboard', () => {
    it('should return team leader metrics for the given user', async () => {
      ds = mockDataSource();
      ds.query.mockResolvedValue([{
        assignedGroups: '2',
        students: '20',
        pendingVerifications: '5',
        verified: '10',
        rejected: '3',
      }]);
      service = createService();

      const result = await service.getTeamLeaderDashboard(UUID);

      expect(result.assignedGroups).toBe(2);
      expect(result.students).toBe(20);
      expect(result.pendingVerifications).toBe(5);
      expect(result.verified).toBe(10);
      expect(result.rejected).toBe(3);
      expect(ds.query).toHaveBeenCalledWith(expect.any(String), [UUID]);
    });

    it('should return zeros when team leader has no data', async () => {
      ds = mockDataSource();
      ds.query.mockResolvedValue([{
        assignedGroups: '0',
        students: '0',
        pendingVerifications: '0',
        verified: '0',
        rejected: '0',
      }]);
      service = createService();

      const result = await service.getTeamLeaderDashboard(UUID);

      expect(result.assignedGroups).toBe(0);
      expect(result.pendingVerifications).toBe(0);
    });
  });

  describe('getStudentDashboard', () => {
    it('should return student metrics for the given user', async () => {
      ds = mockDataSource();
      ds.query.mockResolvedValue([{
        assignedOpportunities: '8',
        inProgress: '3',
        submitted: '2',
        verified: '2',
        completed: '1',
      }]);
      service = createService();

      const result = await service.getStudentDashboard(UUID);

      expect(result.assignedOpportunities).toBe(8);
      expect(result.inProgress).toBe(3);
      expect(result.submitted).toBe(2);
      expect(result.verified).toBe(2);
      expect(result.completed).toBe(1);
      expect(ds.query).toHaveBeenCalledWith(expect.any(String), [UUID]);
    });

    it('should return zeros when student has no participations', async () => {
      ds = mockDataSource();
      ds.query.mockResolvedValue([{
        assignedOpportunities: '0',
        inProgress: '0',
        submitted: '0',
        verified: '0',
        completed: '0',
      }]);
      service = createService();

      const result = await service.getStudentDashboard(UUID);

      expect(result.assignedOpportunities).toBe(0);
      expect(result.completed).toBe(0);
    });
  });
});
