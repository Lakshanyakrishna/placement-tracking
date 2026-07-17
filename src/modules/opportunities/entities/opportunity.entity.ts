import { Entity, Column, ManyToOne, JoinColumn, Check, DeleteDateColumn } from 'typeorm';
import { BaseEntity } from '../../../common/base/base.entity';
import { AcademicPeriod } from '../../academic-periods/entities/academic-period.entity';
import { User } from '../../users/entities/user.entity';

export enum OpportunityState {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  OPEN = 'open',
  CLOSED = 'closed',
  ARCHIVED = 'archived',
  CANCELLED = 'cancelled',
}

export enum OpportunityType {
  INTERNSHIP = 'internship',
  PLACEMENT = 'placement',
  TRAINING = 'training',
  WORKSHOP = 'workshop',
  HACKATHON = 'hackathon',
  OTHER = 'other',
}

@Entity('opportunities')
@Check('ck_opportunities_max_submissions', '"max_submissions" IS NULL OR "max_submissions" > 0')
export class Opportunity extends BaseEntity {
  @Column({ name: 'academic_period_id' })
  academicPeriodId: string;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text', default: '' })
  description: string;

  @Column({ name: 'application_link', type: 'varchar', length: 2048, nullable: true })
  applicationLink: string | null;

  @Column({ name: 'opportunity_type', type: 'varchar', length: 20 })
  opportunityType: OpportunityType;

  @Column({ type: 'varchar', length: 20, default: 'draft' })
  state: OpportunityState;

  @Column({ name: 'created_by' })
  createdBy: string;

  @Column({ name: 'opens_at', type: 'timestamptz', nullable: true })
  opensAt: Date | null;

  @Column({ name: 'closes_at', type: 'timestamptz', nullable: true })
  closesAt: Date | null;

  @Column({ name: 'verification_deadline', type: 'interval', default: '7 days' })
  verificationDeadline: string;

  @Column({ name: 'require_proof', default: true })
  requireProof: boolean;

  @Column({ name: 'max_submissions', type: 'integer', nullable: true })
  maxSubmissions: number | null;

  @Column({ name: 'allow_group_submission', default: false })
  allowGroupSubmission: boolean;

  @Column({ name: 'target_branch_id', type: 'uuid', nullable: true })
  targetBranchId: string | null;

  @Column({ name: 'target_section_id', type: 'uuid', nullable: true })
  targetSectionId: string | null;

  @Column({ name: 'target_batch_id', type: 'uuid', nullable: true })
  targetBatchId: string | null;

  @Column({ name: 'target_group_id', type: 'uuid', nullable: true })
  targetGroupId: string | null;

  @ManyToOne(() => AcademicPeriod)
  @JoinColumn({ name: 'academic_period_id' })
  academicPeriod: AcademicPeriod;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  createdByUser: User;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz' })
  deletedAt: Date | null;
}
