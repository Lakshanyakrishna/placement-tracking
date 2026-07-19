import { Injectable, NotFoundException, ConflictException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Like, In, DataSource } from 'typeorm';
import { Opportunity, OpportunityState, OpportunityType } from './entities/opportunity.entity';
import { OpportunityTarget, TargetType } from './entities/opportunity-target.entity';
import { OpportunityRound } from './entities/opportunity-round.entity';
import { PaginationQueryDto, PaginationMetaDto, createPaginationMeta, parseSort } from '../../common/dto/pagination.dto';
import { CreateOpportunityDto, VisibilityScope } from './dto/create-opportunity.dto';
import { UpdateOpportunityDto } from './dto/update-opportunity.dto';
import { OpportunityResponseDto } from './dto/opportunity-response.dto';
import { OpportunityFilterDto } from './dto/opportunity-filter.dto';
import { SetTargetsDto, TargetItemDto } from './dto/set-targets.dto';
import { TargetResponseDto } from './dto/target-response.dto';
import { SetRoundsDto } from './dto/set-rounds.dto';
import { RoundResponseDto } from './dto/round-response.dto';
import { IamService } from '../iam/iam.service';

type RequestUser = { id: string; roles?: Array<{ role: string }>; isStudent?: boolean };

// Types reserved for the placement officer (admin): they represent recruitment
// drives that must be identical across every group, not per-group certifications.
const PLACEMENT_OFFICER_TYPES: OpportunityType[] = [OpportunityType.PLACEMENT, OpportunityType.INTERNSHIP];

@Injectable()
export class OpportunitiesService {
  constructor(
    @InjectRepository(Opportunity)
    private readonly repository: Repository<Opportunity>,
    @InjectRepository(OpportunityTarget)
    private readonly targetRepository: Repository<OpportunityTarget>,
    @InjectRepository(OpportunityRound)
    private readonly roundRepository: Repository<OpportunityRound>,
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly iamService: IamService,
  ) {}

  private rolesOf(user: RequestUser): string[] {
    const roles = (user.roles ?? []).map((r) => r.role);
    if (user.isStudent) roles.push('student');
    return roles;
  }

  async create(dto: CreateOpportunityDto, user: RequestUser): Promise<OpportunityResponseDto> {
    const userRoles = this.rolesOf(user);
    const isAdmin = userRoles.includes('admin');

    let targetGroupId: string | null = null;
    let targetSectionId: string | null = null;

    if (!isAdmin) {
      if (PLACEMENT_OFFICER_TYPES.includes(dto.opportunityType)) {
        throw new ForbiddenException('Only admins (placement officers) can create placement or internship opportunities');
      }

      const isTeamLeader = userRoles.includes('team_leader');
      const isMentor = userRoles.includes('mentor');
      if (!isTeamLeader && !isMentor) {
        throw new ForbiddenException('You do not have permission to create opportunities');
      }

      if (dto.visibilityScope === VisibilityScope.SECTION && isMentor) {
        const sections = await this.iamService.findMentorSections(user.id);
        if (sections.length === 0) {
          throw new ForbiddenException('You are not assigned as a mentor for any section');
        }
        targetSectionId = sections[0].id;
      } else if (dto.visibilityScope === VisibilityScope.GROUP && isTeamLeader) {
        const groups = await this.iamService.findTeamLeaderGroups(user.id);
        if (groups.length === 0) {
          throw new ForbiddenException('You are not assigned as a team leader for any group');
        }
        targetGroupId = groups[0].id;
      } else if (isTeamLeader) {
        const groups = await this.iamService.findTeamLeaderGroups(user.id);
        if (groups.length === 0) {
          throw new ForbiddenException('You are not assigned as a team leader for any group');
        }
        targetGroupId = groups[0].id;
      } else {
        const sections = await this.iamService.findMentorSections(user.id);
        if (sections.length === 0) {
          throw new ForbiddenException('You are not assigned as a mentor for any section');
        }
        targetSectionId = sections[0].id;
      }
    }

    const { visibilityScope: _visibilityScope, ...rest } = dto;
    const entity = this.repository.create({
      ...rest,
      createdBy: user.id,
      state: OpportunityState.DRAFT,
      description: dto.description ?? '',
      verificationDeadline: dto.verificationDeadline ?? '7 days',
      requireProof: dto.requireProof ?? true,
      allowGroupSubmission: dto.allowGroupSubmission ?? false,
      opensAt: dto.opensAt ? new Date(dto.opensAt) : null,
      closesAt: dto.closesAt ? new Date(dto.closesAt) : null,
      targetGroupId,
      targetSectionId,
    });
    const saved = await this.repository.save(entity);
    return OpportunityResponseDto.fromEntity(saved);
  }

