import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, MoreThanOrEqual, IsNull, In, Repository } from 'typeorm';
import { RoleAssignment, UserRole, RoleScopeType } from './entities/role-assignment.entity';
import { Section } from '../sections/entities/section.entity';
import { Group } from '../groups/entities/group.entity';

@Injectable()
export class IamService {
  private readonly logger = new Logger(IamService.name);

  constructor(
    @InjectRepository(RoleAssignment)
    private readonly roleAssignmentRepository: Repository<RoleAssignment>,
    @InjectRepository(Section)
    private readonly sectionRepository: Repository<Section>,
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
  ) {}

  async findActiveRolesByUser(userId: string): Promise<RoleAssignment[]> {
    const now = new Date();
    return this.roleAssignmentRepository.find({
      where: [
        { userId, validFrom: LessThanOrEqual(now), validTo: IsNull() },
        { userId, validFrom: LessThanOrEqual(now), validTo: MoreThanOrEqual(now) },
      ],
    });
  }

  async findMentorSections(userId: string): Promise<Section[]> {
    const now = new Date();
    const assignments = await this.roleAssignmentRepository.find({
      where: [
        { userId, role: UserRole.MENTOR, scopeType: RoleScopeType.SECTION, validFrom: LessThanOrEqual(now), validTo: IsNull() },
        { userId, role: UserRole.MENTOR, scopeType: RoleScopeType.SECTION, validFrom: LessThanOrEqual(now), validTo: MoreThanOrEqual(now) },
      ],
    });

    if (assignments.length === 0) return [];

    const scopeIds = assignments.map((a) => a.scopeId).filter(Boolean) as string[];
    if (scopeIds.length === 0) return [];

    return this.sectionRepository.find({
      where: { id: In(scopeIds) },
      relations: ['branch'],
    });
  }

  async findTeamLeaderGroups(userId: string): Promise<Group[]> {
    const now = new Date();
    const assignments = await this.roleAssignmentRepository.find({
      where: [
        { userId, role: UserRole.TEAM_LEADER, scopeType: RoleScopeType.GROUP, validFrom: LessThanOrEqual(now), validTo: IsNull() },
        { userId, role: UserRole.TEAM_LEADER, scopeType: RoleScopeType.GROUP, validFrom: LessThanOrEqual(now), validTo: MoreThanOrEqual(now) },
      ],
    });

    if (assignments.length === 0) return [];

    const scopeIds = assignments.map((a) => a.scopeId).filter(Boolean) as string[];
    if (scopeIds.length === 0) return [];

    return this.groupRepository.find({
      where: { id: In(scopeIds) },
      relations: ['section'],
    });
  }
}
