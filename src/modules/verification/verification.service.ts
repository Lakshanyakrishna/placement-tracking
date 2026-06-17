import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { VerificationLog, VerificationAction } from './entities/verification-log.entity';
import { Submission } from '../submissions/entities/submission.entity';
import { SubmissionFile } from '../submissions/entities/submission-file.entity';
import { Participation, ParticipationStatus } from '../participations/entities/participation.entity';
import { Enrollment } from '../enrollments/entities/enrollment.entity';
import { IamService } from '../iam/iam.service';
import { PaginationQueryDto, PaginationMetaDto, createPaginationMeta, parseSort } from '../../common/dto/pagination.dto';
import { RejectSubmissionDto } from './dto/reject-submission.dto';
import { VerificationLogResponseDto } from './dto/verification-log-response.dto';
import { PendingSubmissionResponseDto } from './dto/pending-submission-response.dto';

@Injectable()
export class VerificationService {
  private readonly logger = new Logger(VerificationService.name);

  constructor(
    @InjectRepository(VerificationLog)
    private readonly logRepository: Repository<VerificationLog>,
    @InjectRepository(Submission)
    private readonly submissionRepository: Repository<Submission>,
    @InjectRepository(SubmissionFile)
    private readonly submissionFileRepository: Repository<SubmissionFile>,
    @InjectRepository(Participation)
    private readonly participationRepository: Repository<Participation>,
    @InjectRepository(Enrollment)
    private readonly enrollmentRepository: Repository<Enrollment>,
    private readonly iamService: IamService,
  ) {}

  async findPending(userId: string): Promise<PendingSubmissionResponseDto[]> {
    const groups = await this.iamService.findTeamLeaderGroups(userId);
    if (groups.length === 0) return [];

    const groupIds = groups.map((g) => g.id);

    const enrollments = await this.enrollmentRepository.find({
      where: { groupId: In(groupIds), isActive: true },
      select: ['id'],
    });
    if (enrollments.length === 0) return [];

    const enrollmentIds = enrollments.map((e) => e.id);

    const participations = await this.participationRepository.find({
      where: { enrollmentId: In(enrollmentIds), status: ParticipationStatus.SUBMITTED },
      relations: ['opportunity', 'enrollment', 'enrollment.user'],
    });

    const participationIds = participations.map((p) => p.id);

    const submissions = await this.submissionRepository.find({
      where: { participationId: In(participationIds) },
    });

    const submissionMap = new Map(submissions.map((s) => [s.participationId, s]));

    const results: PendingSubmissionResponseDto[] = [];

    for (const p of participations) {
      const submission = submissionMap.get(p.id);
      if (!submission) continue;

      const fileCount = await this.submissionFileRepository.count({
        where: { submissionId: submission.id },
      });

      results.push({
        submissionId: submission.id,
        participationId: p.id,
        opportunityTitle: p.opportunity?.title ?? 'Unknown',
        opportunityId: p.opportunityId,
        studentName: (p.enrollment as any)?.user?.name ?? 'Unknown',
        studentEmail: (p.enrollment as any)?.user?.email ?? '',
        submittedAt: submission.submittedAt,
        description: submission.description,
        fileCount,
      });
    }

    return results;
  }

  async findByGroup(
    groupId: string,
    query: PaginationQueryDto,
  ): Promise<{ data: VerificationLogResponseDto[]; meta: PaginationMetaDto }> {
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

    const submissions = await this.submissionRepository.find({
      where: { participationId: In(participations.map((p) => p.id)) },
      select: ['id'],
    });
    if (submissions.length === 0) {
      return { data: [], meta: createPaginationMeta(0, query) };
    }

    const [entities, total] = await this.logRepository.findAndCount({
      where: { submissionId: In(submissions.map((s) => s.id)) },
      order: { [field]: direction },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['actor', 'submission', 'submission.participation'],
    });

    return {
      data: entities.map(VerificationLogResponseDto.fromEntity),
      meta: createPaginationMeta(total, query),
    };
  }

  async findBySection(
    sectionId: string,
    query: PaginationQueryDto,
  ): Promise<{ data: VerificationLogResponseDto[]; meta: PaginationMetaDto }> {
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

    const submissions = await this.submissionRepository.find({
      where: { participationId: In(participations.map((p) => p.id)) },
      select: ['id'],
    });
    if (submissions.length === 0) {
      return { data: [], meta: createPaginationMeta(0, query) };
    }

    const [entities, total] = await this.logRepository.findAndCount({
      where: { submissionId: In(submissions.map((s) => s.id)) },
      order: { [field]: direction },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['actor', 'submission', 'submission.participation'],
    });

    return {
      data: entities.map(VerificationLogResponseDto.fromEntity),
      meta: createPaginationMeta(total, query),
    };
  }

