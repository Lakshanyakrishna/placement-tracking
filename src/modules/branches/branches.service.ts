import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Like } from 'typeorm';
import { Branch } from './entities/branch.entity';
import { PaginationQueryDto, PaginationMetaDto, createPaginationMeta, parseSort } from '../../common/dto/pagination.dto';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { BranchResponseDto } from './dto/branch-response.dto';

@Injectable()
export class BranchesService {
  constructor(
    @InjectRepository(Branch)
    private readonly repository: Repository<Branch>,
  ) {}

  async findAll(query: PaginationQueryDto): Promise<{ data: BranchResponseDto[]; meta: PaginationMetaDto }> {
    const { field, direction } = parseSort(query.sort);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where: FindOptionsWhere<Branch>[] | FindOptionsWhere<Branch> = query.search
      ? [
          { name: Like(`%${query.search}%`) },
          { code: Like(`%${query.search}%`) },
        ]
      : {};

    const [entities, total] = await this.repository.findAndCount({
      where,
      order: { [field]: direction },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: entities.map(BranchResponseDto.fromEntity),
      meta: createPaginationMeta(total, query),
    };
  }

  async findOne(id: string): Promise<BranchResponseDto | null> {
    const entity = await this.repository.findOneBy({ id });
    if (!entity) return null;
    return BranchResponseDto.fromEntity(entity);
  }

  async create(dto: CreateBranchDto): Promise<BranchResponseDto> {
    const entity = this.repository.create(dto);
    const saved = await this.repository.save(entity);
    return BranchResponseDto.fromEntity(saved);
  }

  async update(id: string, dto: UpdateBranchDto): Promise<BranchResponseDto> {
    const entity = await this.repository.findOneBy({ id });
    if (!entity) {
      throw new NotFoundException(`Branch with id "${id}" not found`);
    }
    Object.assign(entity, dto);
    const saved = await this.repository.save(entity);
    return BranchResponseDto.fromEntity(saved);
  }

  async remove(id: string): Promise<void> {
    const entity = await this.repository.findOneBy({ id });
    if (!entity) {
      throw new NotFoundException(`Branch with id "${id}" not found`);
    }
    await this.repository.remove(entity);
  }
}
