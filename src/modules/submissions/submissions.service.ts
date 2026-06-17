import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import { Submission } from './entities/submission.entity';
import { SubmissionFile } from './entities/submission-file.entity';
import { FileReference } from './entities/file-reference.entity';
import { Participation, ParticipationStatus } from '../participations/entities/participation.entity';
import { Enrollment } from '../enrollments/entities/enrollment.entity';
import { Opportunity, OpportunityState } from '../opportunities/entities/opportunity.entity';
import { StorageService } from '../storage/storage.service';
import { PaginationQueryDto, PaginationMetaDto, createPaginationMeta, parseSort } from '../../common/dto/pagination.dto';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { UpdateSubmissionDto } from './dto/update-submission.dto';
import { SubmissionResponseDto, SubmissionFileDto } from './dto/submission-response.dto';
import { UploadFile } from './interfaces/upload-file.interface';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/jpg',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

@Injectable()
export class SubmissionsService {
  constructor(
    @InjectRepository(Submission)
    private readonly submissionRepository: Repository<Submission>,
    @InjectRepository(SubmissionFile)
    private readonly submissionFileRepository: Repository<SubmissionFile>,
    @InjectRepository(FileReference)
    private readonly fileReferenceRepository: Repository<FileReference>,
    @InjectRepository(Participation)
    private readonly participationRepository: Repository<Participation>,
    @InjectRepository(Enrollment)
    private readonly enrollmentRepository: Repository<Enrollment>,
    @InjectRepository(Opportunity)
    private readonly opportunityRepository: Repository<Opportunity>,
    private readonly storageService: StorageService,
  ) {}

  async create(
    files: UploadFile[],
    dto: CreateSubmissionDto,
    userId: string,
  ): Promise<SubmissionResponseDto> {
    if (!files || files.length === 0) {
      throw new BadRequestException('At least one file is required');
    }

    const participation = await this.participationRepository.findOne({
      where: { id: dto.participationId },
      relations: ['enrollment'],
    });
    if (!participation) {
      throw new NotFoundException(`Participation with id "${dto.participationId}" not found`);
    }

    if (participation.enrollment.userId !== userId) {
      throw new ForbiddenException('You can only submit to your own participation');
    }

    const opportunity = await this.opportunityRepository.findOneBy({ id: participation.opportunityId });
    if (!opportunity) {
      throw new NotFoundException('Associated opportunity not found');
    }
    if (opportunity.state !== OpportunityState.PUBLISHED && opportunity.state !== OpportunityState.OPEN) {
      throw new BadRequestException('The opportunity is not accepting submissions');
    }

    if (
      participation.status === ParticipationStatus.VERIFIED ||
      participation.status === ParticipationStatus.COMPLETED
    ) {
      throw new BadRequestException('Submission is locked after verification');
    }

    this.validateFiles(files);

    const client = this.storageService.getClient();
    const bucket = this.storageService.getBucket();

    const fileRefs: FileReference[] = [];
    for (const file of files) {
      const key = `submissions/${dto.participationId}/${uuidv4()}-${file.originalname}`;

      await client.send(new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }));

