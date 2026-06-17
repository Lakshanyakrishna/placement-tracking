import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { GroupsService } from './groups.service';
import { Group } from './entities/group.entity';
import { Enrollment } from '../enrollments/entities/enrollment.entity';

function createMockRepository() {
  return {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(),
  };
}

const mockSection = {
  id: 'section-1',
  code: 'A',
  branchId: 'branch-1',
  academicPeriodId: 'period-1',
  mentorUserId: null,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
  branch: { id: 'branch-1', code: 'CSE', name: 'Computer Science & Engineering', createdAt: new Date('2025-01-01'), updatedAt: new Date('2025-01-01') },
};

const mockTeamLeader = {
  id: 'user-1',
  email: 'leader@example.com',
  name: 'John Doe',
  passwordHash: 'hash',
  contactPhone: null,
  isActive: true,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
};

const mockGroup: Group = {
  id: 'group-1',
  sectionId: 'section-1',
  name: 'Group Alpha',
  teamLeaderUserId: 'user-1',
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
  section: mockSection,
  teamLeader: mockTeamLeader,
} as Group;

describe('GroupsService', () => {
  let service: GroupsService;
  let groupRepo: ReturnType<typeof createMockRepository>;
  let enrollmentRepo: ReturnType<typeof createMockRepository>;

  beforeEach(async () => {
    groupRepo = createMockRepository();
    enrollmentRepo = createMockRepository();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GroupsService,
        {
          provide: getRepositoryToken(Group),
          useValue: groupRepo,
        },
        {
          provide: getRepositoryToken(Enrollment),
          useValue: enrollmentRepo,
        },
      ],
    }).compile();

    service = module.get<GroupsService>(GroupsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated groups', async () => {
      const qb = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockGroup], 1]),
      };
      groupRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findAll({ page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('Group Alpha');
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
    });

    it('should apply search filter on name', async () => {
      const qb = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockGroup], 1]),
      };
      groupRepo.createQueryBuilder.mockReturnValue(qb);

      await service.findAll({ search: 'Alpha' });

      expect(qb.where).toHaveBeenCalledWith('group.name ILIKE :search', { search: '%Alpha%' });
    });

    it('should return empty data when no groups exist', async () => {
      const qb = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };
      groupRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findAll({});

      expect(result.data).toHaveLength(0);
      expect(result.meta.total).toBe(0);
    });
  });

  describe('findOne', () => {
    it('should return a group by id', async () => {
      groupRepo.findOne.mockResolvedValue(mockGroup);

      const result = await service.findOne('group-1');

      expect(result.id).toBe('group-1');
      expect(result.name).toBe('Group Alpha');
      expect(result.sectionCode).toBe('A');
      expect(result.sectionName).toBe('Computer Science & Engineering');
      expect(result.teamLeaderName).toBe('John Doe');
    });

    it('should throw NotFoundException when group not found', async () => {
      groupRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create and return a group', async () => {
      groupRepo.create.mockReturnValue({ sectionId: 'section-1', name: 'Group Beta' });
      groupRepo.save.mockResolvedValue({ id: 'group-2', sectionId: 'section-1', name: 'Group Beta' });
      groupRepo.findOne.mockResolvedValue({ ...mockGroup, id: 'group-2', name: 'Group Beta' });

      const result = await service.create({ sectionId: 'section-1', name: 'Group Beta' });

      expect(result.id).toBe('group-2');
      expect(groupRepo.create).toHaveBeenCalledWith({ sectionId: 'section-1', name: 'Group Beta' });
    });
  });

  describe('update', () => {
    it('should update and return the group', async () => {
      groupRepo.findOne.mockResolvedValueOnce(mockGroup);
      groupRepo.save.mockResolvedValue({ ...mockGroup, name: 'Group Updated' });
      groupRepo.findOne.mockResolvedValueOnce({ ...mockGroup, name: 'Group Updated' });

      const result = await service.update('group-1', { name: 'Group Updated' });

      expect(result.name).toBe('Group Updated');
    });

    it('should throw NotFoundException when updating nonexistent group', async () => {
      groupRepo.findOne.mockResolvedValue(null);

      await expect(service.update('nonexistent', { name: 'New' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove a group', async () => {
      groupRepo.findOne.mockResolvedValue(mockGroup);
      groupRepo.remove.mockResolvedValue(mockGroup);

      await service.remove('group-1');

      expect(groupRepo.remove).toHaveBeenCalledWith(mockGroup);
    });

    it('should throw NotFoundException when removing nonexistent group', async () => {
      groupRepo.findOne.mockResolvedValue(null);

      await expect(service.remove('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findStudentsByGroup', () => {
    it('should return students for a group', async () => {
      const mockEnrollments = [
        {
          id: 'enr-1',
          userId: 'stu-1',
          rollNumber: 'R001',
          groupId: 'group-1',
          user: {
            id: 'stu-1',
            name: 'Alice',
            email: 'alice@example.com',
          },
        },
        {
          id: 'enr-2',
          userId: 'stu-2',
          rollNumber: 'R002',
          groupId: 'group-1',
          user: {
            id: 'stu-2',
            name: 'Bob',
            email: 'bob@example.com',
          },
        },
      ];
      enrollmentRepo.find.mockResolvedValue(mockEnrollments);

      const result = await service.findStudentsByGroup('group-1');

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ id: 'stu-1', name: 'Alice', email: 'alice@example.com', rollNumber: 'R001' });
      expect(result[1]).toEqual({ id: 'stu-2', name: 'Bob', email: 'bob@example.com', rollNumber: 'R002' });
    });

    it('should return empty array when no students in group', async () => {
      enrollmentRepo.find.mockResolvedValue([]);

      const result = await service.findStudentsByGroup('group-1');

      expect(result).toHaveLength(0);
    });
  });
});
