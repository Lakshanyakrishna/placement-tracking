import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BranchesService } from './branches.service';
import { Branch } from './entities/branch.entity';
import { Section } from '../sections/entities/section.entity';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

const mockBranch: Branch = {
  id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  code: 'CSE',
  name: 'Computer Science & Engineering',
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
  deletedAt: null,
};

function createMockRepository(extra: Record<string, any> = {}) {
  return {
    findAndCount: jest.fn(),
    findOneBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    count: jest.fn(),
    softRemove: jest.fn(),
    ...extra,
  };
}

describe('BranchesService', () => {
  let service: BranchesService;
  let repository: ReturnType<typeof createMockRepository>;
  let sectionRepo: ReturnType<typeof createMockRepository>;

  beforeEach(async () => {
    repository = createMockRepository();
    sectionRepo = createMockRepository();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BranchesService,
        {
          provide: getRepositoryToken(Branch),
          useValue: repository,
        },
        {
          provide: getRepositoryToken(Section),
          useValue: sectionRepo,
        },
      ],
    }).compile();

    service = module.get<BranchesService>(BranchesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated results without search', async () => {
      repository.findAndCount.mockResolvedValue([[mockBranch], 1]);

      const query: PaginationQueryDto = { page: 1, limit: 20, sort: '-createdAt' };
      const result = await service.findAll(query);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].code).toBe('CSE');
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
      expect(repository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
          skip: 0,
          take: 20,
        }),
      );
    });

    it('should filter by search term', async () => {
      repository.findAndCount.mockResolvedValue([[mockBranch], 1]);

      const query: PaginationQueryDto = { page: 1, limit: 20, search: 'CSE' };
      await service.findAll(query);

      const callArgs = repository.findAndCount.mock.calls[0][0];
      expect(callArgs.where).toBeInstanceOf(Array);
      expect(callArgs.where).toHaveLength(2);
    });

    it('should use correct sort direction for descending', async () => {
      repository.findAndCount.mockResolvedValue([[mockBranch], 1]);

      const query: PaginationQueryDto = { page: 1, limit: 20, sort: '-createdAt' };
      await service.findAll(query);

      const callArgs = repository.findAndCount.mock.calls[0][0];
      expect(callArgs.order).toEqual({ createdAt: 'DESC' });
    });

    it('should use correct sort direction for ascending', async () => {
      repository.findAndCount.mockResolvedValue([[mockBranch], 1]);

      const query: PaginationQueryDto = { page: 1, limit: 20, sort: 'name' };
      await service.findAll(query);

      const callArgs = repository.findAndCount.mock.calls[0][0];
      expect(callArgs.order).toEqual({ name: 'ASC' });
    });

    it('should handle empty results', async () => {
      repository.findAndCount.mockResolvedValue([[], 0]);

      const query: PaginationQueryDto = { page: 1, limit: 20 };
      const result = await service.findAll(query);

      expect(result.data).toHaveLength(0);
      expect(result.meta.total).toBe(0);
    });
  });

  describe('findOne', () => {
    it('should return a branch when found', async () => {
      repository.findOneBy.mockResolvedValue(mockBranch);

      const result = await service.findOne(mockBranch.id);

      expect(result).not.toBeNull();
      expect(result!.code).toBe('CSE');
      expect(repository.findOneBy).toHaveBeenCalledWith({ id: mockBranch.id });
    });

    it('should return null when not found', async () => {
      repository.findOneBy.mockResolvedValue(null);

      const result = await service.findOne('nonexistent-id');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create and return a branch', async () => {
      const dto = { code: 'ECE', name: 'Electronics & Communication' };
      repository.create.mockReturnValue({ ...mockBranch, ...dto });
      repository.save.mockResolvedValue({ ...mockBranch, ...dto });

      const result = await service.create(dto);

      expect(result.code).toBe('ECE');
      expect(result.name).toBe('Electronics & Communication');
      expect(repository.create).toHaveBeenCalledWith(dto);
      expect(repository.save).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update and return the branch', async () => {
      repository.findOneBy.mockResolvedValue(mockBranch);
      repository.save.mockResolvedValue({ ...mockBranch, name: 'Updated Name' });

      const result = await service.update(mockBranch.id, { name: 'Updated Name' });

      expect(result.name).toBe('Updated Name');
      expect(repository.findOneBy).toHaveBeenCalledWith({ id: mockBranch.id });
    });

    it('should throw NotFoundException when branch not found', async () => {
      repository.findOneBy.mockResolvedValue(null);

      await expect(service.update('nonexistent-id', { name: 'Test' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should soft-delete a branch when no sections assigned', async () => {
      repository.findOneBy.mockResolvedValue(mockBranch);
      sectionRepo.count.mockResolvedValue(0);
      repository.softRemove.mockResolvedValue(mockBranch);

      await service.remove(mockBranch.id);

      expect(repository.findOneBy).toHaveBeenCalledWith({ id: mockBranch.id });
      expect(sectionRepo.count).toHaveBeenCalledWith({ where: { branchId: mockBranch.id } });
      expect(repository.softRemove).toHaveBeenCalledWith(mockBranch);
    });

    it('should throw ConflictException when branch has assigned sections', async () => {
      repository.findOneBy.mockResolvedValue(mockBranch);
      sectionRepo.count.mockResolvedValue(3);

      await expect(service.remove(mockBranch.id)).rejects.toThrow(ConflictException);

      expect(repository.softRemove).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when branch not found', async () => {
      repository.findOneBy.mockResolvedValue(null);

      await expect(service.remove('nonexistent-id')).rejects.toThrow(NotFoundException);
    });
  });
});
