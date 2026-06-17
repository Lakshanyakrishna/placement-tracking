import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { MentorsImportService } from './mentors-import.service';
import { ExcelParserEngine } from '../engines/excel-parser.engine';
import { ImportValidatorEngine } from '../engines/import-validator.engine';
import { AppConfigService } from '../../../config/config.service';
import { User } from '../../users/entities/user.entity';
import { Section } from '../../sections/entities/section.entity';
import { RoleAssignment } from '../../iam/entities/role-assignment.entity';
jest.mock('bcrypt', () => ({
  hashSync: jest.fn().mockReturnValue('hashed-default-password'),
  compare: jest.fn(),
  hash: jest.fn(),
}));
function createMockManager() {
  return {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    update: jest.fn(),
  };
}
function createMockDataSource() {
  return {
    transaction: jest
      .fn()
      .mockImplementation(<T>(cb: (mgr: ReturnType<typeof createMockManager>) => Promise<T>) =>
        cb(createMockManager()),
      ),
  };
}
describe('MentorsImportService', () => {
  let service: MentorsImportService;
  let excelParser: jest.Mocked<ExcelParserEngine>;
  let validator: jest.Mocked<ImportValidatorEngine>;
  let dataSource: ReturnType<typeof createMockDataSource>;
  const mockFile = {
    originalname: 'mentors.xlsx',
    buffer: Buffer.from('mock'),
    encoding: '7bit',
    mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    size: 100,
    fieldname: 'file',
  };
  const mockCache = {
    branches: new Map([['CSE', 'branch-1']]),
    sections: new Map([['branch-1|A', 'section-1']]),
    groups: new Map(),
    usersByEmail: new Map([['existing-mentor@test.com', 'user-1']]),
    enrollments: new Set(),
  };
  const mockRow = {
    rowNumber: 2,
    name: 'Dr. Mentor',
    email: 'mentor@test.com',
    contact_phone: '9876543210',
    branch_code: 'CSE',
    section_code: 'A',
  };
  beforeEach(async () => {
    dataSource = createMockDataSource();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MentorsImportService,
        {
          provide: ExcelParserEngine,
          useValue: {
            parse: jest.fn(),
          },
        },
        {
          provide: ImportValidatorEngine,
          useValue: {
            buildCache: jest.fn(),
            validateBranch: jest.fn(),
            validateSection: jest.fn(),
            validateGroup: jest.fn(),
            validateEmail: jest.fn(),
            detectRowDuplicates: jest.fn(),
          },
        },
        {
          provide: AppConfigService,
          useValue: {
            auth: { bcryptRounds: 10 },
          },
        },
        {
          provide: DataSource,
          useValue: dataSource,
        },
      ],
    }).compile();
    service = module.get<MentorsImportService>(MentorsImportService);
    excelParser = module.get(ExcelParserEngine) as jest.Mocked<ExcelParserEngine>;
    validator = module.get(ImportValidatorEngine) as jest.Mocked<ImportValidatorEngine>;
    dataSource = module.get(DataSource) as any;
  });
  afterEach(() => {
    jest.clearAllMocks();
  });
  describe('validate', () => {
    it('should return valid result for valid mentor assignment', async () => {
      excelParser.parse.mockResolvedValue({ rows: [mockRow], errors: [] });
      validator.buildCache.mockResolvedValue(mockCache as any);
      validator.validateBranch.mockReturnValue('branch-1');
      validator.validateSection.mockReturnValue('section-1');
      validator.detectRowDuplicates.mockReturnValue([]);
      const result = await service.validate(mockFile);
      expect(result.valid).toBe(true);
      expect(result.summary.total).toBe(1);
      expect(result.errors).toHaveLength(0);
    });
    it('should return parse errors immediately', async () => {
      excelParser.parse.mockResolvedValue({
        rows: [],
        errors: [{ row: 2, column: 'name', message: 'Name is required' }],
      });
      const result = await service.validate(mockFile);
      expect(result.valid).toBe(false);
      expect(result.summary.validRows).toBe(0);
    });
    it('should reject duplicate section assignments in file', async () => {
      excelParser.parse.mockResolvedValue({ rows: [mockRow, mockRow], errors: [] });
      validator.buildCache.mockResolvedValue(mockCache as any);
      validator.validateBranch.mockReturnValue('branch-1');
      validator.validateSection.mockReturnValue('section-1');
      validator.detectRowDuplicates.mockReturnValue([]);
      const result = await service.validate(mockFile);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message.includes('already has a mentor'))).toBe(true);
    });
  });
  describe('import', () => {
    it('should assign mentor successfully for existing user', async () => {
      const manager = createMockManager();
      dataSource.transaction.mockImplementation(<T>(cb: (mgr: typeof manager) => Promise<T>) =>
        cb(manager),
      );
      manager.create.mockImplementation((entity: any, data: any) => data);
      manager.save.mockResolvedValue({});
      manager.findOne
        .mockResolvedValueOnce({ id: 'user-1', email: 'existing-mentor@test.com' })
        .mockResolvedValueOnce(null);
      manager.update.mockResolvedValue({} as any);
      const existingUserRow = {
        ...mockRow,
        email: 'existing-mentor@test.com',
        name: 'Existing Mentor',
      };
      excelParser.parse.mockResolvedValue({ rows: [existingUserRow], errors: [] });
      validator.buildCache.mockResolvedValue(mockCache as any);
      validator.validateBranch.mockReturnValue('branch-1');
      validator.validateSection.mockReturnValue('section-1');
      validator.detectRowDuplicates.mockReturnValue([]);
      const result = await service.import(mockFile, 'admin-1');
      expect(result.status).toBe('success');
      expect(result.successCount).toBe(1);
      expect(manager.update).toHaveBeenCalledWith(
        Section,
        { id: 'section-1' },
        { mentorUserId: 'user-1' },
      );
    });
    it('should create new user and assign as mentor', async () => {
      const manager = createMockManager();
      dataSource.transaction.mockImplementation(<T>(cb: (mgr: typeof manager) => Promise<T>) =>
        cb(manager),
      );
      manager.create.mockImplementation((entity: any, data: any) => {
        if (data?.email === 'mentor@test.com') return { ...data, id: 'new-user' };
        return data;
      });
      manager.save.mockResolvedValue({});
      manager.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(null);
      manager.update.mockResolvedValue({} as any);
      excelParser.parse.mockResolvedValue({ rows: [mockRow], errors: [] });
      validator.buildCache.mockResolvedValue(mockCache as any);
      validator.validateBranch.mockReturnValue('branch-1');
      validator.validateSection.mockReturnValue('section-1');
      validator.detectRowDuplicates.mockReturnValue([]);
      await service.import(mockFile, 'admin-1');
      expect(manager.create).toHaveBeenCalledWith(
        User,
        expect.objectContaining({
          email: 'mentor@test.com',
          passwordHash: 'hashed-default-password',
        }),
      );
    });
    it('should not create duplicate role assignment', async () => {
      const manager = createMockManager();
      dataSource.transaction.mockImplementation(<T>(cb: (mgr: typeof manager) => Promise<T>) =>
        cb(manager),
      );
      manager.create.mockImplementation((entity: any, data: any) => data);
      manager.save.mockResolvedValue({});
      manager.findOne
        .mockResolvedValueOnce({ id: 'user-1' })
        .mockResolvedValueOnce({ id: 'existing-role' });
      manager.update.mockResolvedValue({} as any);
      const existingUserRow = {
        ...mockRow,
        email: 'existing-mentor@test.com',
      };
      excelParser.parse.mockResolvedValue({ rows: [existingUserRow], errors: [] });
      validator.buildCache.mockResolvedValue(mockCache as any);
      validator.validateBranch.mockReturnValue('branch-1');
      validator.validateSection.mockReturnValue('section-1');
      validator.detectRowDuplicates.mockReturnValue([]);
      await service.import(mockFile, 'admin-1');
      expect(manager.create).not.toHaveBeenCalledWith(
        RoleAssignment as any,
        expect.objectContaining({ role: 'mentor' }),
      );
    });
    it('should handle failure gracefully', async () => {
      const manager = createMockManager();
      dataSource.transaction.mockImplementation(<T>(cb: (mgr: typeof manager) => Promise<T>) =>
        cb(manager),
      );
      let saveCallCount = 0;
      manager.create.mockImplementation((entity: any, data: any) => data);
      manager.save.mockImplementation(async () => {
        saveCallCount++;
        if (saveCallCount === 2) throw new Error('DB error');
        return {};
      });
      manager.findOne
        .mockResolvedValueOnce(null) // user not found, will create
        .mockResolvedValueOnce(null);
      excelParser.parse.mockResolvedValue({ rows: [mockRow], errors: [] });
      validator.buildCache.mockResolvedValue(mockCache as any);
      validator.validateBranch.mockReturnValue('branch-1');
      validator.validateSection.mockReturnValue('section-1');
      validator.detectRowDuplicates.mockReturnValue([]);
      const result = await service.import(mockFile, 'admin-1');
      expect(result.status).toBe('failed');
      expect(result.successCount).toBe(0);
    });
  });
});
