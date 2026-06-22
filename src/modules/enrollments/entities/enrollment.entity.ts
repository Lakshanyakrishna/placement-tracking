import { Entity, Column, ManyToOne, JoinColumn, Index, DeleteDateColumn } from 'typeorm';
import { BaseEntity } from '../../../common/base/base.entity';
import { User } from '../../users/entities/user.entity';
import { AcademicPeriod } from '../../academic-periods/entities/academic-period.entity';
import { Branch } from '../../branches/entities/branch.entity';
import { Section } from '../../sections/entities/section.entity';
import { Group } from '../../groups/entities/group.entity';
import { Batch } from '../../batches/entities/batch.entity';

@Entity('enrollments')
@Index('uq_enrollments_user_period', ['userId', 'academicPeriodId'], { unique: true, where: 'deleted_at IS NULL' })
export class Enrollment extends BaseEntity {
  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'academic_period_id' })
  academicPeriodId: string;

  @Column({ name: 'branch_id' })
  branchId: string;

  @Column({ name: 'section_id' })
  sectionId: string;

  @Column({ name: 'batch_id' })
  batchId: string;

  @Column({ name: 'group_id', type: 'varchar', nullable: true })
  groupId: string | null;

  @Column({ name: 'roll_number', type: 'varchar', length: 50, nullable: true })
  rollNumber: string | null;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'enrolled_at', type: 'timestamptz', default: () => 'NOW()' })
  enrolledAt: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => AcademicPeriod)
  @JoinColumn({ name: 'academic_period_id' })
  academicPeriod: AcademicPeriod;

  @ManyToOne(() => Branch)
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @ManyToOne(() => Section)
  @JoinColumn({ name: 'section_id' })
  section: Section;

  @ManyToOne(() => Group)
  @JoinColumn({ name: 'group_id' })
  group: Group;

  @ManyToOne(() => Batch)
  @JoinColumn({ name: 'batch_id' })
  batch: Batch;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date | null;
}
