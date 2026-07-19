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
import { OpportunityAnalyticsResponseDto, GroupRegistrationDto } from './dto/opportunity-analytics-response.dto';
import { IamService } from '../iam/iam.service';

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
    private readonly iamService: IamService,
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

  async findOne(id: string, user: { id: string; roles?: Array<{ role: string }>; isStudent?: boolean }): Promise<ParticipationResponseDto> {
    const entity = await this.repository.findOne({
      where: { id },
      relations: ['opportunity', 'enrollment', 'enrollment.user'],
    });
    if (!entity) {
      throw new NotFoundException(`Participation with id "${id}" not found`);
    }

    const userRoles = (user.roles ?? []).map(r => r.role);
    if (user.isStudent) userRoles.push('student');
    const isAdmin = userRoles.includes('admin');
    const isOwner = entity.enrollment?.userId === user.id;
    const isTeamLeader = entity.teamLeaderUserId === user.id;

    if (!isAdmin && !isOwner && !isTeamLeader) {
      throw new ForbiddenException('You do not have access to this participation');
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

    const isOwner = entity.enrollment?.userId === currentUserId;
    const isTeamLeader = entity.teamLeaderUserId === currentUserId;
    if (!isOwner && !isTeamLeader) {
      throw new ForbiddenException('You can only update your own participation or one you are assigned to as team leader');
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

  async getOpportunityAnalytics(
    opportunityId: string,
    user: { id: string; roles?: Array<{ role: string }>; isStudent?: boolean },
  ): Promise<OpportunityAnalyticsResponseDto> {
    const opportunity = await this.opportunityRepository.findOneBy({ id: opportunityId });
    if (!opportunity) {
      throw new NotFoundException(`Opportunity with id "${opportunityId}" not found`);
    }

    const userRoles = (user.roles ?? []).map(r => r.role);
    if (user.isStudent) userRoles.push('student');
    const isAdmin = userRoles.includes('admin');

    // Scope which groups this caller may see a breakdown for. Admins see every
    // group; mentors are limited to groups within their own sections; team
    // leaders are limited to their own group(s) — regardless of who created
    // the opportunity, so a team leader never sees another group's numbers.
    let allowedGroupIds: string[] | null = null;
    if (!isAdmin) {
      if (userRoles.includes('mentor')) {
        const sections = await this.iamService.findMentorSections(user.id);
        const groups = await this.groupRepository.find({ where: { sectionId: In(sections.map(s => s.id)) } });
        allowedGroupIds = groups.map(g => g.id);
      } else if (userRoles.includes('team_leader')) {
        const groups = await this.iamService.findTeamLeaderGroups(user.id);
        allowedGroupIds = groups.map(g => g.id);
      } else {
        throw new ForbiddenException("You do not have access to this opportunity's analytics");
      }
    }

    const participations = await this.repository.find({
      where: { opportunityId },
      relations: ['enrollment'],
    });

    const byGroup = new Map<string, { count: number; statusBreakdown: Record<string, number> }>();
    for (const p of participations) {
      const groupId = p.enrollment?.groupId;
      if (!groupId) continue;
      if (allowedGroupIds && !allowedGroupIds.includes(groupId)) continue;
      const entry = byGroup.get(groupId) ?? { count: 0, statusBreakdown: {} };
      entry.count += 1;
      entry.statusBreakdown[p.status] = (entry.statusBreakdown[p.status] ?? 0) + 1;
      byGroup.set(groupId, entry);
    }

    const groups =
      byGroup.size > 0
        ? await this.groupRepository.find({ where: { id: In([...byGroup.keys()]) }, relations: ['teamLeader'] })
        : [];

    const groupDtos: GroupRegistrationDto[] = groups
      .map((g) => {
        const entry = byGroup.get(g.id)!;
        return {
          groupId: g.id,
          groupName: g.name,
          teamLeaderName: g.teamLeader?.name ?? null,
          registeredCount: entry.count,
          statusBreakdown: entry.statusBreakdown,
        };
      })
      .sort((a, b) => b.registeredCount - a.registeredCount);

    return {
      opportunityId,
      opportunityTitle: opportunity.title,
      totalRegistered: groupDtos.reduce((sum, g) => sum + g.registeredCount, 0),
      groups: groupDtos,
    };
  }

  async findByGroup(
    groupId: string,
    query: PaginationQueryDto,
    user: { id: string; roles?: Array<{ role: string }>; isStudent?: boolean },
  ): Promise<{ data: ParticipationResponseDto[]; meta: PaginationMetaDto }> {
    const userRoles = (user.roles ?? []).map(r => r.role);
    if (user.isStudent) userRoles.push('student');
    const isAdmin = userRoles.includes('admin');
    const isTeamLeader = userRoles.includes('team_leader');

    if (isTeamLeader && !isAdmin) {
      const groups = await this.iamService.findTeamLeaderGroups(user.id);
      if (!groups.some(g => g.id === groupId)) {
        throw new ForbiddenException('You can only view participations for your own groups');
      }
    }

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
    user: { id: string; roles?: Array<{ role: string }>; isStudent?: boolean },
  ): Promise<{ data: ParticipationResponseDto[]; meta: PaginationMetaDto }> {
    const userRoles = (user.roles ?? []).map(r => r.role);
    if (user.isStudent) userRoles.push('student');
    const isAdmin = userRoles.includes('admin');
    const isMentor = userRoles.includes('mentor');

    if (isMentor && !isAdmin) {
      const sections = await this.iamService.findMentorSections(user.id);
      if (!sections.some(s => s.id === sectionId)) {
        throw new ForbiddenException('You can only view participations for your own sections');
      }
    }

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
    user: { id: string; roles?: Array<{ role: string }>; isStudent?: boolean },
  ): Promise<{ data: ParticipationResponseDto[]; meta: PaginationMetaDto }> {
    const userRoles = (user.roles ?? []).map(r => r.role);
    if (user.isStudent) userRoles.push('student');
    const isAdmin = userRoles.includes('admin');

    if (!isAdmin && mentorId !== user.id) {
      throw new ForbiddenException('You can only view participations for your own mentor profile');
    }

    const { field, direction } = parseSort(query.sort);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const sections = await this.enrollmentRepository.manager.query(
      `SELECT id FROM sections WHERE mentor_user_id = $1 AND deleted_at IS NULL`,
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
