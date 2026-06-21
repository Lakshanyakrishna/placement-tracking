import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ExecutionContext } from '@nestjs/common';
import request from 'supertest';
import { IamController } from './iam.controller';
import { IamService } from './iam.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

const CURRENT_USER_ID = '550e8400-e29b-41d4-a716-446655440000';

describe('IamController (integration)', () => {
  let app: INestApplication;
  const mockIamService = {
    findActiveRolesByUser: jest.fn(),
    findMentorSections: jest.fn(),
    findTeamLeaderGroups: jest.fn(),
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IamController],
      providers: [{ provide: IamService, useValue: mockIamService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (ctx: ExecutionContext) => {
          const req = ctx.switchToHttp().getRequest();
          req.user = { id: CURRENT_USER_ID };
          return true;
        },
      })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /mentors/:userId/sections', () => {
    it('should return mentor sections', async () => {
      const mockSections = [
        { id: 'sec-1', branchId: 'b-1', academicPeriodId: 'ap-1', code: 'A', mentorUserId: 'u-1', createdAt: new Date(), updatedAt: new Date(), branchCode: 'CSE', branchName: 'Computer Science' },
      ];
      mockIamService.findMentorSections.mockResolvedValue([
        { id: 'sec-1', branchId: 'b-1', academicPeriodId: 'ap-1', code: 'A', mentorUserId: 'u-1', createdAt: new Date(), updatedAt: new Date(), branch: { code: 'CSE', name: 'Computer Science' } },
      ]);

      const response = await request(app.getHttpServer())
        .get(`/mentors/${CURRENT_USER_ID}/sections`)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toMatchObject({
        id: 'sec-1',
        code: 'A',
        branchCode: 'CSE',
        branchName: 'Computer Science',
      });
    });

    it('should return empty array when no sections', async () => {
      mockIamService.findMentorSections.mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get(`/mentors/${CURRENT_USER_ID}/sections`)
        .expect(200);

      expect(response.body).toEqual([]);
    });
  });

  describe('GET /team-leaders/:userId/groups', () => {
    it('should return team leader groups', async () => {
      mockIamService.findTeamLeaderGroups.mockResolvedValue([
        { id: 'grp-1', sectionId: 'sec-1', name: 'Group A', teamLeaderUserId: 'u-2', createdAt: new Date(), updatedAt: new Date(), section: { code: 'A' } },
      ]);

      const response = await request(app.getHttpServer())
        .get(`/team-leaders/${CURRENT_USER_ID}/groups`)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toMatchObject({
        id: 'grp-1',
        name: 'Group A',
        sectionCode: 'A',
      });
    });

    it('should return empty array when no groups', async () => {
      mockIamService.findTeamLeaderGroups.mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get(`/team-leaders/${CURRENT_USER_ID}/groups`)
        .expect(200);

      expect(response.body).toEqual([]);
    });
  });
});
