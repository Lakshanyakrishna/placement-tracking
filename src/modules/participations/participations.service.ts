import { Injectable, NotFoundException, BadRequestException, ForbiddenException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Participation, ParticipationStatus } from './entities/participation.entity';
import { Enrollment } from '../enrollments/entities/enrollment.entity';
import { Opportunity, OpportunityState } from '../opportunities/entities/opportunity.entity';
import { Group } from '../groups/entities/group.entity';
import { PaginationQueryDto, PaginationMetaDto, createPaginationMeta, parseSort } from '../../common/dto/pagination.dto';
import { CreateParticipationDto } from './dto/create-participation.dto';
import { UpdateParticipationStatusDto } from './dto/update-participation-status.dto';
import { ParticipationResponseDto } from './dto/participation-response.dto';
import { ParticipationFilterDto } from './dto/participation-filter.dto';

const STATUS_TRANSITIONS: Record<ParticipationStatus, ParticipationStatus[]> = {
  [ParticipationStatus.NOT_STARTED]: [ParticipationStatus.IN_PROGRESS],
  [ParticipationStatus.IN_PROGRESS]: [ParticipationStatus.SUBMITTED, ParticipationStatus.COMPLETED],
  [ParticipationStatus.SUBMITTED]: [ParticipationStatus.VERIFIED, ParticipationStatus.REJECTED, ParticipationStatus.INCOMPLETE],
  [ParticipationStatus.REJECTED]: [ParticipationStatus.IN_PROGRESS],
  [ParticipationStatus.INCOMPLETE]: [ParticipationStatus.IN_PROGRESS],
  [ParticipationStatus.VERIFIED]: [ParticipationStatus.COMPLETED],
  [ParticipationStatus.COMPLETED]: [],
};

@Injectable()
export class ParticipationsService {
  constructor(
    @InjectRepository(Participation)
    private readonly repository: Repository<Participation>,
    @InjectRepository(Enrollment)
    private readonly enrollmentRepository: Repository<Enrollment>,
    @InjectRepository(Opportunity)
    private readonly opportunityRepository: Repository<Opportunity>,
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
  ) {}

  async create(dto: CreateParticipationDto, userId: string): Promise<ParticipationResponseDto> {
    const opportunity = await this.opportunityRepository.findOneBy({ id: dto.opportunityId });
    if (!opportunity) {
      throw new NotFoundException(`Opportunity with id "${dto.opportunityId}" not found`);
    }
    if (opportunity.state === OpportunityState.DRAFT) {
      throw new BadRequestException('Cannot participate in a draft opportunity');
    }

    const enrollment = await this.enrollmentRepository.findOne({
      where: { userId, academicPeriodId: opportunity.academicPeriodId, isActive: true },
      relations: ['user'],
    });
    if (!enrollment) {
      throw new ForbiddenException('You are not enrolled in the academic period for this opportunity');
    }

    const existing = await this.repository.findOne({
      where: { opportunityId: dto.opportunityId, enrollmentId: enrollment.id },
    });
    if (existing) {
      throw new ConflictException('You have already started this opportunity');
    }

    let teamLeaderUserId: string | null = null;
    if (enrollment.groupId) {
      const group = await this.groupRepository.findOneBy({ id: enrollment.groupId });
      if (group?.teamLeaderUserId) {
        teamLeaderUserId = group.teamLeaderUserId;
      }
    }

    const entity = this.repository.create({
      opportunityId: dto.opportunityId,
      enrollmentId: enrollment.id,
      status: ParticipationStatus.NOT_STARTED,
      teamLeaderUserId,
    });
    const saved = await this.repository.save(entity);
    const loaded = await this.repository.findOne({
      where: { id: saved.id },
      relations: ['opportunity', 'enrollment', 'enrollment.user'],
    });
    return ParticipationResponseDto.fromEntity(loaded!);
  }

  async findMyParticipations(
    query: ParticipationFilterDto,
    userId: string,
  ): Promise<{ data: ParticipationResponseDto[]; meta: PaginationMetaDto }> {
    const { field, direction } = parseSort(query.sort);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const enrollments = await this.enrollmentRepository.find({
      where: { userId, isActive: true },
      select: ['id'],
    });
    if (enrollments.length === 0) {
      return { data: [], meta: createPaginationMeta(0, query) };
    }
    const enrollmentIds = enrollments.map((e) => e.id);

    const where: Record<string, unknown> = {
      enrollmentId: In(enrollmentIds),
    };
    if (query.status) {
      where.status = query.status;
    }
    if (query.opportunityId) {
      where.opportunityId = query.opportunityId;
    }

    const [entities, total] = await this.repository.findAndCount({
      where,
      order: { [field]: direction },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['opportunity', 'enrollment', 'enrollment.user'],
    });

    return {
      data: entities.map(ParticipationResponseDto.fromEntity),
      meta: createPaginationMeta(total, query),
    };
  }

