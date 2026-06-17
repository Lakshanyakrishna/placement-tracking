import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/base/base.entity';
import { Participation } from '../../participations/entities/participation.entity';
import { User } from '../../users/entities/user.entity';

@Entity('submissions')
export class Submission extends BaseEntity {
  @Column({ name: 'participation_id' })
  participationId: string;

  @Column({ name: 'submitted_by' })
  submittedBy: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'external_links', type: 'jsonb', nullable: true })
  externalLinks: object | null;

  @Column({ name: 'submitted_at', type: 'timestamptz', default: () => 'NOW()' })
  submittedAt: Date;

  @Column({ name: 'is_late', default: false })
  isLate: boolean;

  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason: string | null;

  @ManyToOne(() => Participation)
  @JoinColumn({ name: 'participation_id' })
  participation: Participation;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'submitted_by' })
  submitter: User;
}
