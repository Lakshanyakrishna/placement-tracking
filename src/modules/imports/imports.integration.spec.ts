import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ImportsController } from './imports.controller';
import { StudentsImportService } from './services/students-import.service';
import { GroupsImportService } from './services/groups-import.service';
import { TeamLeadersImportService } from './services/team-leaders-import.service';
import { MentorsImportService } from './services/mentors-import.service';
import { ImportHistory } from './entities/import-history.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

function createMockRepository() {
  return {
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
  };
}

function createMockImportService() {
  return {
    validate: jest.fn(),
    import: jest.fn(),
  };
}

describe('Imports Controller (Integration)', () => {
  let app: INestApplication;
  let studentsImportService: jest.Mocked<StudentsImportService>;

  const mockGuard = { canActivate: jest.fn().mockReturnValue(true) };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ImportsController],
      providers: [
        { provide: StudentsImportService, useValue: createMockImportService() },
        { provide: GroupsImportService, useValue: createMockImportService() },
        { provide: TeamLeadersImportService, useValue: createMockImportService() },
        { provide: MentorsImportService, useValue: createMockImportService() },
        { provide: getRepositoryToken(ImportHistory), useValue: createMockRepository() },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockGuard)
      .overrideGuard(RolesGuard)
      .useValue(mockGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();

    studentsImportService = app.get(StudentsImportService) as jest.Mocked<StudentsImportService>;
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/imports/students/validate', () => {
    it('should return 403 when auth guard rejects', async () => {
      mockGuard.canActivate.mockReturnValueOnce(false);
      await request(app.getHttpServer()).post('/api/v1/imports/students/validate').expect(403);
    });

    it('should return validation result', async () => {
      studentsImportService.validate.mockResolvedValue({
        valid: true,
        rows: [{ rowNumber: 2, roll_number: '2024001', name: 'Test', email: 't@t.com' }],
        errors: [],
        summary: { total: 1, validRows: 1, errorCount: 0 },
      });

      const response = await request(app.getHttpServer())
        .post('/api/v1/imports/students/validate')
        .attach('file', Buffer.from('mock'), 'students.xlsx')
        .expect(201);

      expect(response.body.valid).toBe(true);
      expect(response.body.summary.total).toBe(1);
    });

    it('should accept request without file', async () => {
      await request(app.getHttpServer()).post('/api/v1/imports/students/validate').expect(201);
    });
  });

  describe('POST /api/v1/imports/students/import', () => {
    it('should return import result', async () => {
      studentsImportService.import.mockResolvedValue({
        importType: 'students',
        status: 'success',
        totalRows: 1,
        successCount: 1,
        failureCount: 0,
        errors: [],
        importHistoryId: 'hist-1',
      });

      const response = await request(app.getHttpServer())
        .post('/api/v1/imports/students/import')
        .attach('file', Buffer.from('mock'), 'students.xlsx')
        .expect(201);

      expect(response.body.importType).toBe('students');
      expect(response.body.status).toBe('success');
    });
  });

  describe('GET /api/v1/imports/history', () => {
    it('should return import history list', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/imports/history')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should filter by import type', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/imports/history')
        .query({ importType: 'students' })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('POST /api/v1/imports/groups/validate', () => {
    it('should return validation result', async () => {
      const groupsService = app.get(GroupsImportService) as jest.Mocked<GroupsImportService>;
      groupsService.validate.mockResolvedValue({
        valid: true,
        rows: [],
        errors: [],
        summary: { total: 1, validRows: 1, errorCount: 0 },
      });

      const response = await request(app.getHttpServer())
        .post('/api/v1/imports/groups/validate')
        .attach('file', Buffer.from('mock'), 'groups.xlsx')
        .expect(201);

      expect(response.body.valid).toBeDefined();
    });
  });

  describe('POST /api/v1/imports/team-leaders/validate', () => {
    it('should return validation result', async () => {
      const tlService = app.get(TeamLeadersImportService) as jest.Mocked<TeamLeadersImportService>;
      tlService.validate.mockResolvedValue({
        valid: true,
        rows: [],
        errors: [],
        summary: { total: 1, validRows: 1, errorCount: 0 },
      });

      const response = await request(app.getHttpServer())
        .post('/api/v1/imports/team-leaders/validate')
        .attach('file', Buffer.from('mock'), 'team-leaders.xlsx')
        .expect(201);

      expect(response.body.valid).toBeDefined();
    });
  });

  describe('POST /api/v1/imports/mentors/validate', () => {
    it('should return validation result', async () => {
      const mentorsService = app.get(MentorsImportService) as jest.Mocked<MentorsImportService>;
      mentorsService.validate.mockResolvedValue({
        valid: true,
        rows: [],
        errors: [],
        summary: { total: 1, validRows: 1, errorCount: 0 },
      });

      const response = await request(app.getHttpServer())
        .post('/api/v1/imports/mentors/validate')
        .attach('file', Buffer.from('mock'), 'mentors.xlsx')
        .expect(201);

      expect(response.body.valid).toBeDefined();
    });
  });

  describe('POST /api/v1/imports/groups/import', () => {
    it('should return import result', async () => {
      const groupsService = app.get(GroupsImportService) as jest.Mocked<GroupsImportService>;
      groupsService.import.mockResolvedValue({
        importType: 'groups',
        status: 'success',
        totalRows: 1,
        successCount: 1,
        failureCount: 0,
        errors: [],
        importHistoryId: 'hist-2',
      });

      const response = await request(app.getHttpServer())
        .post('/api/v1/imports/groups/import')
        .attach('file', Buffer.from('mock'), 'groups.xlsx')
        .expect(201);

      expect(response.body.importType).toBe('groups');
    });
  });

  describe('POST /api/v1/imports/team-leaders/import', () => {
    it('should return import result', async () => {
      const tlService = app.get(TeamLeadersImportService) as jest.Mocked<TeamLeadersImportService>;
      tlService.import.mockResolvedValue({
        importType: 'team_leaders',
        status: 'success',
        totalRows: 1,
        successCount: 1,
        failureCount: 0,
        errors: [],
        importHistoryId: 'hist-3',
      });

      const response = await request(app.getHttpServer())
        .post('/api/v1/imports/team-leaders/import')
        .attach('file', Buffer.from('mock'), 'team-leaders.xlsx')
        .expect(201);

      expect(response.body.importType).toBe('team_leaders');
    });
  });

  describe('POST /api/v1/imports/mentors/import', () => {
    it('should return import result', async () => {
      const mentorsService = app.get(MentorsImportService) as jest.Mocked<MentorsImportService>;
      mentorsService.import.mockResolvedValue({
        importType: 'mentors',
        status: 'success',
        totalRows: 1,
        successCount: 1,
        failureCount: 0,
        errors: [],
        importHistoryId: 'hist-4',
      });

      const response = await request(app.getHttpServer())
        .post('/api/v1/imports/mentors/import')
        .attach('file', Buffer.from('mock'), 'mentors.xlsx')
        .expect(201);

      expect(response.body.importType).toBe('mentors');
    });
  });
});
