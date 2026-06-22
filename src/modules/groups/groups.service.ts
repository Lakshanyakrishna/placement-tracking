import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Group } from './entities/group.entity';
import { Enrollment } from '../enrollments/entities/enrollment.entity';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { GroupResponseDto } from './dto/group-response.dto';
import { PaginationQueryDto, createPaginationMeta, parseSort } from '../../common/dto/pagination.dto';

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(Group)
    private readonly repository: Repository<Group>,
    @InjectRepository(Enrollment)
    private readonly enrollmentRepository: Repository<Enrollment>,
  ) {}

  async findAll(query: PaginationQueryDto) {
    const { page = 1, limit = 20, search } = query;
    const { field, direction } = parseSort(query.sort, '-createdAt');

    const qb = this.repository.createQueryBuilder('group')
      .leftJoinAndSelect('group.section', 'section')
      .leftJoinAndSelect('section.branch', 'branch')
      .leftJoinAndSelect('group.teamLeader', 'teamLeader')
      .andWhere('group.deleted_at IS NULL');

    if (search) {
      qb.where('group.name ILIKE :search', { search: `%${search}%` });
    }

    qb.orderBy(`group.${field}`, direction)
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data: data.map(GroupResponseDto.fromEntity),
      meta: createPaginationMeta(total, query),
    };
  }

  async findOne(id: string) {
    const entity = await this.repository.findOne({
      where: { id },
      relations: { section: { branch: true }, teamLeader: true },
    });
    if (!entity) {
      throw new NotFoundException(`Group with id "${id}" not found`);
    }
    return GroupResponseDto.fromEntity(entity);
  }

  async create(dto: CreateGroupDto) {
    const entity = this.repository.create(dto);
    const saved = await this.repository.save(entity);
    return this.findOne(saved.id);
  }

  async update(id: string, dto: UpdateGroupDto) {
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException(`Group with id "${id}" not found`);
    }
    Object.assign(entity, dto);
    const saved = await this.repository.save(entity);
    return this.findOne(saved.id);
  }

  async remove(id: string) {
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException(`Group with id "${id}" not found`);
    }
    const enrollmentCount = await this.enrollmentRepository.count({
      where: { groupId: id },
    });
    if (enrollmentCount > 0) {
      throw new ConflictException(
        `Cannot delete group: ${enrollmentCount} enrollment(s) are still assigned. Remove enrollments first.`,
      );
    }
    await this.repository.softRemove(entity);
  }

  async findStudentsByGroup(groupId: string) {
    const enrollments = await this.enrollmentRepository.find({
      where: { groupId },
      relations: { user: true },
    });

    return enrollments.map((e) => ({
      id: e.user.id,
      name: e.user.name,
      email: e.user.email,
      rollNumber: e.rollNumber,
    }));
  }
}