  async findBySubmission(
    submissionId: string,
  ): Promise<{ data: VerificationLogResponseDto[] }> {
    const submission = await this.submissionRepository.findOneBy({ id: submissionId });
    if (!submission) {
      throw new NotFoundException(`Submission with id "${submissionId}" not found`);
    }

    const logs = await this.logRepository.find({
      where: { submissionId },
      order: { createdAt: 'DESC' },
      relations: ['actor', 'submission', 'submission.participation'],
    });

    return { data: logs.map(VerificationLogResponseDto.fromEntity) };
  }

  async approve(submissionId: string, userId: string): Promise<VerificationLogResponseDto> {
    const submission = await this.submissionRepository.findOneBy({ id: submissionId });
    if (!submission) {
      throw new NotFoundException(`Submission with id "${submissionId}" not found`);
    }

    const participation = await this.participationRepository.findOne({
      where: { id: submission.participationId },
      relations: ['enrollment'],
    });
    if (!participation) {
      throw new NotFoundException('Associated participation not found');
    }

    if (participation.status !== ParticipationStatus.SUBMITTED) {
      throw new BadRequestException(
        `Cannot approve submission with participation status "${participation.status}". Expected "submitted".`,
      );
    }

    this.assertTeamLeader(userId, participation);

    const existingLog = await this.logRepository.findOne({
      where: { submissionId, action: In([VerificationAction.VERIFIED, VerificationAction.REJECTED]) },
    });
    if (existingLog) {
      throw new BadRequestException(`Submission has already been ${existingLog.action}`);
    }

    const log = this.logRepository.create({
      submissionId,
      action: VerificationAction.VERIFIED,
      actorUserId: userId,
      reason: null,
    });
    await this.logRepository.save(log);

    participation.status = ParticipationStatus.VERIFIED;
    await this.participationRepository.save(participation);

    this.logger.log(`Submission ${submissionId} approved by user ${userId}`);

    const loaded = await this.logRepository.findOne({
      where: { id: log.id },
      relations: ['actor', 'submission', 'submission.participation'],
    });
    return VerificationLogResponseDto.fromEntity(loaded!);
  }

  async reject(
    submissionId: string,
    dto: RejectSubmissionDto,
    userId: string,
  ): Promise<VerificationLogResponseDto> {
    const submission = await this.submissionRepository.findOneBy({ id: submissionId });
    if (!submission) {
      throw new NotFoundException(`Submission with id "${submissionId}" not found`);
    }

    const participation = await this.participationRepository.findOne({
      where: { id: submission.participationId },
      relations: ['enrollment'],
    });
    if (!participation) {
      throw new NotFoundException('Associated participation not found');
    }

    if (participation.status !== ParticipationStatus.SUBMITTED) {
      throw new BadRequestException(
        `Cannot reject submission with participation status "${participation.status}". Expected "submitted".`,
      );
    }

    this.assertTeamLeader(userId, participation);

    const existingLog = await this.logRepository.findOne({
      where: { submissionId, action: In([VerificationAction.VERIFIED, VerificationAction.REJECTED]) },
    });
    if (existingLog) {
      throw new BadRequestException(`Submission has already been ${existingLog.action}`);
    }

    const log = this.logRepository.create({
      submissionId,
      action: VerificationAction.REJECTED,
      actorUserId: userId,
      reason: dto.reason,
    });
    await this.logRepository.save(log);

    participation.status = ParticipationStatus.REJECTED;
    await this.participationRepository.save(participation);

    submission.rejectionReason = dto.reason;
    await this.submissionRepository.save(submission);

    this.logger.log(`Submission ${submissionId} rejected by user ${userId}: ${dto.reason}`);

    const loaded = await this.logRepository.findOne({
      where: { id: log.id },
      relations: ['actor', 'submission', 'submission.participation'],
    });
    return VerificationLogResponseDto.fromEntity(loaded!);
  }

  private assertTeamLeader(userId: string, participation: Participation): void {
    if (participation.teamLeaderUserId !== userId) {
      throw new ForbiddenException('You are not the assigned team leader for this participation');
    }
  }
}
