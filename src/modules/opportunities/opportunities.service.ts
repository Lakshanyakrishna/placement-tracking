import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Like, In } from 'typeorm';
import { Opportunity, OpportunityState } from './entities/opportunity.entity';
import { OpportunityTarget, TargetType } from './entities/opportunity-target.entity';
import { PaginationQueryDto, PaginationMetaDto, createPaginationMeta, parseSort } from '../../common/dto/pagination.dto';
import { CreateOpportunityDto } from './dto/create-opportunity.dto';
import { UpdateOpportunityDto } from './dto/update-opportunity.dto';
import { OpportunityResponseDto } from './dto/opportunity-response.dto';
import { OpportunityFilterDto } from './dto/opportunity-filter.dto';
import { SetTargetsDto, TargetItemDto } from './dto/set-targets.dto';
import { TargetResponseDto } from './dto/target-response.dto';

@Injectable()
export class OpportunitiesService {
  constructor(
    @InjectRepository(Opportunity)
    private readonly repository: Repository<Opportunity>,
    @InjectRepository(OpportunityTarget)
    private readonly targetRepository: Repository<OpportunityTarget>,
  ) {}

  async create(dto: CreateOpportunityDto, userId: string): Promise<OpportunityResponseDto> {
    const entity = this.repository.create({
      ...dto,
      createdBy: userId,
      state: OpportunityState.DRAFT,
      description: dto.description ?? '',
      verificationDeadline: dto.verificationDeadline ?? '7 days',
      requireProof: dto.requireProof ?? true,
      allowGroupSubmission: dto.allowGroupSubmission ?? false,
      opensAt: dto.opensAt ? new Date(dto.opensAt) : null,
      closesAt: dto.closesAt ? new Date(dto.closesAt) : null,
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
    return OpportunityResponseDto.fromEntity(entity, targets.map(TargetResponseDto.fromEntity));
  }

  async update(id: string, dto: UpdateOpportunityDto): Promise<OpportunityResponseDto> {
    const entity = await this.repository.findOneBy({ id });
    if (!entity) {
      throw new NotFoundException(`Opportunity with id "${id}" not found`);
    }
    const updateData: Record<string, unknown> = { ...dto };
    if (dto.opensAt) updateData.opensAt = new Date(dto.opensAt);
    if (dto.closesAt) updateData.closesAt = new Date(dto.closesAt);
    Object.assign(entity, updateData);
    const saved = await this.repository.save(entity);
    return OpportunityResponseDto.fromEntity(saved);
  }

  async remove(id: string): Promise<void> {
    const entity = await this.repository.findOneBy({ id });
    if (!entity) {
      throw new NotFoundException(`Opportunity with id "${id}" not found`);
    }
    if (entity.state !== OpportunityState.DRAFT) {
      throw new ConflictException('Only draft opportunities can be deleted');
    }
    await this.repository.remove(entity);
  }

  async publish(id: string): Promise<OpportunityResponseDto> {
    const entity = await this.repository.findOneBy({ id });
    if (!entity) {
      throw new NotFoundException(`Opportunity with id "${id}" not found`);
    }
    if (entity.state !== OpportunityState.DRAFT) {
      throw new BadRequestException(`Cannot publish an opportunity in "${entity.state}" state`);
    }
    entity.state = OpportunityState.PUBLISHED;
    const saved = await this.repository.save(entity);
    return OpportunityResponseDto.fromEntity(saved);
  }

  async archive(id: string): Promise<OpportunityResponseDto> {
    const entity = await this.repository.findOneBy({ id });
    if (!entity) {
      throw new NotFoundException(`Opportunity with id "${id}" not found`);
    }
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
