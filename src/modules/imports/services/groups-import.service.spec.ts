import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { GroupsImportService } from './groups-import.service';
import { ExcelParserEngine } from '../engines/excel-parser.engine';
import { ImportValidatorEngine } from '../engines/import-validator.engine';

function createMockManager() {
  return {
    create: jest.fn().mockImplementation((_entity: any, data?: any) => {
      if (data) return { ...data, status: 'failed' };
      return { status: 'failed' };
    }),
    save: jest.fn().mockResolvedValue({}),
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

describe('GroupsImportService', () => {
  let service: GroupsImportService;
  let excelParser: jest.Mocked<ExcelParserEngine>;
  let validator: jest.Mocked<ImportValidatorEngine>;

  const mockFile = {
    originalname: 'groups.xlsx',
    buffer: Buffer.from('mock'),
    encoding: '7bit',
    mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    size: 100,
    fieldname: 'file',
  };

  const mockCache = {
    branches: new Map<string, string>([['CSE', 'branch-1']]),
    sections: new Map<string, string>([['branch-1|A', 'section-1']]),
    groups: new Map<string, string>(),
    usersByEmail: new Map<string, string>(),
    enrollments: new Set<string>(),
  };

  const mockRow = {
    rowNumber: 2,
    branch_code: 'CSE',
    section_code: 'A',
    group_name: 'Group Alpha',
  };

  beforeEach(async () => {
    const ds = createMockDataSource();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GroupsImportService,
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
          provide: DataSource,
          useValue: ds,
        },
      ],
    }).compile();

    service = module.get<GroupsImportService>(GroupsImportService);
    excelParser = module.get(ExcelParserEngine) as jest.Mocked<ExcelParserEngine>;
    validator = module.get(ImportValidatorEngine) as jest.Mocked<ImportValidatorEngine>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validate', () => {
    it('should return valid result for new groups', async () => {
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
        errors: [{ row: 2, column: 'group_name', message: 'Group Name is required' }],
      });

      const result = await service.validate(mockFile);

      expect(result.valid).toBe(false);
      expect(result.summary.validRows).toBe(0);
    });

    it('should detect existing groups in database', async () => {
      const existingCache = {
        ...mockCache,
        groups: new Map<string, string>([['section-1|Group Alpha', 'group-1']]),
      };
      excelParser.parse.mockResolvedValue({ rows: [mockRow], errors: [] });
      validator.buildCache.mockResolvedValue(existingCache as any);
      validator.validateBranch.mockReturnValue('branch-1');
      validator.validateSection.mockReturnValue('section-1');
      validator.detectRowDuplicates.mockReturnValue([]);

      const result = await service.validate(mockFile);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message.includes('already exists'))).toBe(true);
    });

    it('should detect duplicate rows in file', async () => {
      excelParser.parse.mockResolvedValue({ rows: [mockRow, mockRow], errors: [] });
      validator.buildCache.mockResolvedValue(mockCache as any);
      validator.validateBranch.mockReturnValue('branch-1');
      validator.validateSection.mockReturnValue('section-1');
      validator.detectRowDuplicates.mockReturnValue([
        { row: 3, column: 'branch_code, section_code, group_name', message: 'Duplicate' },
      ]);

      const result = await service.validate(mockFile);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
    });
  });

  describe('import', () => {
    it('should import valid groups successfully', async () => {
      const manager = createMockManager();
      const ds = createMockDataSource();
      ds.transaction.mockImplementation(<T>(cb: (mgr: typeof manager) => Promise<T>) =>
        cb(manager),
      );

      const module = await Test.createTestingModule({
        providers: [
          GroupsImportService,
          { provide: ExcelParserEngine, useValue: { parse: jest.fn() } },
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
          { provide: DataSource, useValue: ds },
        ],
      }).compile();
      service = module.get(GroupsImportService);
      excelParser = module.get(ExcelParserEngine) as jest.Mocked<ExcelParserEngine>;
      validator = module.get(ImportValidatorEngine) as jest.Mocked<ImportValidatorEngine>;

      manager.create.mockReturnValue({ id: 'new-group' });
      manager.save.mockResolvedValue({ id: 'new-group' });

      excelParser.parse.mockResolvedValue({ rows: [mockRow], errors: [] });
      validator.buildCache.mockResolvedValue(mockCache as any);
      validator.validateBranch.mockReturnValue('branch-1');
      validator.validateSection.mockReturnValue('section-1');
      validator.detectRowDuplicates.mockReturnValue([]);

      const result = await service.import(mockFile, 'admin-1');

      expect(result.status).toBe('success');
      expect(result.successCount).toBe(1);
      expect(result.importType).toBe('groups');
    });

    it('should skip rows without creating history for invalid validation', async () => {
      excelParser.parse.mockResolvedValue({
        rows: [mockRow],
        errors: [{ row: 2, column: 'group_name', message: 'Group Name is required' }],
      });

      const result = await service.import(mockFile, 'admin-1');

      expect(result.status).toBe('failed');
      expect(result.successCount).toBe(0);
    });

    it('should skip groups that already exist', async () => {
      const manager = createMockManager();
      const ds = createMockDataSource();
      ds.transaction.mockImplementation(<T>(cb: (mgr: typeof manager) => Promise<T>) =>
        cb(manager),
      );

      const module = await Test.createTestingModule({
        providers: [
          GroupsImportService,
          { provide: ExcelParserEngine, useValue: { parse: jest.fn() } },
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
          { provide: DataSource, useValue: ds },
        ],
      }).compile();
      service = module.get(GroupsImportService);
      excelParser = module.get(ExcelParserEngine) as jest.Mocked<ExcelParserEngine>;
      validator = module.get(ImportValidatorEngine) as jest.Mocked<ImportValidatorEngine>;

      manager.save.mockResolvedValue({});

      const existingCache = {
        ...mockCache,
        groups: new Map<string, string>([['section-1|Group Alpha', 'existing-group']]),
      };

      excelParser.parse.mockResolvedValue({ rows: [mockRow], errors: [] });
      validator.buildCache.mockResolvedValue(existingCache as any);
      validator.validateBranch.mockReturnValue('branch-1');
      validator.validateSection.mockReturnValue('section-1');
      validator.detectRowDuplicates.mockReturnValue([]);

      const result = await service.import(mockFile, 'admin-1');

      expect(result.status).toBe('failed');
      expect(result.successCount).toBe(0);
    });
  });
});
