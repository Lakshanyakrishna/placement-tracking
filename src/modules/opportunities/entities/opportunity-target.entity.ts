import { Entity, Column, ManyToOne, JoinColumn, Check } from 'typeorm';
import { BaseEntity } from '../../../common/base/base.entity';
import { Opportunity } from './opportunity.entity';
import { Branch } from '../../branches/entities/branch.entity';
import { Section } from '../../sections/entities/section.entity';
import { Group } from '../../groups/entities/group.entity';
import { Batch } from '../../batches/entities/batch.entity';

export enum TargetType {
  ALL = 'all',
  BRANCH = 'branch',
  SECTION = 'section',
  GROUP = 'group',
  BATCH = 'batch',
}

@Entity('opportunity_targets')
@Check(
  'ck_opportunity_targets_single_target',
  `("target_type" = 'all' AND "branch_id" IS NULL AND "section_id" IS NULL AND "group_id" IS NULL AND "batch_id" IS NULL)
   OR ("target_type" = 'branch' AND "branch_id" IS NOT NULL AND "section_id" IS NULL AND "group_id" IS NULL AND "batch_id" IS NULL)
   OR ("target_type" = 'section' AND "branch_id" IS NULL AND "section_id" IS NOT NULL AND "group_id" IS NULL AND "batch_id" IS NULL)
   OR ("target_type" = 'group' AND "branch_id" IS NULL AND "section_id" IS NULL AND "group_id" IS NOT NULL AND "batch_id" IS NULL)
   OR ("target_type" = 'batch' AND "branch_id" IS NULL AND "section_id" IS NULL AND "group_id" IS NULL AND "batch_id" IS NOT NULL)`,
)
export class OpportunityTarget extends BaseEntity {
  @Column({ name: 'opportunity_id' })
  opportunityId: string;

  @Column({ name: 'target_type', type: 'varchar', length: 20 })
  targetType: TargetType;

  @Column({ name: 'branch_id', type: 'varchar', nullable: true })
  branchId: string | null;

  @Column({ name: 'section_id', type: 'varchar', nullable: true })
  sectionId: string | null;

  @Column({ name: 'group_id', type: 'varchar', nullable: true })
  groupId: string | null;

  @Column({ name: 'batch_id', type: 'varchar', nullable: true })
  batchId: string | null;

  @ManyToOne(() => Opportunity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'opportunity_id' })
  opportunity: Opportunity;

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
}
