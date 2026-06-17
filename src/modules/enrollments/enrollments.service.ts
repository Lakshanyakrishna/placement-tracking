import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryFailedError, DeepPartial } from 'typeorm';
import { Enrollment } from './entities/enrollment.entity';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';
import { PaginationQueryDto, createPaginationMeta, parseSort } from '../../common/dto/pagination.dto';

@Injectable()
export class EnrollmentsService {
  constructor(
    @InjectRepository(Enrollment)
    private readonly repository: Repository<Enrollment>,
  ) {}

  async findAll(query: PaginationQueryDto) {
    const { page = 1, limit = 20, search } = query;
    const { field, direction } = parseSort(query.sort, '-createdAt');

    const qb = this.repository.createQueryBuilder('enrollment')
      .leftJoinAndSelect('enrollment.user', 'user')
      .leftJoinAndSelect('enrollment.branch', 'branch')
      .leftJoinAndSelect('enrollment.section', 'section')
      .leftJoinAndSelect('enrollment.group', 'group')
      .leftJoinAndSelect('enrollment.batch', 'batch')
      .leftJoinAndSelect('enrollment.academicPeriod', 'academicPeriod');

    if (search) {
      qb.andWhere('user.name ILIKE :search', { search: `%${search}%` });
    }

    const allowedSortFields = ['createdAt', 'updatedAt', 'enrolledAt', 'rollNumber'];
    const sortField = allowedSortFields.includes(field) ? `enrollment.${field}` : 'enrollment.createdAt';

    qb.orderBy(sortField, direction)
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data: data.map((e) => ({
        id: e.id,
        userId: e.userId,
        userName: e.user?.name,
        userEmail: e.user?.email,
        academicPeriodId: e.academicPeriodId,
        academicPeriodLabel: e.academicPeriod?.label,
        branchId: e.branchId,
        branchName: e.branch?.name,
        sectionId: e.sectionId,
        sectionCode: e.section?.code,
        batchId: e.batchId,
        batchLabel: e.batch?.label,
        groupId: e.groupId,
        groupName: e.group?.name,
        rollNumber: e.rollNumber,
        isActive: e.isActive,
        enrolledAt: e.enrolledAt,
        createdAt: e.createdAt,
        updatedAt: e.updatedAt,
      })),
      meta: createPaginationMeta(total, { page, limit }),
    };
  }

  async findOne(id: string) {
    const entity = await this.repository.findOne({
      where: { id },
      relations: ['user', 'branch', 'section', 'group', 'batch', 'academicPeriod'],
    });

    if (!entity) {
      throw new NotFoundException(`Enrollment with id "${id}" not found`);
    }

    return entity;
  }

  async create(dto: CreateEnrollmentDto): Promise<Enrollment> {
    try {
      const entity = this.repository.create(dto as unknown as DeepPartial<Enrollment>);
      return await this.repository.save(entity);
    } catch (error) {
      if (error instanceof QueryFailedError && (error as any).code === '23505') {
        throw new ConflictException('Enrollment already exists for this user and academic period');
      }
      throw error;
    }
  }

  async update(id: string, dto: UpdateEnrollmentDto) {
    const entity = await this.findOne(id);
    Object.assign(entity, dto);
    return await this.repository.save(entity);
  }

  async remove(id: string) {
    const entity = await this.findOne(id);
    await this.repository.remove(entity);
  }
}
