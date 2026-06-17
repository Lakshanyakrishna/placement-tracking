import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, QueryFailedError } from 'typeorm';
import { Section } from './entities/section.entity';
import { Group } from '../groups/entities/group.entity';
import { Enrollment } from '../enrollments/entities/enrollment.entity';
import {
  PaginationQueryDto,
  createPaginationMeta,
  parseSort,
} from '../../common/dto/pagination.dto';
import { CreateSectionDto } from './dto/create-section.dto';
import { UpdateSectionDto } from './dto/update-section.dto';
import { SectionResponseDto } from './dto/section-response.dto';

@Injectable()
export class SectionsService {
  constructor(
    @InjectRepository(Section)
    private readonly repository: Repository<Section>,

    @InjectRepository(Group)
    private readonly groupsRepository: Repository<Group>,

    @InjectRepository(Enrollment)
    private readonly enrollmentsRepository: Repository<Enrollment>,
  ) {}

  async findAll(
    query: PaginationQueryDto,
  ): Promise<{ data: SectionResponseDto[]; meta: ReturnType<typeof createPaginationMeta> }> {
    const { field, direction } = parseSort(query.sort);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where: any = {};
    if (query.search) {
      where.code = Like(`%${query.search}%`);
    }

    const [entities, total] = await this.repository.findAndCount({
      where,
      order: { [field]: direction },
      skip: (page - 1) * limit,
      take: limit,
      relations: { branch: true, academicPeriod: true, mentor: true },
    });

    return {
      data: entities.map(SectionResponseDto.fromEntity),
      meta: createPaginationMeta(total, query),
    };
  }

  async findOne(id: string): Promise<SectionResponseDto | null> {
    const entity = await this.repository.findOne({
      where: { id },
      relations: { branch: true, academicPeriod: true, mentor: true },
    });

    if (!entity) {
      return null;
    }

    return SectionResponseDto.fromEntity(entity);
  }

  async create(dto: CreateSectionDto): Promise<SectionResponseDto> {
    try {
      const entity = this.repository.create(dto as Partial<Section>);
      const saved = await this.repository.save(entity);
      return SectionResponseDto.fromEntity(saved);
    } catch (error) {
      if (error instanceof QueryFailedError && (error as any).code === '23505') {
        throw new ConflictException(
          'Section with this code already exists in this academic period and branch',
        );
      }
      throw error;
    }
  }

  async update(id: string, dto: UpdateSectionDto): Promise<SectionResponseDto> {
    const entity = await this.repository.findOneBy({ id });
    if (!entity) {
      throw new NotFoundException(`Section with id "${id}" not found`);
    }
    Object.assign(entity, dto);
    const saved = await this.repository.save(entity);
    return SectionResponseDto.fromEntity(saved);
  }

  async remove(id: string): Promise<void> {
    const entity = await this.repository.findOneBy({ id });
    if (!entity) {
      throw new NotFoundException(`Section with id "${id}" not found`);
    }
    await this.repository.remove(entity);
  }

  async findGroupsBySection(sectionId: string): Promise<Group[]> {
    return this.groupsRepository.find({ where: { sectionId } });
  }

  async findStudentsBySection(
    sectionId: string,
  ): Promise<{ id: string; name: string; email: string; rollNumber: string | null }[]> {
    const enrollments = await this.enrollmentsRepository.find({
      where: { sectionId },
      relations: { user: true },
    });

    return enrollments.map((e) => ({
      id: e.id,
      name: e.user.name,
      email: e.user.email,
      rollNumber: e.rollNumber,
    }));
  }
}
