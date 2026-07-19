import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/base/base.entity';
import { Opportunity } from './opportunity.entity';

@Entity('opportunity_rounds')
export class OpportunityRound extends BaseEntity {
  @Column({ name: 'opportunity_id' })
  opportunityId: string;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'varchar', length: 2048, nullable: true })
  link: string | null;

  @Column({ name: 'scheduled_at', type: 'timestamptz', nullable: true })
  scheduledAt: Date | null;

  @Column({ type: 'text', default: '' })
  notes: string;

  @Column({ name: 'sequence', type: 'integer', default: 0 })
  sequence: number;

  @ManyToOne(() => Opportunity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'opportunity_id' })
  opportunity: Opportunity;
}
