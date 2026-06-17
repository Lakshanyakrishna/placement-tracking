import { Entity, Column, ManyToOne, JoinColumn, Index, Check } from 'typeorm';
import { BaseEntity } from '../../../common/base/base.entity';
import { User } from '../../users/entities/user.entity';

export enum UserRole {
  ADMIN = 'admin',
  MENTOR = 'mentor',
  TEAM_LEADER = 'team_leader',
}

export enum RoleScopeType {
  GLOBAL = 'global',
  SECTION = 'section',
  GROUP = 'group',
  OPPORTUNITY = 'opportunity',
}

@Entity('role_assignments')
@Index('idx_role_assignments_user', ['userId'])
@Index('idx_role_assignments_role_scope', ['role', 'scopeType', 'scopeId'])
@Check('ck_role_assignments_valid_range', '"valid_to" IS NULL OR "valid_to" > "valid_from"')
@Check(
  'ck_role_assignments_scope_id',
  '("scope_type" = \'global\' AND "scope_id" IS NULL) OR ("scope_type" != \'global\' AND "scope_id" IS NOT NULL)',
)
export class RoleAssignment extends BaseEntity {
  @Column({ name: 'user_id' })
  userId: string;

  @Column({ type: 'varchar', length: 20 })
  role: UserRole;

  @Column({ name: 'scope_type', type: 'varchar', length: 20 })
  scopeType: RoleScopeType;

  @Column({ name: 'scope_id', type: 'uuid', nullable: true })
  scopeId: string | null;

  @Column({ name: 'granted_by' })
  grantedBy: string;

  @Column({ name: 'valid_from', type: 'timestamptz', default: () => 'NOW()' })
  validFrom: Date;

  @Column({ name: 'valid_to', type: 'timestamptz', nullable: true })
  validTo: Date | null;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'granted_by' })
  grantedByUser: User;
}
