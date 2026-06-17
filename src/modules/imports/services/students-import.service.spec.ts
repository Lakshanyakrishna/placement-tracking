import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { StudentsImportService } from './students-import.service';
import { ExcelParserEngine } from '../engines/excel-parser.engine';
import { ImportValidatorEngine } from '../engines/import-validator.engine';
import { AppConfigService } from '../../../config/config.service';
import { User } from '../../users/entities/user.entity';
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
describe('StudentsImportService', () => {
  let service: StudentsImportService;
  let excelParser: jest.Mocked<ExcelParserEngine>;
  let validator: jest.Mocked<ImportValidatorEngine>;
  let dataSource: ReturnType<typeof createMockDataSource>;
  const mockFile = {
    originalname: 'students.xlsx',
    buffer: Buffer.from('mock'),
    encoding: '7bit',
    mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    size: 100,
    fieldname: 'file',
  };
  const mockCache = {
    branches: new Map([['CSE', 'branch-1']]),
    sections: new Map([['branch-1|A', 'section-1']]),
    groups: new Map([['section-1|Group1', 'group-1']]),
    usersByEmail: new Map([['existing@test.com', 'user-1']]),
    enrollments: new Set(['user-2']),
  };
  const mockRow = {
    rowNumber: 2,
    roll_number: '2024001',
    name: 'Test Student',
    email: 'student@test.com',
    contact_phone: '9876543210',
    branch_code: 'CSE',
    section_code: 'A',
    group_name: 'Group1',
  };
  beforeEach(async () => {
    dataSource = createMockDataSource();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudentsImportService,
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
    service = module.get<StudentsImportService>(StudentsImportService);
    excelParser = module.get(ExcelParserEngine) as jest.Mocked<ExcelParserEngine>;
    validator = module.get(ImportValidatorEngine) as jest.Mocked<ImportValidatorEngine>;
  });
  afterEach(() => {
    jest.clearAllMocks();
  });
  describe('validate', () => {
    it('should return valid result on successful validation', async () => {
      excelParser.parse.mockResolvedValue({ rows: [mockRow], errors: [] });
      validator.buildCache.mockResolvedValue(mockCache as any);
      validator.validateBranch.mockReturnValue('branch-1');
      validator.validateSection.mockReturnValue('section-1');
      validator.validateGroup.mockReturnValue('group-1');
      validator.detectRowDuplicates.mockReturnValue([]);
      const result = await service.validate(mockFile);
      expect(result.valid).toBe(true);
      expect(result.summary.total).toBe(1);
      expect(result.summary.validRows).toBe(1);
      expect(result.errors).toHaveLength(0);
    });
    it('should return parse errors immediately', async () => {
      excelParser.parse.mockResolvedValue({
        rows: [],
        errors: [{ row: 2, column: 'email', message: 'Email is required' }],
      });
      const result = await service.validate(mockFile);
      expect(result.valid).toBe(false);
      expect(result.summary.validRows).toBe(0);
    });
    it('should detect duplicate roll numbers and emails', async () => {
      excelParser.parse.mockResolvedValue({ rows: [mockRow, mockRow], errors: [] });
      validator.buildCache.mockResolvedValue(mockCache as any);
      validator.validateBranch.mockReturnValue('branch-1');
      validator.validateSection.mockReturnValue('section-1');
      validator.validateGroup.mockReturnValue('group-1');
      validator.detectRowDuplicates.mockReturnValue([
        { row: 3, column: 'roll_number, email', message: 'Duplicate combination' },
      ]);
      const result = await service.validate(mockFile);
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
    });
    it('should flag already enrolled students', async () => {
      const enrolledRow = { ...mockRow, email: 'existing@test.com' };
      const enrolledCache = {
        ...mockCache,
        usersByEmail: new Map([['existing@test.com', 'user-2']]),
      };
      excelParser.parse.mockResolvedValue({ rows: [enrolledRow], errors: [] });
      validator.buildCache.mockResolvedValue(enrolledCache as any);
      validator.validateBranch.mockReturnValue('branch-1');
      validator.validateSection.mockReturnValue('section-1');
      validator.validateGroup.mockReturnValue('group-1');
      validator.detectRowDuplicates.mockReturnValue([]);
      const result = await service.validate(mockFile);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message.includes('already enrolled'))).toBe(true);
    });
  });
  describe('import', () => {
    it('should import valid rows successfully', async () => {
      const manager = createMockManager();
      dataSource.transaction.mockImplementation(<T>(cb: (mgr: typeof manager) => Promise<T>) =>
        cb(manager),
      );
      manager.create.mockImplementation((entity: any, data: any) => data);
      manager.save.mockResolvedValue({});
      manager.findOne
        .mockResolvedValueOnce({ id: 'period-1', academicYearId: 'year-1' })
        .mockResolvedValueOnce({ id: 'batch-1' })
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      excelParser.parse.mockResolvedValue({ rows: [mockRow], errors: [] });
      validator.buildCache.mockResolvedValue(mockCache as any);
      validator.validateBranch.mockReturnValue('branch-1');
      validator.validateSection.mockReturnValue('section-1');
      validator.validateGroup.mockReturnValue('group-1');
      validator.detectRowDuplicates.mockReturnValue([]);
      const result = await service.import(mockFile, 'admin-1');
      expect(result.status).toBe('success');
      expect(result.successCount).toBe(1);
      expect(result.importType).toBe('students');
    });
    it('should create user if not exists', async () => {
      const manager = createMockManager();
      dataSource.transaction.mockImplementation(<T>(cb: (mgr: typeof manager) => Promise<T>) =>
        cb(manager),
      );
      manager.create.mockImplementation((entity: any, data: any) => data);
      manager.save.mockResolvedValue({});
      manager.findOne
        .mockResolvedValueOnce({ id: 'period-1', academicYearId: 'year-1' })
        .mockResolvedValueOnce({ id: 'batch-1' })
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      excelParser.parse.mockResolvedValue({ rows: [mockRow], errors: [] });
      validator.buildCache.mockResolvedValue(mockCache as any);
      validator.validateBranch.mockReturnValue('branch-1');
      validator.validateSection.mockReturnValue('section-1');
      validator.validateGroup.mockReturnValue('group-1');
      validator.detectRowDuplicates.mockReturnValue([]);
      await service.import(mockFile, 'admin-1');
      expect(manager.create).toHaveBeenCalledWith(
        User,
        expect.objectContaining({
          email: 'student@test.com',
          passwordHash: 'hashed-default-password',
        }),
      );
    });
    it('should handle transaction rollback on missing academic period', async () => {
      const manager = createMockManager();
      dataSource.transaction.mockImplementation(<T>(cb: (mgr: typeof manager) => Promise<T>) =>
        cb(manager),
      );
      manager.create.mockReturnValue({});
      manager.save.mockResolvedValue({});
      manager.findOne.mockResolvedValue(null);
      excelParser.parse.mockResolvedValue({ rows: [mockRow], errors: [] });
      validator.buildCache.mockResolvedValue(mockCache as any);
      validator.validateBranch.mockReturnValue('branch-1');
      validator.validateSection.mockReturnValue('section-1');
      validator.validateGroup.mockReturnValue('group-1');
      validator.detectRowDuplicates.mockReturnValue([]);
      await expect(service.import(mockFile, 'admin-1')).rejects.toThrow(
        'No active academic period found',
      );
    });
    it('should return partial status when some rows fail', async () => {
      const manager = createMockManager();
      dataSource.transaction.mockImplementation(<T>(cb: (mgr: typeof manager) => Promise<T>) =>
        cb(manager),
      );
      manager.create.mockImplementation((entity: any, data: any) => data);
      manager.save.mockImplementation(async (data: any) => {
        if (data.email === 'fail@test.com') throw new Error('Save failed');
        return data;
      });
      manager.findOne
        .mockResolvedValueOnce({ id: 'period-1', academicYearId: 'year-1' })
        .mockResolvedValueOnce({ id: 'batch-1' })
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      const failRow = { ...mockRow, email: 'fail@test.com' };
      excelParser.parse.mockResolvedValue({ rows: [mockRow, failRow], errors: [] });
      validator.buildCache.mockResolvedValue(mockCache as any);
      validator.validateBranch.mockReturnValue('branch-1');
      validator.validateSection.mockReturnValue('section-1');
      validator.validateGroup.mockReturnValue('group-1');
      validator.detectRowDuplicates.mockReturnValue([]);
      const result = await service.import(mockFile, 'admin-1');
      expect(result.status).toBe('partial');
      expect(result.successCount).toBe(1);
      expect(result.importType).toBe('students');
    });
  });
});