      const fileRef = this.fileReferenceRepository.create({
        bucket,
        key,
        originalFilename: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        uploadedBy: userId,
      });
      fileRefs.push(fileRef);
    }

    const savedFileRefs = await this.fileReferenceRepository.save(fileRefs);

    const existing = await this.submissionRepository.findOne({
      where: { participationId: dto.participationId },
    });

    let submission: Submission;
    if (existing) {
      submission = existing;
      if (dto.description !== undefined) submission.description = dto.description;
      if (dto.externalLinks !== undefined) submission.externalLinks = dto.externalLinks;
      submission.submittedAt = new Date();
      await this.submissionFileRepository.delete({ submissionId: submission.id });
    } else {
      submission = this.submissionRepository.create({
        participationId: dto.participationId,
        submittedBy: userId,
        description: dto.description ?? null,
        externalLinks: dto.externalLinks ?? null,
        isLate: false,
      });
    }

    const savedSubmission = await this.submissionRepository.save(submission);

    const submissionFiles = savedFileRefs.map((fr) =>
      this.submissionFileRepository.create({
        submissionId: savedSubmission.id,
        fileReferenceId: fr.id,
      }),
    );
    await this.submissionFileRepository.save(submissionFiles);

    return this.buildResponse(savedSubmission.id);
  }

  async findOne(id: string): Promise<SubmissionResponseDto> {
    const submission = await this.submissionRepository.findOneBy({ id });
    if (!submission) {
      throw new NotFoundException(`Submission with id "${id}" not found`);
    }
    return this.buildResponse(id);
  }

  async findMySubmissions(
    query: PaginationQueryDto,
    userId: string,
  ): Promise<{ data: SubmissionResponseDto[]; meta: PaginationMetaDto }> {
    const { field, direction } = parseSort(query.sort);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const [entities, total] = await this.submissionRepository.findAndCount({
      where: { submittedBy: userId },
      order: { [field]: direction },
      skip: (page - 1) * limit,
      take: limit,
    });

    const data = await Promise.all(entities.map((e) => this.buildResponse(e.id)));
    return { data, meta: createPaginationMeta(total, query) };
  }

  async findByGroup(
    groupId: string,
    query: PaginationQueryDto,
  ): Promise<{ data: SubmissionResponseDto[]; meta: PaginationMetaDto }> {
    const { field, direction } = parseSort(query.sort);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const enrollments = await this.enrollmentRepository.find({
      where: { groupId, isActive: true },
      select: ['id'],
    });
    if (enrollments.length === 0) {
      return { data: [], meta: createPaginationMeta(0, query) };
    }

    const participations = await this.participationRepository.find({
      where: { enrollmentId: In(enrollments.map((e) => e.id)) },
      select: ['id'],
    });
    if (participations.length === 0) {
      return { data: [], meta: createPaginationMeta(0, query) };
    }

    const [entities, total] = await this.submissionRepository.findAndCount({
      where: { participationId: In(participations.map((p) => p.id)) },
      order: { [field]: direction },
      skip: (page - 1) * limit,
      take: limit,
    });

    const data = await Promise.all(entities.map((e) => this.buildResponse(e.id)));
    return { data, meta: createPaginationMeta(total, query) };
  }

  async findBySection(
    sectionId: string,
    query: PaginationQueryDto,
  ): Promise<{ data: SubmissionResponseDto[]; meta: PaginationMetaDto }> {
    const { field, direction } = parseSort(query.sort);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const enrollments = await this.enrollmentRepository.find({
      where: { sectionId, isActive: true },
      select: ['id'],
    });
    if (enrollments.length === 0) {
      return { data: [], meta: createPaginationMeta(0, query) };
    }

    const participations = await this.participationRepository.find({
      where: { enrollmentId: In(enrollments.map((e) => e.id)) },
      select: ['id'],
    });
    if (participations.length === 0) {
      return { data: [], meta: createPaginationMeta(0, query) };
    }

    const [entities, total] = await this.submissionRepository.findAndCount({
      where: { participationId: In(participations.map((p) => p.id)) },
      order: { [field]: direction },
      skip: (page - 1) * limit,
      take: limit,
    });

    const data = await Promise.all(entities.map((e) => this.buildResponse(e.id)));
    return { data, meta: createPaginationMeta(total, query) };
  }

  async update(
    id: string,
    files: UploadFile[],
    dto: UpdateSubmissionDto,
    userId: string,
  ): Promise<SubmissionResponseDto> {
    const submission = await this.submissionRepository.findOneBy({ id });
    if (!submission) {
      throw new NotFoundException(`Submission with id "${id}" not found`);
    }
    if (submission.submittedBy !== userId) {
      throw new ForbiddenException('You can only update your own submission');
    }

    const participation = await this.participationRepository.findOneBy({ id: submission.participationId });
    if (
      participation &&
      (participation.status === ParticipationStatus.VERIFIED ||
        participation.status === ParticipationStatus.COMPLETED)
    ) {
      throw new BadRequestException('Submission is locked after verification');
    }

    if (dto.description !== undefined) submission.description = dto.description;
    if (dto.externalLinks !== undefined) submission.externalLinks = dto.externalLinks;

    if (files && files.length > 0) {
      this.validateFiles(files);

      const existingFiles = await this.submissionFileRepository.find({
        where: { submissionId: id },
        relations: ['fileReference'],
      });

      const client = this.storageService.getClient();
      const bucket = this.storageService.getBucket();

      for (const sf of existingFiles) {
        try {
          await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: sf.fileReference.key }));
        } catch {
          // ignore deletion errors for old files
        }
      }
      await this.submissionFileRepository.delete({ submissionId: id });
      await this.fileReferenceRepository.delete({
        id: In(existingFiles.map((sf) => sf.fileReferenceId)),
      });

      const fileRefs: FileReference[] = [];
      for (const file of files) {
        const key = `submissions/${submission.participationId}/${uuidv4()}-${file.originalname}`;
        await client.send(new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
        }));

        const fileRef = this.fileReferenceRepository.create({
          bucket,
          key,
          originalFilename: file.originalname,
          mimeType: file.mimetype,
          sizeBytes: file.size,
          uploadedBy: userId,
        });
        fileRefs.push(fileRef);
      }

      const savedFileRefs = await this.fileReferenceRepository.save(fileRefs);
      const submissionFiles = savedFileRefs.map((fr) =>
        this.submissionFileRepository.create({
          submissionId: id,
          fileReferenceId: fr.id,
        }),
      );
      await this.submissionFileRepository.save(submissionFiles);
    }

    submission.submittedAt = new Date();
    const saved = await this.submissionRepository.save(submission);
    return this.buildResponse(saved.id);
  }

  async remove(id: string, userId: string): Promise<void> {
    const submission = await this.submissionRepository.findOneBy({ id });
    if (!submission) {
      throw new NotFoundException(`Submission with id "${id}" not found`);
    }
    if (submission.submittedBy !== userId) {
      throw new ForbiddenException('You can only delete your own submission');
    }

    const participation = await this.participationRepository.findOneBy({ id: submission.participationId });
    if (
      participation &&
      (participation.status === ParticipationStatus.VERIFIED ||
        participation.status === ParticipationStatus.COMPLETED)
    ) {
      throw new BadRequestException('Submission is locked after verification');
    }

    const existingFiles = await this.submissionFileRepository.find({
      where: { submissionId: id },
      relations: ['fileReference'],
    });

    const client = this.storageService.getClient();
    const bucket = this.storageService.getBucket();

    for (const sf of existingFiles) {
      try {
        await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: sf.fileReference.key }));
      } catch {
        // ignore
      }
    }

    await this.submissionFileRepository.delete({ submissionId: id });
    if (existingFiles.length > 0) {
      await this.fileReferenceRepository.delete({
        id: In(existingFiles.map((sf) => sf.fileReferenceId)),
      });
    }
    await this.submissionRepository.remove(submission);
  }

  private validateFiles(files: UploadFile[]): void {
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        throw new BadRequestException(
          `File "${file.originalname}" exceeds maximum size of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
        );
      }
      if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        throw new BadRequestException(
          `File "${file.originalname}" has unsupported type "${file.mimetype}". Allowed: PDF, JPEG, PNG, DOC, DOCX`,
        );
      }
    }
  }

  private async buildResponse(submissionId: string): Promise<SubmissionResponseDto> {
    const submission = await this.submissionRepository.findOne({
      where: { id: submissionId },
    });
    if (!submission) {
      throw new NotFoundException(`Submission with id "${submissionId}" not found`);
    }

    const submissionFiles = await this.submissionFileRepository.find({
      where: { submissionId },
      relations: ['fileReference'],
    });

    const files = submissionFiles.map((sf) => {
      const dto = SubmissionFileDto.fromEntity(sf.fileReference);
      dto.id = sf.id;
      return dto;
    });

    return SubmissionResponseDto.fromEntity(submission, files);
  }
}
