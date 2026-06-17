import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { QueryFailedError } from 'typeorm';
import { SectionsService } from './sections.service';
import { Section } from './entities/section.entity';
import { Group } from '../groups/entities/group.entity';
import { Enrollment } from '../enrollments/entities/enrollment.entity';
import { CreateSectionDto } from './dto/create-section.dto';
import { UpdateSectionDto } from './dto/update-section.dto';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

function createMockRepository() {
  return {
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    find: jest.fn(),
    findAndCount: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };
}

describe('SectionsService', () => {
  let service: SectionsService;
  let sectionRepo: ReturnType<typeof createMockRepository>;
  let groupRepo: ReturnType<typeof createMockRepository>;
  let enrollmentRepo: ReturnType<typeof createMockRepository>;

  beforeEach(async () => {
    sectionRepo = createMockRepository();
    groupRepo = createMockRepository();
    enrollmentRepo = createMockRepository();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SectionsService,
        { provide: getRepositoryToken(Section), useValue: sectionRepo },
        { provide: getRepositoryToken(Group), useValue: groupRepo },
        { provide: getRepositoryToken(Enrollment), useValue: enrollmentRepo },
      ],
    }).compile();

    service = module.get<SectionsService>(SectionsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated sections with relations', async () => {
      const mockSections = [
        {
          id: '1',
          code: 'A',
          branch: { name: 'CSE' },
          academicPeriod: { label: '2025' },
          mentor: { name: 'John' },
          academicPeriodId: 'p1',
          branchId: 'b1',
          mentorUserId: 'm1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ] as unknown as Section[];
      sectionRepo.findAndCount.mockResolvedValue([mockSections, 1]);

      const query: PaginationQueryDto = { page: 1, limit: 20, sort: '-createdAt' };
      const result = await service.findAll(query);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('1');
      expect(result.data[0].branchName).toBe('CSE');
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
      expect(sectionRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          relations: { branch: true, academicPeriod: true, mentor: true },
          skip: 0,
          take: 20,
        }),
      );
    });

    it('should apply search filter on code field', async () => {
      sectionRepo.findAndCount.mockResolvedValue([[], 0]);
      const query: PaginationQueryDto = { page: 1, limit: 20, sort: '-createdAt', search: 'A' };

      await service.findAll(query);

      expect(sectionRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { code: expect.any(Object) },
        }),
      );
    });

    it('should apply sorting from query', async () => {
      sectionRepo.findAndCount.mockResolvedValue([[], 0]);
      const query: PaginationQueryDto = { page: 1, limit: 20, sort: 'code' };

      await service.findAll(query);

      expect(sectionRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          order: { code: 'ASC' },
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a section with relations when found', async () => {
      const mockSection = {
        id: '1',
        code: 'A',
        branch: { name: 'CSE' },
        academicPeriod: { label: '2025' },
        mentor: { name: 'John' },
        academicPeriodId: 'p1',
        branchId: 'b1',
        mentorUserId: 'm1',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as Section;
      sectionRepo.findOne.mockResolvedValue(mockSection);

      const result = await service.findOne('1');

      expect(result).toBeDefined();
      expect(result!.id).toBe('1');
      expect(result!.branchName).toBe('CSE');
      expect(sectionRepo.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
        relations: { branch: true, academicPeriod: true, mentor: true },
      });
    });

    it('should return null when section is not found', async () => {
      sectionRepo.findOne.mockResolvedValue(null);

      const result = await service.findOne('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create and return a new section', async () => {
      const dto: CreateSectionDto = {
        academicPeriodId: 'p1',
        branchId: 'b1',
        code: 'A',
        mentorUserId: null,
      };
      const savedSection = {
        id: '1',
        ...dto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      sectionRepo.create.mockReturnValue(dto);
      sectionRepo.save.mockResolvedValue(savedSection);

      const result = await service.create(dto);

      expect(result).toBeDefined();
      expect(result.id).toBe('1');
      expect(result.code).toBe('A');
      expect(sectionRepo.create).toHaveBeenCalledWith(dto);
      expect(sectionRepo.save).toHaveBeenCalledWith(dto);
    });

    it('should throw ConflictException on unique constraint violation', async () => {
      const dto: CreateSectionDto = {
        academicPeriodId: 'p1',
        branchId: 'b1',
        code: 'A',
        mentorUserId: null,
      };
      sectionRepo.create.mockReturnValue(dto);
      const queryError = new QueryFailedError('INSERT INTO', [], { code: '23505' } as any);
      sectionRepo.save.mockRejectedValue(queryError);

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });

    it('should rethrow non-unique errors from save', async () => {
      const dto: CreateSectionDto = {
        academicPeriodId: 'p1',
        branchId: 'b1',
        code: 'A',
        mentorUserId: null,
      };
      sectionRepo.create.mockReturnValue(dto);
      const genericError = new Error('database connection failed');
      sectionRepo.save.mockRejectedValue(genericError);

      await expect(service.create(dto)).rejects.toThrow(Error);
    });
  });

  describe('update', () => {
    it('should update and return the section', async () => {
      const existingSection = { id: '1', code: 'A' } as Section;
      sectionRepo.findOneBy.mockResolvedValue(existingSection);
      const updatedSection = { ...existingSection, code: 'B' } as Section;
      sectionRepo.save.mockResolvedValue(updatedSection);

      const dto: UpdateSectionDto = { code: 'B' };
      const result = await service.update('1', dto);

      expect(result).toBeDefined();
      expect(result.code).toBe('B');
      expect(sectionRepo.findOneBy).toHaveBeenCalledWith({ id: '1' });
      expect(sectionRepo.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when section to update is not found', async () => {
      sectionRepo.findOneBy.mockResolvedValue(null);

      await expect(service.update('nonexistent', {} as UpdateSectionDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should delete an existing section', async () => {
      const section = { id: '1' } as Section;
      sectionRepo.findOneBy.mockResolvedValue(section);
      sectionRepo.remove.mockResolvedValue(section);

      await service.remove('1');

      expect(sectionRepo.findOneBy).toHaveBeenCalledWith({ id: '1' });
      expect(sectionRepo.remove).toHaveBeenCalledWith(section);
    });

    it('should throw NotFoundException when section to remove is not found', async () => {
      sectionRepo.findOneBy.mockResolvedValue(null);

      await expect(service.remove('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findGroupsBySection', () => {
    it('should return groups for the given section', async () => {
      const mockGroups = [
        { id: 'g1', sectionId: '1', name: 'Group 1', teamLeaderUserId: null } as Group,
      ];
      groupRepo.find.mockResolvedValue(mockGroups);

      const result = await service.findGroupsBySection('1');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('g1');
      expect(groupRepo.find).toHaveBeenCalledWith({ where: { sectionId: '1' } });
    });

    it('should return empty array when no groups exist', async () => {
      groupRepo.find.mockResolvedValue([]);

      const result = await service.findGroupsBySection('1');

      expect(result).toEqual([]);
    });
  });

  describe('findStudentsBySection', () => {
    it('should return students with user info for the given section', async () => {
      const mockEnrollments = [
        {
          id: 'e1',
          rollNumber: 'RN001',
          user: { id: 'u1', name: 'John', email: 'john@test.com' },
        },
        {
          id: 'e2',
          rollNumber: null,
          user: { id: 'u2', name: 'Jane', email: 'jane@test.com' },
        },
      ];
      enrollmentRepo.find.mockResolvedValue(mockEnrollments as any);

      const result = await service.findStudentsBySection('1');

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'e1',
        name: 'John',
        email: 'john@test.com',
        rollNumber: 'RN001',
      });
      expect(result[1]).toEqual({
        id: 'e2',
        name: 'Jane',
        email: 'jane@test.com',
        rollNumber: null,
      });
      expect(enrollmentRepo.find).toHaveBeenCalledWith({
        where: { sectionId: '1' },
        relations: { user: true },
      });
    });

    it('should return empty array when no enrollments exist', async () => {
      enrollmentRepo.find.mockResolvedValue([]);

      const result = await service.findStudentsBySection('1');

      expect(result).toEqual([]);
    });
  });
});
