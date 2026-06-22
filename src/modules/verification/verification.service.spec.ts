import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { VerificationService } from './verification.service';
import { VerificationLog, VerificationAction } from './entities/verification-log.entity';
import { Submission } from '../submissions/entities/submission.entity';
import { SubmissionFile } from '../submissions/entities/submission-file.entity';
import { Participation, ParticipationStatus } from '../participations/entities/participation.entity';
import { Enrollment } from '../enrollments/entities/enrollment.entity';
import { IamService } from '../iam/iam.service';

const UUID = '550e8400-e29b-41d4-a716-446655440000';
const mockUser = { id: UUID, roles: [{ role: 'admin' }], isStudent: false };

function createRepoMock() {
  return {
    findOneBy: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    findAndCount: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    count: jest.fn(),
  };
}

describe('VerificationService', () => {
  let service: VerificationService;
  let logRepo: ReturnType<typeof createRepoMock>;
  let submissionRepo: ReturnType<typeof createRepoMock>;
  let submissionFileRepo: ReturnType<typeof createRepoMock>;
  let participationRepo: ReturnType<typeof createRepoMock>;
  let enrollmentRepo: ReturnType<typeof createRepoMock>;
  let iamService: jest.Mocked<IamService>;

  beforeEach(async () => {
    logRepo = createRepoMock();
    submissionRepo = createRepoMock();
    submissionFileRepo = createRepoMock();
    participationRepo = createRepoMock();
    enrollmentRepo = createRepoMock();
    iamService = { findTeamLeaderGroups: jest.fn(), findMentorSections: jest.fn() } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VerificationService,
        { provide: getRepositoryToken(VerificationLog), useValue: logRepo },
        { provide: getRepositoryToken(Submission), useValue: submissionRepo },
        { provide: getRepositoryToken(SubmissionFile), useValue: submissionFileRepo },
        { provide: getRepositoryToken(Participation), useValue: participationRepo },
        { provide: getRepositoryToken(Enrollment), useValue: enrollmentRepo },
        { provide: IamService, useValue: iamService },
      ],
    }).compile();

    service = module.get<VerificationService>(VerificationService);
  });

  describe('findPending', () => {
    it('should return pending submissions for team leader', async () => {
      iamService.findTeamLeaderGroups.mockResolvedValue([{ id: UUID } as any]);
      enrollmentRepo.find.mockResolvedValue([{ id: UUID }]);
      participationRepo.find.mockResolvedValue([{
        id: UUID,
        opportunityId: UUID,
        enrollmentId: UUID,
        status: ParticipationStatus.SUBMITTED,
        opportunity: { title: 'Internship' },
        enrollment: { user: { name: 'Student', email: 's@t.com' } },
      }]);
      submissionRepo.find.mockResolvedValue([{
        id: UUID,
        participationId: UUID,
        submittedAt: new Date(),
        description: 'My work',
      }]);
      submissionFileRepo.count.mockResolvedValue(2);

      const result = await service.findPending(UUID);

      expect(result).toHaveLength(1);
      expect(result[0].submissionId).toBe(UUID);
      expect(result[0].opportunityTitle).toBe('Internship');
      expect(result[0].fileCount).toBe(2);
    });

    it('should return empty when no groups', async () => {
      iamService.findTeamLeaderGroups.mockResolvedValue([]);

      const result = await service.findPending(UUID);

      expect(result).toEqual([]);
    });

    it('should return empty when no enrollments in groups', async () => {
      iamService.findTeamLeaderGroups.mockResolvedValue([{ id: UUID } as any]);
      enrollmentRepo.find.mockResolvedValue([]);

      const result = await service.findPending(UUID);

      expect(result).toEqual([]);
    });
  });

  describe('findByGroup', () => {
    it('should return verification logs for a group', async () => {
      enrollmentRepo.find.mockResolvedValue([{ id: UUID }]);
      participationRepo.find.mockResolvedValue([{ id: UUID }]);
      submissionRepo.find.mockResolvedValue([{ id: UUID }]);
      logRepo.findAndCount.mockResolvedValue([[{
        id: UUID, submissionId: UUID, action: VerificationAction.VERIFIED, actorUserId: UUID, reason: null, createdAt: new Date(),
        actor: { name: 'TL' }, submission: { participation: { status: 'verified' } },
      }], 1]);

      const result = await service.findByGroup(UUID, {}, mockUser);

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('should return empty when no enrollments', async () => {
      enrollmentRepo.find.mockResolvedValue([]);

      const result = await service.findByGroup(UUID, {}, mockUser);

      expect(result.data).toHaveLength(0);
    });
  });

  describe('findBySection', () => {
    it('should return verification logs for a section', async () => {
      enrollmentRepo.find.mockResolvedValue([{ id: UUID }]);
      participationRepo.find.mockResolvedValue([{ id: UUID }]);
      submissionRepo.find.mockResolvedValue([{ id: UUID }]);
      logRepo.findAndCount.mockResolvedValue([[{
        id: UUID, submissionId: UUID, action: VerificationAction.REJECTED, actorUserId: UUID, reason: 'No proof', createdAt: new Date(),
        actor: { name: 'TL' }, submission: { participation: { status: 'rejected' } },
      }], 1]);

      const result = await service.findBySection(UUID, {}, mockUser);

      expect(result.data).toHaveLength(1);
    });
  });

  describe('findBySubmission', () => {
    it('should return logs for a submission', async () => {
      submissionRepo.findOne.mockResolvedValue({ id: UUID, participationId: UUID, participation: { enrollment: { groupId: UUID, sectionId: UUID } } } as any);
      logRepo.find.mockResolvedValue([{
        id: UUID, submissionId: UUID, action: VerificationAction.VERIFIED, actorUserId: UUID, reason: null, createdAt: new Date(),
        actor: { name: 'TL' }, submission: { participation: { status: 'verified' } },
      }]);

      const result = await service.findBySubmission(UUID, mockUser);

      expect(result.data).toHaveLength(1);
    });

    it('should throw NotFoundException when submission missing', async () => {
      submissionRepo.findOne.mockResolvedValue(null);

      await expect(service.findBySubmission('nonexistent', mockUser)).rejects.toThrow(NotFoundException);
    });
  });

  describe('approve', () => {
    it('should approve a submission', async () => {
      submissionRepo.findOneBy.mockResolvedValue({ id: UUID, participationId: UUID } as any);
      participationRepo.findOne.mockResolvedValue({
        id: UUID, status: ParticipationStatus.SUBMITTED, teamLeaderUserId: UUID,
        enrollment: {},
      });
      logRepo.findOne.mockResolvedValueOnce(null);
      logRepo.create.mockReturnValue({ id: UUID });
      logRepo.save.mockResolvedValue({ id: UUID });
      participationRepo.save.mockResolvedValue({});
      logRepo.findOne.mockResolvedValueOnce({
        id: UUID, submissionId: UUID, action: VerificationAction.VERIFIED, actorUserId: UUID, reason: null, createdAt: new Date(),
        actor: { name: 'TL' }, submission: { participation: { status: 'verified' } },
      });

      const result = await service.approve(UUID, UUID);

      expect(result.action).toBe(VerificationAction.VERIFIED);
      expect(participationRepo.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when submission missing', async () => {
      submissionRepo.findOneBy.mockResolvedValue(null);

      await expect(service.approve('nonexistent', UUID)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when not SUBMITTED status', async () => {
      submissionRepo.findOneBy.mockResolvedValue({ id: UUID, participationId: UUID } as any);
      participationRepo.findOne.mockResolvedValue({
        id: UUID, status: ParticipationStatus.IN_PROGRESS, teamLeaderUserId: UUID,
        enrollment: {},
      });

      await expect(service.approve(UUID, UUID)).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException when not team leader', async () => {
      submissionRepo.findOneBy.mockResolvedValue({ id: UUID, participationId: UUID } as any);
      participationRepo.findOne.mockResolvedValue({
        id: UUID, status: ParticipationStatus.SUBMITTED, teamLeaderUserId: 'other-user',
        enrollment: {},
      });

      await expect(service.approve(UUID, UUID)).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException on duplicate verification', async () => {
      submissionRepo.findOneBy.mockResolvedValue({ id: UUID, participationId: UUID } as any);
      participationRepo.findOne.mockResolvedValue({
        id: UUID, status: ParticipationStatus.SUBMITTED, teamLeaderUserId: UUID,
        enrollment: {},
      });
      logRepo.findOne.mockResolvedValue({ id: UUID, action: VerificationAction.VERIFIED });

      await expect(service.approve(UUID, UUID)).rejects.toThrow(BadRequestException);
    });
  });

  describe('reject', () => {
    it('should reject a submission with reason', async () => {
      submissionRepo.findOneBy.mockResolvedValue({ id: UUID, participationId: UUID } as any);
      participationRepo.findOne.mockResolvedValue({
        id: UUID, status: ParticipationStatus.SUBMITTED, teamLeaderUserId: UUID,
        enrollment: {},
      });
      logRepo.findOne.mockResolvedValueOnce(null);
      logRepo.create.mockReturnValue({ id: UUID });
      logRepo.save.mockResolvedValue({ id: UUID });
      participationRepo.save.mockResolvedValue({});
      submissionRepo.save.mockResolvedValue({});
      logRepo.findOne.mockResolvedValueOnce({
        id: UUID, submissionId: UUID, action: VerificationAction.REJECTED, actorUserId: UUID, reason: 'No proof', createdAt: new Date(),
        actor: { name: 'TL' }, submission: { participation: { status: 'rejected' } },
      });

      const result = await service.reject(UUID, { reason: 'No proof provided' }, UUID);

      expect(result.action).toBe(VerificationAction.REJECTED);
      expect(result.reason).toBe('No proof');
      expect(participationRepo.save).toHaveBeenCalled();
      expect(submissionRepo.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException on duplicate rejection', async () => {
      submissionRepo.findOneBy.mockResolvedValue({ id: UUID, participationId: UUID } as any);
      participationRepo.findOne.mockResolvedValue({
        id: UUID, status: ParticipationStatus.SUBMITTED, teamLeaderUserId: UUID,
        enrollment: {},
      });
      logRepo.findOne.mockResolvedValue({ id: UUID, action: VerificationAction.REJECTED });

      await expect(service.reject(UUID, { reason: 'No proof' }, UUID)).rejects.toThrow(BadRequestException);
    });
  });
});
