import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException, ForbiddenException, ConflictException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ParticipationsService } from './participations.service';
import { Participation, ParticipationStatus } from './entities/participation.entity';
import { Enrollment } from '../enrollments/entities/enrollment.entity';
import { Opportunity, OpportunityState, OpportunityType } from '../opportunities/entities/opportunity.entity';
import { Group } from '../groups/entities/group.entity';

const UUID = '550e8400-e29b-41d4-a716-446655440000';

const mockOpportunity: Opportunity = {
  id: UUID, academicPeriodId: UUID, title: 'Internship', description: '',
  opportunityType: OpportunityType.INTERNSHIP, state: OpportunityState.PUBLISHED,
  createdBy: UUID, opensAt: null, closesAt: null, verificationDeadline: '7 days',
  requireProof: true, maxSubmissions: null, allowGroupSubmission: false,
  targetBranchId: null, targetSectionId: null, targetBatchId: null,
  createdAt: new Date(), updatedAt: new Date(),
  academicPeriod: undefined as never, createdByUser: undefined as never,
};

const mockEnrollment: Enrollment = {
  id: UUID, userId: UUID, academicPeriodId: UUID, branchId: UUID,
  sectionId: UUID, batchId: UUID, groupId: null, rollNumber: null,
  isActive: true, enrolledAt: new Date(), createdAt: new Date(), updatedAt: new Date(),
  user: { id: UUID, name: 'Student', email: 's@t.com' } as never,
  academicPeriod: undefined as never, branch: undefined as never,
  section: undefined as never, group: undefined as never, batch: undefined as never,
};

const mockParticipation: Participation = {
  id: UUID, opportunityId: UUID, enrollmentId: UUID,
  status: ParticipationStatus.NOT_STARTED,
  teamLeaderUserId: null, startedAt: null, submittedAt: null,
  verifiedAt: null, verifiedBy: null, notes: null,
  createdAt: new Date(), updatedAt: new Date(),
  opportunity: undefined as never, enrollment: undefined as never,
  teamLeader: undefined as never, verifier: undefined as never,
};

function createMockRepository() {
  return {
    findOneBy: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    findAndCount: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };
}

function createManagerMock() {
  return { query: jest.fn() };
}

