import { Entity, Column, ManyToOne, JoinColumn, Index, DeleteDateColumn } from 'typeorm';
import { BaseEntity } from '../../../common/base/base.entity';
import { Branch } from '../../branches/entities/branch.entity';
import { AcademicPeriod } from '../../academic-periods/entities/academic-period.entity';
import { User } from '../../users/entities/user.entity';

@Entity('sections')
@Index('uq_sections_period_branch_code', ['academicPeriodId', 'branchId', 'code'], { unique: true, where: 'deleted_at IS NULL' })
export class Section extends BaseEntity {
  @Column({ name: 'branch_id' })
  branchId: string;

  @Column({ name: 'academic_period_id' })
  academicPeriodId: string;

  @Column({ length: 50 })
  code: string;

  @Column({ name: 'mentor_user_id', type: 'varchar', nullable: true })
  mentorUserId: string | null;

  @ManyToOne(() => Branch)
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @ManyToOne(() => AcademicPeriod)
  @JoinColumn({ name: 'academic_period_id' })
  academicPeriod: AcademicPeriod;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'mentor_user_id' })
  mentor: User;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date | null;
}
