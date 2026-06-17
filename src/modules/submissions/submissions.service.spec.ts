import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SubmissionsService } from './submissions.service';
import { Submission } from './entities/submission.entity';
import { SubmissionFile } from './entities/submission-file.entity';
import { FileReference } from './entities/file-reference.entity';
import { Participation, ParticipationStatus } from '../participations/entities/participation.entity';
import { Enrollment } from '../enrollments/entities/enrollment.entity';
import { Opportunity, OpportunityState, OpportunityType } from '../opportunities/entities/opportunity.entity';
import { StorageService } from '../storage/storage.service';

const UUID = '550e8400-e29b-41d4-a716-446655440000';

const mockFile = {
  fieldname: 'files',
  originalname: 'proof.pdf',
  encoding: '7bit',
  mimetype: 'application/pdf',
  buffer: Buffer.from('test'),
  size: 100,
  stream: null as never,
  destination: '',
  filename: '',
  path: '',
} as any;

function createRepoMock() {
  return {
    findOneBy: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    findAndCount: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    delete: jest.fn(),
  };
}

describe('SubmissionsService', () => {
  let service: SubmissionsService;
  let submissionRepo: ReturnType<typeof createRepoMock>;
  let submissionFileRepo: ReturnType<typeof createRepoMock>;
  let fileRefRepo: ReturnType<typeof createRepoMock>;
  let participationRepo: ReturnType<typeof createRepoMock>;
  let enrollmentRepo: ReturnType<typeof createRepoMock>;
  let opportunityRepo: ReturnType<typeof createRepoMock>;

  const mockSend = jest.fn().mockResolvedValue({});

  beforeEach(async () => {
    submissionRepo = createRepoMock();
    submissionFileRepo = createRepoMock();
    fileRefRepo = createRepoMock();
    participationRepo = createRepoMock();
    enrollmentRepo = createRepoMock();
    opportunityRepo = createRepoMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubmissionsService,
        { provide: getRepositoryToken(Submission), useValue: submissionRepo },
        { provide: getRepositoryToken(SubmissionFile), useValue: submissionFileRepo },
        { provide: getRepositoryToken(FileReference), useValue: fileRefRepo },
        { provide: getRepositoryToken(Participation), useValue: participationRepo },
        { provide: getRepositoryToken(Enrollment), useValue: enrollmentRepo },
        { provide: getRepositoryToken(Opportunity), useValue: opportunityRepo },
        {
          provide: StorageService,
          useValue: {
            getClient: () => ({ send: mockSend }),
            getBucket: () => 'test-bucket',
          },
        },
      ],
    }).compile();

    service = module.get<SubmissionsService>(SubmissionsService);
  });

  describe('create', () => {
    it('should create a submission with files', async () => {
      participationRepo.findOne.mockResolvedValue({
        id: UUID,
        enrollmentId: UUID,
        opportunityId: UUID,
        status: ParticipationStatus.IN_PROGRESS,
        enrollment: { userId: UUID },
      });
      opportunityRepo.findOneBy.mockResolvedValue({
        id: UUID,
        state: OpportunityState.PUBLISHED,
      });
      submissionRepo.findOne.mockResolvedValue(null);
      fileRefRepo.create.mockReturnValue({});
      fileRefRepo.save.mockResolvedValue([{ id: UUID, bucket: 'b', key: 'k', originalFilename: 'p.pdf', mimeType: 'app/pdf', sizeBytes: 100, createdAt: new Date() }]);
      submissionRepo.create.mockReturnValue({ id: UUID });
      submissionRepo.save.mockResolvedValue({ id: UUID });
      submissionFileRepo.create.mockReturnValue({});
      submissionFileRepo.save.mockResolvedValue([]);
      submissionRepo.findOne.mockResolvedValue({ id: UUID, participationId: UUID, submittedBy: UUID, description: null, externalLinks: null, submittedAt: new Date(), isLate: false, rejectionReason: null, createdAt: new Date(), updatedAt: new Date() });
      submissionFileRepo.find.mockResolvedValue([]);

      const result = await service.create([mockFile], { participationId: UUID }, UUID);

      expect(result).toBeDefined();
      expect(participationRepo.findOne).toHaveBeenCalled();
      expect(mockSend).toHaveBeenCalled();
    });

    it('should throw when no files', async () => {
      await expect(service.create([], { participationId: UUID }, UUID)).rejects.toThrow(BadRequestException);
    });

    it('should throw when participation not found', async () => {
      participationRepo.findOne.mockResolvedValue(null);

      await expect(service.create([mockFile], { participationId: UUID }, UUID)).rejects.toThrow(NotFoundException);
    });

    it('should throw when not the participation owner', async () => {
      participationRepo.findOne.mockResolvedValue({
        id: UUID, enrollmentId: UUID, status: ParticipationStatus.IN_PROGRESS,
        enrollment: { userId: 'other-user' },
      });

      await expect(service.create([mockFile], { participationId: UUID }, UUID)).rejects.toThrow(ForbiddenException);
    });

    it('should throw when opportunity not accepting', async () => {
      participationRepo.findOne.mockResolvedValue({
        id: UUID, enrollmentId: UUID, status: ParticipationStatus.IN_PROGRESS,
        enrollment: { userId: UUID },
      });
      opportunityRepo.findOneBy.mockResolvedValue({ id: UUID, state: OpportunityState.DRAFT });

      await expect(service.create([mockFile], { participationId: UUID }, UUID)).rejects.toThrow(BadRequestException);
    });

    it('should throw when participation is verified', async () => {
      participationRepo.findOne.mockResolvedValue({
        id: UUID, enrollmentId: UUID, status: ParticipationStatus.VERIFIED,
        enrollment: { userId: UUID },
      });
      opportunityRepo.findOneBy.mockResolvedValue({ id: UUID, state: OpportunityState.PUBLISHED });

      await expect(service.create([mockFile], { participationId: UUID }, UUID)).rejects.toThrow(BadRequestException);
    });

    it('should reject oversized files', async () => {
      const bigFile = { ...mockFile, size: 20 * 1024 * 1024, originalname: 'big.pdf' };

      participationRepo.findOne.mockResolvedValue({
        id: UUID, enrollmentId: UUID, status: ParticipationStatus.IN_PROGRESS,
        enrollment: { userId: UUID },
      });
      opportunityRepo.findOneBy.mockResolvedValue({ id: UUID, state: OpportunityState.PUBLISHED });

      await expect(service.create([bigFile], { participationId: UUID }, UUID)).rejects.toThrow(BadRequestException);
    });

    it('should reject unsupported file types', async () => {
      const badFile = { ...mockFile, mimetype: 'text/plain', originalname: 'notes.txt' };

      participationRepo.findOne.mockResolvedValue({
        id: UUID, enrollmentId: UUID, status: ParticipationStatus.IN_PROGRESS,
        enrollment: { userId: UUID },
      });
      opportunityRepo.findOneBy.mockResolvedValue({ id: UUID, state: OpportunityState.PUBLISHED });

      await expect(service.create([badFile], { participationId: UUID }, UUID)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findOne', () => {
    it('should return a submission', async () => {
      submissionRepo.findOneBy.mockResolvedValue({ id: UUID });
      submissionRepo.findOne.mockResolvedValue({ id: UUID, participationId: UUID, submittedBy: UUID, description: null, externalLinks: null, submittedAt: new Date(), isLate: false, rejectionReason: null, createdAt: new Date(), updatedAt: new Date() });
      submissionFileRepo.find.mockResolvedValue([]);

      const result = await service.findOne(UUID);

      expect(result).toBeDefined();
      expect(result.id).toBe(UUID);
    });

    it('should throw NotFoundException', async () => {
      submissionRepo.findOneBy.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findMySubmissions', () => {
    it('should return submissions for user', async () => {
      submissionRepo.findAndCount.mockResolvedValue([[{ id: UUID }], 1]);
      submissionRepo.findOne.mockResolvedValue({ id: UUID, participationId: UUID, submittedBy: UUID, description: null, externalLinks: null, submittedAt: new Date(), isLate: false, rejectionReason: null, createdAt: new Date(), updatedAt: new Date() });
      submissionFileRepo.find.mockResolvedValue([]);

      const result = await service.findMySubmissions({}, UUID);

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('findByGroup', () => {
    it('should find submissions for a group', async () => {
      enrollmentRepo.find.mockResolvedValue([{ id: UUID }]);
      participationRepo.find.mockResolvedValue([{ id: UUID }]);
      submissionRepo.findAndCount.mockResolvedValue([[{ id: UUID }], 1]);
      submissionRepo.findOne.mockResolvedValue({ id: UUID, participationId: UUID, submittedBy: UUID, description: null, externalLinks: null, submittedAt: new Date(), isLate: false, rejectionReason: null, createdAt: new Date(), updatedAt: new Date() });
      submissionFileRepo.find.mockResolvedValue([]);

      const result = await service.findByGroup(UUID, {});

      expect(result.data).toHaveLength(1);
    });

    it('should return empty when no enrollments', async () => {
      enrollmentRepo.find.mockResolvedValue([]);

      const result = await service.findByGroup(UUID, {});

      expect(result.data).toHaveLength(0);
    });
  });

  describe('findBySection', () => {
    it('should find submissions for a section', async () => {
      enrollmentRepo.find.mockResolvedValue([{ id: UUID }]);
      participationRepo.find.mockResolvedValue([{ id: UUID }]);
      submissionRepo.findAndCount.mockResolvedValue([[{ id: UUID }], 1]);
      submissionRepo.findOne.mockResolvedValue({ id: UUID, participationId: UUID, submittedBy: UUID, description: null, externalLinks: null, submittedAt: new Date(), isLate: false, rejectionReason: null, createdAt: new Date(), updatedAt: new Date() });
      submissionFileRepo.find.mockResolvedValue([]);

      const result = await service.findBySection(UUID, {});

      expect(result.data).toHaveLength(1);
    });
  });

  describe('update', () => {
    it('should update submission metadata', async () => {
      submissionRepo.findOneBy.mockResolvedValue({ id: UUID, participationId: UUID, submittedBy: UUID });
      participationRepo.findOneBy.mockResolvedValue({ id: UUID, status: ParticipationStatus.IN_PROGRESS });
      submissionRepo.save.mockResolvedValue({ id: UUID });
      submissionRepo.findOne.mockResolvedValue({ id: UUID, participationId: UUID, submittedBy: UUID, description: 'updated', externalLinks: null, submittedAt: new Date(), isLate: false, rejectionReason: null, createdAt: new Date(), updatedAt: new Date() });
      submissionFileRepo.find.mockResolvedValue([]);

      const result = await service.update(UUID, [], { description: 'updated' }, UUID);

      expect(result).toBeDefined();
    });

    it('should throw when not owner', async () => {
      submissionRepo.findOneBy.mockResolvedValue({ id: UUID, participationId: UUID, submittedBy: 'other' });

      await expect(service.update(UUID, [], { description: 'x' }, UUID)).rejects.toThrow(ForbiddenException);
    });

    it('should throw when locked', async () => {
      submissionRepo.findOneBy.mockResolvedValue({ id: UUID, participationId: UUID, submittedBy: UUID });
      participationRepo.findOneBy.mockResolvedValue({ id: UUID, status: ParticipationStatus.VERIFIED });

      await expect(service.update(UUID, [], { description: 'x' }, UUID)).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('should delete a submission', async () => {
      submissionRepo.findOneBy.mockResolvedValue({ id: UUID, participationId: UUID, submittedBy: UUID });
      participationRepo.findOneBy.mockResolvedValue({ id: UUID, status: ParticipationStatus.IN_PROGRESS });
      submissionFileRepo.find.mockResolvedValue([]);
      submissionRepo.remove.mockResolvedValue({});

      await service.remove(UUID, UUID);

      expect(submissionRepo.remove).toHaveBeenCalled();
    });

    it('should throw when not owner', async () => {
      submissionRepo.findOneBy.mockResolvedValue({ id: UUID, participationId: UUID, submittedBy: 'other' });

      await expect(service.remove(UUID, UUID)).rejects.toThrow(ForbiddenException);
    });

    it('should throw when locked', async () => {
      submissionRepo.findOneBy.mockResolvedValue({ id: UUID, participationId: UUID, submittedBy: UUID });
      participationRepo.findOneBy.mockResolvedValue({ id: UUID, status: ParticipationStatus.COMPLETED });

      await expect(service.remove(UUID, UUID)).rejects.toThrow(BadRequestException);
    });
  });
});
