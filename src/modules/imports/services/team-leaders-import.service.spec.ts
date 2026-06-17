import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { TeamLeadersImportService } from './team-leaders-import.service';
import { ExcelParserEngine } from '../engines/excel-parser.engine';
import { ImportValidatorEngine } from '../engines/import-validator.engine';
import { RoleAssignment } from '../../iam/entities/role-assignment.entity';
import { Group } from '../../groups/entities/group.entity';

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

describe('TeamLeadersImportService', () => {
  let service: TeamLeadersImportService;
  let excelParser: jest.Mocked<ExcelParserEngine>;
  let validator: jest.Mocked<ImportValidatorEngine>;
  let dataSource: ReturnType<typeof createMockDataSource>;

  const mockFile = {
    originalname: 'team-leaders.xlsx',
    buffer: Buffer.from('mock'),
    encoding: '7bit',
    mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    size: 100,
    fieldname: 'file',
  };

  const mockCache = {
    branches: new Map([['CSE', 'branch-1']]),
    sections: new Map([['branch-1|A', 'section-1']]),
    groups: new Map([['section-1|Group Alpha', 'group-1']]),
    usersByEmail: new Map([['leader@test.com', 'user-1']]),
    enrollments: new Set(),
  };

  const mockRow = {
    rowNumber: 2,
    email: 'leader@test.com',
    branch_code: 'CSE',
    section_code: 'A',
    group_name: 'Group Alpha',
  };

  beforeEach(async () => {
    dataSource = createMockDataSource();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeamLeadersImportService,
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
          useValue: dataSource,
        },
      ],
    }).compile();

    service = module.get<TeamLeadersImportService>(TeamLeadersImportService);
    excelParser = module.get(ExcelParserEngine) as jest.Mocked<ExcelParserEngine>;
    validator = module.get(ImportValidatorEngine) as jest.Mocked<ImportValidatorEngine>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validate', () => {
    it('should return valid result for valid team leader assignment', async () => {
      excelParser.parse.mockResolvedValue({ rows: [mockRow], errors: [] });
      validator.buildCache.mockResolvedValue(mockCache as any);
      validator.validateEmail.mockReturnValue('user-1');
      validator.validateBranch.mockReturnValue('branch-1');
      validator.validateSection.mockReturnValue('section-1');
      validator.validateGroup.mockReturnValue('group-1');
      validator.detectRowDuplicates.mockReturnValue([]);

      const result = await service.validate(mockFile);

      expect(result.valid).toBe(true);
      expect(result.summary.total).toBe(1);
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

    it('should validate user existence', async () => {
      excelParser.parse.mockResolvedValue({ rows: [mockRow], errors: [] });
      validator.buildCache.mockResolvedValue(mockCache as any);
      validator.validateEmail.mockImplementation((_cache, _row, _email, _field, errors: any[]) => {
        errors.push({
          row: _row,
          column: _field,
          message: `User with email "${_email}" not found in system`,
        });
        return null;
      });
      validator.validateBranch.mockReturnValue('branch-1');
      validator.validateSection.mockReturnValue('section-1');
      validator.detectRowDuplicates.mockReturnValue([]);

      const result = await service.validate(mockFile);

      expect(result.valid).toBe(false);
    });
  });

  describe('import', () => {
    it('should assign team leader successfully', async () => {
      const manager = createMockManager();
      dataSource.transaction.mockImplementation(<T>(cb: (mgr: typeof manager) => Promise<T>) =>
        cb(manager),
      );

      manager.create.mockImplementation((entity: any, data: any) => data);
      manager.save.mockResolvedValue({});
      manager.findOne.mockResolvedValue(null);

      excelParser.parse.mockResolvedValue({ rows: [mockRow], errors: [] });
      validator.buildCache.mockResolvedValue(mockCache as any);
      validator.validateEmail.mockReturnValue('user-1');
      validator.validateBranch.mockReturnValue('branch-1');
      validator.validateSection.mockReturnValue('section-1');
      validator.validateGroup.mockReturnValue('group-1');
      validator.detectRowDuplicates.mockReturnValue([]);

      const result = await service.import(mockFile, 'admin-1');

      expect(result.status).toBe('success');
      expect(result.successCount).toBe(1);
      expect(manager.update).toHaveBeenCalledWith(
        Group,
        { id: 'group-1' },
        { teamLeaderUserId: 'user-1' },
      );
    });

    it('should skip if user not found in system', async () => {
      const manager = createMockManager();
      dataSource.transaction.mockImplementation(<T>(cb: (mgr: typeof manager) => Promise<T>) =>
        cb(manager),
      );

      manager.create.mockReturnValue({});
      manager.save.mockResolvedValue({});

      const noUserCache = {
        ...mockCache,
        usersByEmail: new Map(),
      };

      excelParser.parse.mockResolvedValue({ rows: [mockRow], errors: [] });
      validator.buildCache.mockResolvedValue(noUserCache as any);
      validator.validateEmail.mockReturnValue(null);
      validator.validateBranch.mockReturnValue('branch-1');
      validator.validateSection.mockReturnValue('section-1');
      validator.validateGroup.mockReturnValue('group-1');
      validator.detectRowDuplicates.mockReturnValue([]);

      const result = await service.import(mockFile, 'admin-1');

      expect(result.successCount).toBe(0);
    });

    it('should not create duplicate role assignment', async () => {
      const manager = createMockManager();
      dataSource.transaction.mockImplementation(<T>(cb: (mgr: typeof manager) => Promise<T>) =>
        cb(manager),
      );

      manager.create.mockImplementation((entity: any, data: any) => data);
      manager.save.mockResolvedValue({});
      manager.findOne.mockResolvedValue({ id: 'existing-role' });

      excelParser.parse.mockResolvedValue({ rows: [mockRow], errors: [] });
      validator.buildCache.mockResolvedValue(mockCache as any);
      validator.validateEmail.mockReturnValue('user-1');
      validator.validateBranch.mockReturnValue('branch-1');
      validator.validateSection.mockReturnValue('section-1');
      validator.validateGroup.mockReturnValue('group-1');
      validator.detectRowDuplicates.mockReturnValue([]);

      await service.import(mockFile, 'admin-1');

      expect(manager.create).not.toHaveBeenCalledWith(RoleAssignment, expect.anything());
    });
  });
});