  async findOne(id: string): Promise<ParticipationResponseDto> {
    const entity = await this.repository.findOne({
      where: { id },
      relations: ['opportunity', 'enrollment', 'enrollment.user'],
    });
    if (!entity) {
      throw new NotFoundException(`Participation with id "${id}" not found`);
    }
    return ParticipationResponseDto.fromEntity(entity);
  }

  async updateStatus(
    id: string,
    dto: UpdateParticipationStatusDto,
    currentUserId: string,
  ): Promise<ParticipationResponseDto> {
    const entity = await this.repository.findOne({
      where: { id },
      relations: ['opportunity', 'enrollment', 'enrollment.user'],
    });
    if (!entity) {
      throw new NotFoundException(`Participation with id "${id}" not found`);
    }

    const allowed = STATUS_TRANSITIONS[entity.status];
    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(
        `Cannot transition from "${entity.status}" to "${dto.status}". Allowed: ${allowed.join(', ') || 'none'}`,
      );
    }

    entity.status = dto.status;

    switch (dto.status) {
      case ParticipationStatus.IN_PROGRESS:
        if (!entity.startedAt) entity.startedAt = new Date();
        break;
      case ParticipationStatus.SUBMITTED:
        entity.submittedAt = new Date();
        break;
      case ParticipationStatus.VERIFIED:
        entity.verifiedAt = new Date();
        entity.verifiedBy = currentUserId;
        break;
    }

    if (dto.notes !== undefined) {
      entity.notes = dto.notes;
    }

    const saved = await this.repository.save(entity);
    return ParticipationResponseDto.fromEntity(saved);
  }

  async findByOpportunity(
    opportunityId: string,
    query: PaginationQueryDto,
  ): Promise<{ data: ParticipationResponseDto[]; meta: PaginationMetaDto }> {
    const { field, direction } = parseSort(query.sort);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const [entities, total] = await this.repository.findAndCount({
      where: { opportunityId },
      order: { [field]: direction },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['opportunity', 'enrollment', 'enrollment.user'],
    });

    return {
      data: entities.map(ParticipationResponseDto.fromEntity),
      meta: createPaginationMeta(total, query),
    };
  }

  async findByGroup(
    groupId: string,
    query: PaginationQueryDto,
  ): Promise<{ data: ParticipationResponseDto[]; meta: PaginationMetaDto }> {
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

    const [entities, total] = await this.repository.findAndCount({
      where: { enrollmentId: In(enrollments.map((e) => e.id)) },
      order: { [field]: direction },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['opportunity', 'enrollment', 'enrollment.user'],
    });

    return {
      data: entities.map(ParticipationResponseDto.fromEntity),
      meta: createPaginationMeta(total, query),
    };
  }

  async findBySection(
    sectionId: string,
    query: PaginationQueryDto,
  ): Promise<{ data: ParticipationResponseDto[]; meta: PaginationMetaDto }> {
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

    const [entities, total] = await this.repository.findAndCount({
      where: { enrollmentId: In(enrollments.map((e) => e.id)) },
      order: { [field]: direction },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['opportunity', 'enrollment', 'enrollment.user'],
    });

    return {
      data: entities.map(ParticipationResponseDto.fromEntity),
      meta: createPaginationMeta(total, query),
    };
  }

  async findByMentor(
    mentorId: string,
    query: PaginationQueryDto,
  ): Promise<{ data: ParticipationResponseDto[]; meta: PaginationMetaDto }> {
    const { field, direction } = parseSort(query.sort);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const sections = await this.enrollmentRepository.manager.query(
      `SELECT id FROM sections WHERE mentor_user_id = $1`,
      [mentorId],
    );
    if (sections.length === 0) {
      return { data: [], meta: createPaginationMeta(0, query) };
    }

    const sectionIds = sections.map((s: { id: string }) => s.id);
    const enrollments = await this.enrollmentRepository.find({
      where: { sectionId: In(sectionIds), isActive: true },
      select: ['id'],
    });
    if (enrollments.length === 0) {
      return { data: [], meta: createPaginationMeta(0, query) };
    }

    const [entities, total] = await this.repository.findAndCount({
      where: { enrollmentId: In(enrollments.map((e) => e.id)) },
      order: { [field]: direction },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['opportunity', 'enrollment', 'enrollment.user'],
    });

    return {
      data: entities.map(ParticipationResponseDto.fromEntity),
      meta: createPaginationMeta(total, query),
    };
  }
}