describe('ParticipationsService', () => {
  let service: ParticipationsService;
  let repository: ReturnType<typeof createMockRepository>;
  let enrollmentRepository: ReturnType<typeof createMockRepository>;
  let opportunityRepository: ReturnType<typeof createMockRepository>;
  let groupRepository: ReturnType<typeof createMockRepository>;

  beforeEach(async () => {
    repository = createMockRepository();
    enrollmentRepository = { ...createMockRepository(), manager: createManagerMock() } as any;
    opportunityRepository = createMockRepository();
    groupRepository = createMockRepository();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ParticipationsService,
        { provide: getRepositoryToken(Participation), useValue: repository },
        { provide: getRepositoryToken(Enrollment), useValue: enrollmentRepository },
        { provide: getRepositoryToken(Opportunity), useValue: opportunityRepository },
        { provide: getRepositoryToken(Group), useValue: groupRepository },
      ],
    }).compile();

    service = module.get<ParticipationsService>(ParticipationsService);
  });

  describe('create', () => {
    it('should create a participation', async () => {
      opportunityRepository.findOneBy.mockResolvedValue(mockOpportunity);
      enrollmentRepository.findOne.mockResolvedValue(mockEnrollment);
      repository.findOne.mockResolvedValueOnce(null);
      repository.create.mockReturnValue(mockParticipation);
      repository.save.mockResolvedValue(mockParticipation);
      repository.findOne.mockResolvedValueOnce({
        ...mockParticipation,
        opportunity: mockOpportunity,
        enrollment: { ...mockEnrollment, user: { id: UUID, name: 'S', email: 's@t.com' } },
      });

      const result = await service.create({ opportunityId: UUID }, UUID);

      expect(result.status).toBe(ParticipationStatus.NOT_STARTED);
      expect(opportunityRepository.findOneBy).toHaveBeenCalledWith({ id: UUID });
      expect(enrollmentRepository.findOne).toHaveBeenCalledWith({
        where: { userId: UUID, academicPeriodId: UUID, isActive: true },
        relations: ['user'],
      });
    });

    it('should throw NotFoundException when opportunity missing', async () => {
      opportunityRepository.findOneBy.mockResolvedValue(null);

      await expect(service.create({ opportunityId: UUID }, UUID)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when opportunity is draft', async () => {
      opportunityRepository.findOneBy.mockResolvedValue({ ...mockOpportunity, state: OpportunityState.DRAFT });

      await expect(service.create({ opportunityId: UUID }, UUID)).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException when no active enrollment', async () => {
      opportunityRepository.findOneBy.mockResolvedValue(mockOpportunity);
      enrollmentRepository.findOne.mockResolvedValue(null);

      await expect(service.create({ opportunityId: UUID }, UUID)).rejects.toThrow(ForbiddenException);
    });

    it('should throw ConflictException when already started', async () => {
      opportunityRepository.findOneBy.mockResolvedValue(mockOpportunity);
      enrollmentRepository.findOne.mockResolvedValue(mockEnrollment);
      repository.findOne.mockResolvedValue(mockParticipation);

      await expect(service.create({ opportunityId: UUID }, UUID)).rejects.toThrow(ConflictException);
    });
  });

  describe('findMyParticipations', () => {
    it('should return participations for current user', async () => {
      enrollmentRepository.find.mockResolvedValue([{ id: UUID }]);
      repository.findAndCount.mockResolvedValue([[{
        ...mockParticipation,
        opportunity: mockOpportunity,
        enrollment: mockEnrollment,
      }], 1]);

      const result = await service.findMyParticipations({}, UUID);

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('should return empty when no enrollments', async () => {
      enrollmentRepository.find.mockResolvedValue([]);

      const result = await service.findMyParticipations({}, UUID);

      expect(result.data).toHaveLength(0);
      expect(result.meta.total).toBe(0);
    });
  });

  describe('findOne', () => {
    it('should return a participation', async () => {
      repository.findOne.mockResolvedValue({ ...mockParticipation, opportunity: mockOpportunity });

      const result = await service.findOne(UUID);

      expect(result.status).toBe(ParticipationStatus.NOT_STARTED);
    });

    it('should throw NotFoundException', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateStatus', () => {
    it('should transition NOT_STARTED → IN_PROGRESS', async () => {
      repository.findOne.mockResolvedValue({
        ...mockParticipation, opportunity: mockOpportunity, enrollment: mockEnrollment,
      });
      repository.save.mockImplementation(async (e: Participation) => e);

      const result = await service.updateStatus(UUID, { status: ParticipationStatus.IN_PROGRESS }, UUID);

      expect(result.status).toBe(ParticipationStatus.IN_PROGRESS);
      expect(result.startedAt).toBeDefined();
    });

    it('should transition IN_PROGRESS → SUBMITTED', async () => {
      repository.findOne.mockResolvedValue({
        ...mockParticipation, status: ParticipationStatus.IN_PROGRESS, startedAt: new Date(),
        opportunity: mockOpportunity, enrollment: mockEnrollment,
      });
      repository.save.mockImplementation(async (e: Participation) => e);

      const result = await service.updateStatus(UUID, { status: ParticipationStatus.SUBMITTED }, UUID);

      expect(result.status).toBe(ParticipationStatus.SUBMITTED);
      expect(result.submittedAt).toBeDefined();
    });

    it('should set verifiedBy on VERIFIED transition', async () => {
      repository.findOne.mockResolvedValue({
        ...mockParticipation, status: ParticipationStatus.SUBMITTED, startedAt: new Date(), submittedAt: new Date(),
        opportunity: mockOpportunity, enrollment: mockEnrollment,
      });
      repository.save.mockImplementation(async (e: Participation) => e);

      const result = await service.updateStatus(UUID, { status: ParticipationStatus.VERIFIED }, 'mentor-1');

      expect(result.status).toBe(ParticipationStatus.VERIFIED);
      expect(result.verifiedAt).toBeDefined();
      expect(result.verifiedBy).toBe('mentor-1');
    });

    it('should throw BadRequestException for invalid transition', async () => {
      repository.findOne.mockResolvedValue({
        ...mockParticipation, opportunity: mockOpportunity, enrollment: mockEnrollment,
      });

      await expect(
        service.updateStatus(UUID, { status: ParticipationStatus.COMPLETED }, UUID),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(
        service.updateStatus('nonexistent', { status: ParticipationStatus.IN_PROGRESS }, UUID),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByOpportunity', () => {
    it('should return participations for an opportunity', async () => {
      repository.findAndCount.mockResolvedValue([[{
        ...mockParticipation, opportunity: mockOpportunity, enrollment: mockEnrollment,
      }], 1]);

      const result = await service.findByOpportunity(UUID, {});

      expect(result.data).toHaveLength(1);
    });

    it('should handle empty results', async () => {
      repository.findAndCount.mockResolvedValue([[], 0]);

      const result = await service.findByOpportunity(UUID, {});

      expect(result.data).toHaveLength(0);
    });
  });

  describe('findByGroup', () => {
    it('should return participations for a group', async () => {
      enrollmentRepository.find.mockResolvedValue([{ id: UUID }]);
      repository.findAndCount.mockResolvedValue([[{
        ...mockParticipation, opportunity: mockOpportunity, enrollment: mockEnrollment,
      }], 1]);

      const result = await service.findByGroup(UUID, {});

      expect(result.data).toHaveLength(1);
    });

    it('should return empty when no enrollments in group', async () => {
      enrollmentRepository.find.mockResolvedValue([]);

      const result = await service.findByGroup(UUID, {});

      expect(result.data).toHaveLength(0);
    });
  });

  describe('findBySection', () => {
    it('should return participations for a section', async () => {
      enrollmentRepository.find.mockResolvedValue([{ id: UUID }]);
      repository.findAndCount.mockResolvedValue([[{
        ...mockParticipation, opportunity: mockOpportunity, enrollment: mockEnrollment,
      }], 1]);

      const result = await service.findBySection(UUID, {});

      expect(result.data).toHaveLength(1);
    });

    it('should return empty when no enrollments in section', async () => {
      enrollmentRepository.find.mockResolvedValue([]);

      const result = await service.findBySection(UUID, {});

      expect(result.data).toHaveLength(0);
    });
  });

  describe('findByMentor', () => {
    it('should return participations for a mentor', async () => {
      (enrollmentRepository as any).manager.query.mockResolvedValue([{ id: UUID }]);
      enrollmentRepository.find.mockResolvedValue([{ id: UUID }]);
      repository.findAndCount.mockResolvedValue([[{
        ...mockParticipation, opportunity: mockOpportunity, enrollment: mockEnrollment,
      }], 1]);

      const result = await service.findByMentor(UUID, {});

      expect(result.data).toHaveLength(1);
    });

    it('should return empty when mentor has no sections', async () => {
      (enrollmentRepository as any).manager.query.mockResolvedValue([]);

      const result = await service.findByMentor(UUID, {});

      expect(result.data).toHaveLength(0);
    });
  });
});
