import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual, IsNull, In } from 'typeorm';
import { IamService } from './iam.service';
import { RoleAssignment, UserRole, RoleScopeType } from './entities/role-assignment.entity';
import { Section } from '../sections/entities/section.entity';
import { Group } from '../groups/entities/group.entity';

const mockQueryBuilder = {
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  getMany: jest.fn(),
};

function createMockRepository() {
  return {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
  };
}

describe('IamService', () => {
  let service: IamService;
  let roleAssignmentRepo: jest.Mocked<Partial<Repository<RoleAssignment>>>;
  let sectionRepo: jest.Mocked<Partial<Repository<Section>>>;
  let groupRepo: jest.Mocked<Partial<Repository<Group>>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IamService,
        { provide: getRepositoryToken(RoleAssignment), useValue: createMockRepository() },
        { provide: getRepositoryToken(Section), useValue: createMockRepository() },
        { provide: getRepositoryToken(Group), useValue: createMockRepository() },
      ],
    }).compile();

    service = module.get<IamService>(IamService);
    roleAssignmentRepo = module.get(getRepositoryToken(RoleAssignment));
    sectionRepo = module.get(getRepositoryToken(Section));
    groupRepo = module.get(getRepositoryToken(Group));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findActiveRolesByUser', () => {
    it('should return active role assignments', async () => {
      const mockAssignments = [{ id: '1', userId: 'user-1', role: UserRole.MENTOR } as RoleAssignment];
      (roleAssignmentRepo.find as jest.Mock).mockResolvedValue(mockAssignments);

      const result = await service.findActiveRolesByUser('user-1');

      expect(result).toEqual(mockAssignments);
      expect(roleAssignmentRepo.find).toHaveBeenCalledTimes(1);
    });
  });

  describe('findMentorSections', () => {
    it('should return sections for mentor role assignments', async () => {
      const now = new Date();
      jest.useFakeTimers().setSystemTime(now);

      const mockAssignments = [
        { id: '1', userId: 'user-1', role: UserRole.MENTOR, scopeType: RoleScopeType.SECTION, scopeId: 'section-1' } as RoleAssignment,
        { id: '2', userId: 'user-1', role: UserRole.MENTOR, scopeType: RoleScopeType.SECTION, scopeId: 'section-2' } as RoleAssignment,
      ];
      (roleAssignmentRepo.find as jest.Mock).mockResolvedValue(mockAssignments);

      const mockSections = [
        { id: 'section-1', code: 'A', branch: { code: 'CSE', name: 'CSE' } } as Section,
        { id: 'section-2', code: 'B', branch: { code: 'ECE', name: 'ECE' } } as Section,
      ];
      (sectionRepo.find as jest.Mock).mockResolvedValue(mockSections);

      const result = await service.findMentorSections('user-1');

      expect(result).toEqual(mockSections);
      expect(roleAssignmentRepo.find).toHaveBeenCalledWith({
        where: [
          { userId: 'user-1', role: UserRole.MENTOR, scopeType: RoleScopeType.SECTION, validFrom: LessThanOrEqual(now), validTo: IsNull() },
          { userId: 'user-1', role: UserRole.MENTOR, scopeType: RoleScopeType.SECTION, validFrom: LessThanOrEqual(now), validTo: MoreThanOrEqual(now) },
        ],
      });
      expect(sectionRepo.find).toHaveBeenCalledWith({
        where: { id: In(['section-1', 'section-2']) },
        relations: ['branch'],
      });

      jest.useRealTimers();
    });

    it('should return empty array when no assignments found', async () => {
      (roleAssignmentRepo.find as jest.Mock).mockResolvedValue([]);

      const result = await service.findMentorSections('user-1');

      expect(result).toEqual([]);
      expect(sectionRepo.find).not.toHaveBeenCalled();
    });

    it('should return empty array when assignments have null scopeIds', async () => {
      const mockAssignments = [
        { id: '1', userId: 'user-1', role: UserRole.MENTOR, scopeType: RoleScopeType.SECTION, scopeId: null } as RoleAssignment,
      ];
      (roleAssignmentRepo.find as jest.Mock).mockResolvedValue(mockAssignments);

      const result = await service.findMentorSections('user-1');

      expect(result).toEqual([]);
      expect(sectionRepo.find).not.toHaveBeenCalled();
    });
  });

  describe('findTeamLeaderGroups', () => {
    it('should return groups for team leader role assignments', async () => {
      const now = new Date();
      jest.useFakeTimers().setSystemTime(now);

      const mockAssignments = [
        { id: '1', userId: 'user-2', role: UserRole.TEAM_LEADER, scopeType: RoleScopeType.GROUP, scopeId: 'group-1' } as RoleAssignment,
      ];
      (roleAssignmentRepo.find as jest.Mock).mockResolvedValue(mockAssignments);

      const mockGroups = [
        { id: 'group-1', name: 'Group A', section: { code: 'A' } } as Group,
      ];
      (groupRepo.find as jest.Mock).mockResolvedValue(mockGroups);

      const result = await service.findTeamLeaderGroups('user-2');

      expect(result).toEqual(mockGroups);
      expect(roleAssignmentRepo.find).toHaveBeenCalledWith({
        where: [
          { userId: 'user-2', role: UserRole.TEAM_LEADER, scopeType: RoleScopeType.GROUP, validFrom: LessThanOrEqual(now), validTo: IsNull() },
          { userId: 'user-2', role: UserRole.TEAM_LEADER, scopeType: RoleScopeType.GROUP, validFrom: LessThanOrEqual(now), validTo: MoreThanOrEqual(now) },
        ],
      });
      expect(groupRepo.find).toHaveBeenCalledWith({
        where: { id: In(['group-1']) },
        relations: ['section'],
      });

      jest.useRealTimers();
    });

    it('should return empty array when no assignments found', async () => {
      (roleAssignmentRepo.find as jest.Mock).mockResolvedValue([]);

      const result = await service.findTeamLeaderGroups('user-2');

      expect(result).toEqual([]);
      expect(groupRepo.find).not.toHaveBeenCalled();
    });
  });
});
