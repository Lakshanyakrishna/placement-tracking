import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { OpportunitiesService } from './opportunities.service';
import { Opportunity, OpportunityState, OpportunityType } from './entities/opportunity.entity';
import { OpportunityTarget, TargetType } from './entities/opportunity-target.entity';
import { IamService } from '../iam/iam.service';

const adminUser = { id: 'user-1', roles: [{ role: 'admin' }] };

const mockTarget: OpportunityTarget = {
  id: 'tgt-1',
  opportunityId: 'opp-1',
  targetType: TargetType.BRANCH,
  branchId: 'branch-1',
  sectionId: null,
  groupId: null,
  batchId: null,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
  opportunity: undefined as never,
  branch: undefined as never,
  section: undefined as never,
  group: undefined as never,
  batch: undefined as never,
};

function createMockRepository() {
  return {
    findAndCount: jest.fn(),
    findOneBy: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    softRemove: jest.fn(),
    delete: jest.fn(),
  };
}

function freshMock(): Opportunity {
  return {
    id: 'opp-1',
    academicPeriodId: 'ap-1',
    title: 'Summer Internship',
    description: 'A great opportunity',
    applicationLink: null, meetingLink: null,
    opportunityType: OpportunityType.INTERNSHIP,
    state: OpportunityState.DRAFT,
    createdBy: 'user-1',
    opensAt: null,
    closesAt: null,
    verificationDeadline: '7 days',
    requireProof: true,
    maxSubmissions: null,
    allowGroupSubmission: false,
    targetBranchId: null,
    targetSectionId: null,
    targetBatchId: null,
    targetGroupId: null,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    deletedAt: null,
    academicPeriod: undefined as never,
    createdByUser: undefined as never,
  };
}