  async findAll(query: OpportunityFilterDto): Promise<{ data: OpportunityResponseDto[]; meta: PaginationMetaDto }> {
    const { field, direction } = parseSort(query.sort);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where: FindOptionsWhere<Opportunity>[] | FindOptionsWhere<Opportunity> = {};

    if (query.type) {
      where.opportunityType = query.type;
    }
    if (query.status) {
      where.state = query.status;
    }
    if (query.branch) {
      where.targetBranchId = query.branch;
    }
    if (query.section) {
      where.targetSectionId = query.section;
    }
    if (query.batch) {
      where.targetBatchId = query.batch;
    }

    let searchWhere: FindOptionsWhere<Opportunity>[] | FindOptionsWhere<Opportunity> = where;

    if (query.search) {
      searchWhere = [
        { ...where, title: Like(`%${query.search}%`) },
        { ...where, description: Like(`%${query.search}%`) },
      ];
    }

    const [entities, total] = await this.repository.findAndCount({
      where: searchWhere,
      order: { [field]: direction },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: entities.map((e) => OpportunityResponseDto.fromEntity(e)),
      meta: createPaginationMeta(total, query),
    };
  }

  async findOne(id: string): Promise<OpportunityResponseDto> {
    const entity = await this.repository.findOne({
      where: { id },
      relations: ['academicPeriod', 'createdByUser'],
    });
    if (!entity) {
      throw new NotFoundException(`Opportunity with id "${id}" not found`);
    }
    const targets = await this.targetRepository.find({
      where: { opportunityId: id },
      relations: ['branch', 'section', 'group', 'batch'],
    });
    const rounds = await this.roundRepository.find({
      where: { opportunityId: id },
      order: { sequence: 'ASC' },
    });
    return OpportunityResponseDto.fromEntity(
      entity,
      targets.map(TargetResponseDto.fromEntity),
      rounds.map(RoundResponseDto.fromEntity),
    );
  }

  private assertOwnerOrAdmin(entity: Opportunity, user: RequestUser): void {
    const isAdmin = this.rolesOf(user).includes('admin');
    if (!isAdmin && entity.createdBy !== user.id) {
      throw new ForbiddenException('You can only manage opportunities you created');
    }
  }

  async update(id: string, dto: UpdateOpportunityDto, user: RequestUser): Promise<OpportunityResponseDto> {
    const entity = await this.repository.findOneBy({ id });
    if (!entity) {
      throw new NotFoundException(`Opportunity with id "${id}" not found`);
    }
    this.assertOwnerOrAdmin(entity, user);
    if (!this.rolesOf(user).includes('admin') && dto.opportunityType && PLACEMENT_OFFICER_TYPES.includes(dto.opportunityType)) {
      throw new ForbiddenException('Only admins (placement officers) can set the placement or internship type');
    }
    const { visibilityScope: _visibilityScope, ...rest } = dto;
    const updateData: Record<string, unknown> = { ...rest };
    if (dto.opensAt) updateData.opensAt = new Date(dto.opensAt);
    if (dto.closesAt) updateData.closesAt = new Date(dto.closesAt);
    Object.assign(entity, updateData);
    const saved = await this.repository.save(entity);
    return OpportunityResponseDto.fromEntity(saved);
  }

  async remove(id: string, user: RequestUser): Promise<void> {
    const entity = await this.repository.findOneBy({ id });
    if (!entity) {
      throw new NotFoundException(`Opportunity with id "${id}" not found`);
    }
    this.assertOwnerOrAdmin(entity, user);
    if (entity.state !== OpportunityState.DRAFT) {
      throw new ConflictException('Only draft opportunities can be deleted');
    }
    await this.repository.softRemove(entity);
  }

  async publish(id: string, user: RequestUser): Promise<OpportunityResponseDto> {
    const entity = await this.repository.findOneBy({ id });
    if (!entity) {
      throw new NotFoundException(`Opportunity with id "${id}" not found`);
    }
    this.assertOwnerOrAdmin(entity, user);
    if (entity.state !== OpportunityState.DRAFT) {
      throw new BadRequestException(`Cannot publish an opportunity in "${entity.state}" state`);
    }
    entity.state = OpportunityState.PUBLISHED;
    const saved = await this.repository.save(entity);
    return OpportunityResponseDto.fromEntity(saved);
  }

  async archive(id: string, user: RequestUser): Promise<OpportunityResponseDto> {
    const entity = await this.repository.findOneBy({ id });
    if (!entity) {
      throw new NotFoundException(`Opportunity with id "${id}" not found`);
    }
    this.assertOwnerOrAdmin(entity, user);
    if (entity.state === OpportunityState.ARCHIVED) {
      throw new BadRequestException('Opportunity is already archived');
    }
    if (entity.state === OpportunityState.DRAFT) {
      throw new BadRequestException('Cannot archive a draft opportunity');
    }
    entity.state = OpportunityState.ARCHIVED;
    const saved = await this.repository.save(entity);
    return OpportunityResponseDto.fromEntity(saved);
  }

  async setTargets(id: string, dto: SetTargetsDto): Promise<TargetResponseDto[]> {
    const opportunity = await this.repository.findOneBy({ id });
    if (!opportunity) {
      throw new NotFoundException(`Opportunity with id "${id}" not found`);
    }

    await this.targetRepository.delete({ opportunityId: id });

    const entities = dto.targets.map((item: TargetItemDto) => {
      return this.targetRepository.create({
        opportunityId: id,
        targetType: item.targetType,
        branchId: item.targetType === TargetType.BRANCH ? item.branchId ?? null : null,
        sectionId: item.targetType === TargetType.SECTION ? item.sectionId ?? null : null,
        groupId: item.targetType === TargetType.GROUP ? item.groupId ?? null : null,
        batchId: item.targetType === TargetType.BATCH ? item.batchId ?? null : null,
      });
    });

    const saved = await this.targetRepository.save(entities);

    const loaded = await this.targetRepository.find({
      where: { opportunityId: id },
      relations: ['branch', 'section', 'group', 'batch'],
    });

    return loaded.map(TargetResponseDto.fromEntity);
  }

  async setRounds(id: string, dto: SetRoundsDto, user: RequestUser): Promise<RoundResponseDto[]> {
    const opportunity = await this.repository.findOneBy({ id });
    if (!opportunity) {
      throw new NotFoundException(`Opportunity with id "${id}" not found`);
    }
    this.assertOwnerOrAdmin(opportunity, user);

    await this.roundRepository.delete({ opportunityId: id });

    const entities = dto.rounds.map((item, index) =>
      this.roundRepository.create({
        opportunityId: id,
        title: item.title,
        link: item.link ?? null,
        scheduledAt: item.scheduledAt ? new Date(item.scheduledAt) : null,
        notes: item.notes ?? '',
        sequence: index,
      }),
    );

    if (entities.length > 0) {
      await this.roundRepository.save(entities);
    }

    const loaded = await this.roundRepository.find({
      where: { opportunityId: id },
      order: { sequence: 'ASC' },
    });

    return loaded.map(RoundResponseDto.fromEntity);
  }

  async getRounds(id: string): Promise<RoundResponseDto[]> {
    const rounds = await this.roundRepository.find({
      where: { opportunityId: id },
      order: { sequence: 'ASC' },
    });
    return rounds.map(RoundResponseDto.fromEntity);
  }

  async findAvailable(userId: string): Promise<OpportunityResponseDto[]> {
    const ids = await this.dataSource.query<{ id: string }[]>(
      `SELECT o.id FROM opportunities o
       WHERE o.deleted_at IS NULL
         AND o.state IN ('published','open')
         AND (o.opens_at IS NULL OR o.opens_at <= NOW())
         AND (o.closes_at IS NULL OR o.closes_at >= NOW())
         AND o.id NOT IN (
           SELECT p.opportunity_id FROM participations p
           WHERE p.enrollment_id IN (SELECT id FROM enrollments WHERE user_id = $1 AND deleted_at IS NULL)
         )
         AND (
           o.target_branch_id IS NULL
           OR o.target_branch_id IN (SELECT branch_id FROM enrollments WHERE user_id = $1 AND deleted_at IS NULL)
         )
         AND (
           o.target_section_id IS NULL
           OR o.target_section_id IN (SELECT section_id FROM enrollments WHERE user_id = $1 AND deleted_at IS NULL)
         )
         AND (
           o.target_batch_id IS NULL
           OR o.target_batch_id IN (SELECT batch_id FROM enrollments WHERE user_id = $1 AND deleted_at IS NULL)
         )
         AND (
           o.target_group_id IS NULL
           OR o.target_group_id IN (SELECT group_id FROM enrollments WHERE user_id = $1 AND deleted_at IS NULL)
         )
       ORDER BY o.created_at DESC`,
      [userId],
    );

    if (ids.length === 0) return [];

    const entities = await this.repository.find({
      where: { id: In(ids.map(r => r.id)) },
      relations: ['academicPeriod', 'createdByUser'],
    });

    return entities.map((e) => OpportunityResponseDto.fromEntity(e));
  }

  async getTargets(id: string): Promise<TargetResponseDto[]> {
    const opportunity = await this.repository.findOneBy({ id });
    if (!opportunity) {
      throw new NotFoundException(`Opportunity with id "${id}" not found`);
    }

    const targets = await this.targetRepository.find({
      where: { opportunityId: id },
      relations: ['branch', 'section', 'group', 'batch'],
    });

    return targets.map(TargetResponseDto.fromEntity);
  }
}
