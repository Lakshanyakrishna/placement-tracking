import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { QueryFailedError } from 'typeorm';
import { EnrollmentsService } from './enrollments.service';
import { Enrollment } from './entities/enrollment.entity';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';

type MockRepository = {
  findOne: jest.Mock;
  findAndCount: jest.Mock;
  createQueryBuilder: jest.Mock;
  create: jest.Mock;
  save: jest.Mock;
  remove: jest.Mock;
};

function createMockRepository(): MockRepository {
  return {
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    createQueryBuilder: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };
}

const mockEnrollment: Enrollment = {
  id: 'enr-1',
  userId: 'user-1',
  academicPeriodId: 'period-1',
  branchId: 'branch-1',
  sectionId: 'section-1',
  batchId: 'batch-1',
  groupId: 'group-1',
  rollNumber: '001',
  isActive: true,
  enrolledAt: new Date('2025-01-15'),
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
  user: { id: 'user-1', name: 'John Doe', email: 'john@example.com' } as any,
  academicPeriod: { id: 'period-1', label: '2025 Spring' } as any,
  branch: { id: 'branch-1', name: 'Computer Science' } as any,
  section: { id: 'section-1', code: 'A' } as any,
  group: { id: 'group-1', name: 'Group Alpha' } as any,
  batch: { id: 'batch-1', label: '2024-2028' } as any,
};

describe('EnrollmentsService', () => {
  let service: EnrollmentsService;
  let repository: ReturnType<typeof createMockRepository>;

  beforeEach(async () => {
    repository = createMockRepository();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EnrollmentsService,
        {
          provide: getRepositoryToken(Enrollment),
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get<EnrollmentsService>(EnrollmentsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated enrollments with default query', async () => {
      const qb = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockEnrollment], 1]),
      };
      repository.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findAll({ page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].userName).toBe('John Doe');
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
      expect(repository.createQueryBuilder).toHaveBeenCalledWith('enrollment');
    });

    it('should apply search filter on user name', async () => {
      const qb = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockEnrollment], 1]),
      };
      repository.createQueryBuilder.mockReturnValue(qb);

      await service.findAll({ search: 'John', page: 1, limit: 20 });

      expect(qb.andWhere).toHaveBeenCalledWith('user.name ILIKE :search', { search: '%John%' });
    });

    it('should use custom sort field', async () => {
      const qb = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };
      repository.createQueryBuilder.mockReturnValue(qb);

      await service.findAll({ sort: 'rollNumber', page: 1, limit: 20 });

      expect(qb.orderBy).toHaveBeenCalledWith('enrollment.rollNumber', 'ASC');
    });
  });

  describe('findOne', () => {
    it('should return an enrollment by id with relations', async () => {
      repository.findOne.mockResolvedValue(mockEnrollment);

      const result = await service.findOne('enr-1');

      expect(result.id).toBe('enr-1');
      expect(result.user.name).toBe('John Doe');
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'enr-1' },
        relations: ['user', 'branch', 'section', 'group', 'batch', 'academicPeriod'],
      });
    });

    it('should throw NotFoundException when enrollment does not exist', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create and return an enrollment', async () => {
      const dto: CreateEnrollmentDto = {
        userId: 'user-2',
        academicPeriodId: 'period-2',
        branchId: 'branch-2',
        sectionId: 'section-2',
        batchId: 'batch-2',
      };
      repository.create.mockReturnValue(dto as any);
      repository.save.mockResolvedValue({ id: 'enr-new', ...dto } as any);

      const result = await service.create(dto);

      expect((result as any).id).toBe('enr-new');
      expect(repository.create).toHaveBeenCalledWith(dto);
      expect(repository.save).toHaveBeenCalled();
    });

    it('should throw ConflictException on unique constraint violation', async () => {
      const dto: CreateEnrollmentDto = {
        userId: 'user-1',
        academicPeriodId: 'period-1',
        branchId: 'branch-1',
        sectionId: 'section-1',
        batchId: 'batch-1',
      };
      repository.create.mockReturnValue(dto as any);
      const driverError = { code: '23505' };
      repository.save.mockRejectedValue(
        new QueryFailedError('INSERT INTO ...', [], driverError as any),
      );

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });

    it('should rethrow non-23505 errors', async () => {
      const dto: CreateEnrollmentDto = {
        userId: 'user-1',
        academicPeriodId: 'period-1',
        branchId: 'branch-1',
        sectionId: 'section-1',
        batchId: 'batch-1',
      };
      repository.create.mockReturnValue(dto as any);
      const driverError = { code: '40001' };
      repository.save.mockRejectedValue(
        new QueryFailedError('INSERT INTO ...', [], driverError as any),
      );

      await expect(service.create(dto)).rejects.toThrow(QueryFailedError);
    });
  });

  describe('update', () => {
    it('should update and return the enrollment', async () => {
      repository.findOne.mockResolvedValue({ ...mockEnrollment });
      repository.save.mockResolvedValue({ ...mockEnrollment, rollNumber: '002' });

      const dto: UpdateEnrollmentDto = { rollNumber: '002' };
      const result = await service.update('enr-1', dto);

      expect(result.rollNumber).toBe('002');
      expect(repository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when enrollment to update does not exist', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.update('non-existent', {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove an enrollment', async () => {
      repository.findOne.mockResolvedValue(mockEnrollment);
      repository.remove.mockResolvedValue(mockEnrollment);

      await service.remove('enr-1');

      expect(repository.remove).toHaveBeenCalledWith(mockEnrollment);
    });

    it('should throw NotFoundException when enrollment to remove does not exist', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.remove('non-existent')).rejects.toThrow(NotFoundException);
    });
  });
});