describe('OpportunitiesService', () => {
  let service: OpportunitiesService;
  let repository: ReturnType<typeof createMockRepository>;
  let targetRepository: ReturnType<typeof createMockRepository>;

  beforeEach(async () => {
    repository = createMockRepository();
    targetRepository = createMockRepository();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OpportunitiesService,
        { provide: getRepositoryToken(Opportunity), useValue: repository },
        { provide: getRepositoryToken(OpportunityTarget), useValue: targetRepository },
        {
          provide: DataSource,
          useValue: { query: jest.fn().mockResolvedValue([]) },
        },
        {
          provide: IamService,
          useValue: { findTeamLeaderGroups: jest.fn().mockResolvedValue([]), findMentorSections: jest.fn().mockResolvedValue([]) },
        },
      ],
    }).compile();

    service = module.get<OpportunitiesService>(OpportunitiesService);
  });

  describe('create', () => {
    it('should create a draft opportunity', async () => {
      const dto = {
        title: 'New Internship',
        opportunityType: OpportunityType.INTERNSHIP,
        academicPeriodId: 'ap-1',
      };
      repository.create.mockReturnValue({ ...freshMock(), ...dto });
      repository.save.mockResolvedValue({ ...freshMock(), ...dto });

      const result = await service.create(dto, adminUser);

      expect(result.title).toBe('New Internship');
      expect(result.state).toBe(OpportunityState.DRAFT);
      expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({ createdBy: 'user-1', state: OpportunityState.DRAFT }));
      expect(repository.save).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return paginated results without filters', async () => {
      repository.findAndCount.mockResolvedValue([[freshMock()], 1]);

      const query = { page: 1, limit: 20, sort: '-createdAt' };
      const result = await service.findAll(query);

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(repository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ where: {}, skip: 0, take: 20 }),
      );
    });

    it('should filter by type', async () => {
      repository.findAndCount.mockResolvedValue([[freshMock()], 1]);

      await service.findAll({ type: OpportunityType.INTERNSHIP });

      const callArgs = repository.findAndCount.mock.calls[0][0];
      expect(callArgs.where.opportunityType).toBe(OpportunityType.INTERNSHIP);
    });

    it('should filter by status', async () => {
      repository.findAndCount.mockResolvedValue([[freshMock()], 1]);

      await service.findAll({ status: OpportunityState.DRAFT });

      const callArgs = repository.findAndCount.mock.calls[0][0];
      expect(callArgs.where.state).toBe(OpportunityState.DRAFT);
    });

    it('should search by title', async () => {
      repository.findAndCount.mockResolvedValue([[freshMock()], 1]);

      await service.findAll({ search: 'Internship' });

      const callArgs = repository.findAndCount.mock.calls[0][0];
      expect(callArgs.where).toBeInstanceOf(Array);
      expect(callArgs.where).toHaveLength(2);
    });

    it('should handle empty results', async () => {
      repository.findAndCount.mockResolvedValue([[], 0]);

      const result = await service.findAll({});

      expect(result.data).toHaveLength(0);
      expect(result.meta.total).toBe(0);
    });
  });

  describe('findOne', () => {
    it('should return opportunity with targets', async () => {
      repository.findOne.mockResolvedValue(freshMock());
      targetRepository.find.mockResolvedValue([mockTarget]);

      const result = await service.findOne('opp-1');

      expect(result.id).toBe('opp-1');
      expect(result.targets).toHaveLength(1);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'opp-1' },
        relations: ['academicPeriod', 'createdByUser'],
      });
      expect(targetRepository.find).toHaveBeenCalledWith({
        where: { opportunityId: 'opp-1' },
        relations: ['branch', 'section', 'group', 'batch'],
      });
    });

    it('should throw NotFoundException when not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update and return the opportunity', async () => {
      repository.findOneBy.mockResolvedValue(freshMock());
      repository.save.mockResolvedValue({ ...freshMock(), title: 'Updated Title' });

      const result = await service.update('opp-1', { title: 'Updated Title' }, adminUser);

      expect(result.title).toBe('Updated Title');
      expect(repository.findOneBy).toHaveBeenCalledWith({ id: 'opp-1' });
    });

    it('should throw NotFoundException when not found', async () => {
      repository.findOneBy.mockResolvedValue(null);

      await expect(service.update('nonexistent', { title: 'Test' }, adminUser)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should soft-delete a draft opportunity', async () => {
      repository.findOneBy.mockResolvedValue(freshMock());
      repository.softRemove.mockResolvedValue(freshMock());

      await service.remove('opp-1', adminUser);

      expect(repository.findOneBy).toHaveBeenCalledWith({ id: 'opp-1' });
      expect(repository.softRemove).toHaveBeenCalledWith(freshMock());
    });

    it('should throw ConflictException when not draft', async () => {
      repository.findOneBy.mockResolvedValue({ ...freshMock(), state: OpportunityState.PUBLISHED });

      await expect(service.remove('opp-1', adminUser)).rejects.toThrow(ConflictException);
      expect(repository.softRemove).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when not found', async () => {
      repository.findOneBy.mockResolvedValue(null);

      await expect(service.remove('nonexistent', adminUser)).rejects.toThrow(NotFoundException);
    });
  });

  describe('publish', () => {
    it('should publish a draft opportunity', async () => {
      repository.findOneBy.mockResolvedValue(freshMock());
      repository.save.mockResolvedValue({ ...freshMock(), state: OpportunityState.PUBLISHED });

      const result = await service.publish('opp-1', adminUser);

      expect(result.state).toBe(OpportunityState.PUBLISHED);
    });

    it('should throw BadRequestException when already published', async () => {
      repository.findOneBy.mockResolvedValue({ ...freshMock(), state: OpportunityState.PUBLISHED });

      await expect(service.publish('opp-1', adminUser)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when not found', async () => {
      repository.findOneBy.mockResolvedValue(null);

      await expect(service.publish('nonexistent', adminUser)).rejects.toThrow(NotFoundException);
    });
  });

  describe('archive', () => {
    it('should archive a published opportunity', async () => {
      repository.findOneBy.mockResolvedValue({ ...freshMock(), state: OpportunityState.PUBLISHED });
      repository.save.mockResolvedValue({ ...freshMock(), state: OpportunityState.ARCHIVED });

      const result = await service.archive('opp-1', adminUser);

      expect(result.state).toBe(OpportunityState.ARCHIVED);
    });

    it('should throw BadRequestException when already archived', async () => {
      repository.findOneBy.mockResolvedValue({ ...freshMock(), state: OpportunityState.ARCHIVED });

      await expect(service.archive('opp-1', adminUser)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when draft', async () => {
      repository.findOneBy.mockResolvedValue(freshMock());

      await expect(service.archive('opp-1', adminUser)).rejects.toThrow(BadRequestException);
    });
  });

  describe('setTargets', () => {
    it('should replace all targets', async () => {
      repository.findOneBy.mockResolvedValue(freshMock());
      targetRepository.delete.mockResolvedValue({ affected: 1 });
      targetRepository.create.mockImplementation((data: Record<string, unknown>) => data as unknown as OpportunityTarget);
      targetRepository.save.mockResolvedValue([{ id: 'new-tgt-1' }]);
      targetRepository.find.mockResolvedValue([mockTarget]);

      const dto = {
        targets: [{ targetType: TargetType.BRANCH, branchId: 'branch-1' }],
      };

      const result = await service.setTargets('opp-1', dto);

      expect(result).toHaveLength(1);
      expect(targetRepository.delete).toHaveBeenCalledWith({ opportunityId: 'opp-1' });
      expect(targetRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ targetType: TargetType.BRANCH, branchId: 'branch-1' }),
      );
    });

    it('should throw NotFoundException when opportunity not found', async () => {
      repository.findOneBy.mockResolvedValue(null);

      await expect(
        service.setTargets('nonexistent', { targets: [{ targetType: TargetType.ALL }] }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getTargets', () => {
    it('should return targets for an opportunity', async () => {
      repository.findOneBy.mockResolvedValue(freshMock());
      targetRepository.find.mockResolvedValue([mockTarget]);

      const result = await service.getTargets('opp-1');

      expect(result).toHaveLength(1);
      expect(result[0].targetType).toBe(TargetType.BRANCH);
    });

    it('should throw NotFoundException when opportunity not found', async () => {
      repository.findOneBy.mockResolvedValue(null);

      await expect(service.getTargets('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });
});
