import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../../common/base/base.entity';
import { Opportunity } from '../../opportunities/entities/opportunity.entity';
import { Enrollment } from '../../enrollments/entities/enrollment.entity';
import { User } from '../../users/entities/user.entity';

export enum ParticipationStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  SUBMITTED = 'submitted',
  VERIFIED = 'verified',
  COMPLETED = 'completed',
  INCOMPLETE = 'incomplete',
  REJECTED = 'rejected',
}

@Entity('participations')
@Index('uq_participations_opportunity_enrollment', ['opportunityId', 'enrollmentId'], {
  unique: true,
})
export class Participation extends BaseEntity {
  @Column({ name: 'opportunity_id' })
  opportunityId: string;

  @Column({ name: 'enrollment_id' })
  enrollmentId: string;

  @Column({ type: 'varchar', length: 20, default: 'not_started' })
  status: ParticipationStatus;

  @Column({ name: 'team_leader_user_id', type: 'varchar', nullable: true })
  teamLeaderUserId: string | null;

  @Column({ name: 'started_at', type: 'timestamptz', nullable: true })
  startedAt: Date | null;

  @Column({ name: 'submitted_at', type: 'timestamptz', nullable: true })
  submittedAt: Date | null;

  @Column({ name: 'verified_at', type: 'timestamptz', nullable: true })
  verifiedAt: Date | null;

  @Column({ name: 'verified_by', type: 'varchar', nullable: true })
  verifiedBy: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @ManyToOne(() => Opportunity)
  @JoinColumn({ name: 'opportunity_id' })
  opportunity: Opportunity;

  @ManyToOne(() => Enrollment)
  @JoinColumn({ name: 'enrollment_id' })
  enrollment: Enrollment;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'team_leader_user_id' })
  teamLeader: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'verified_by' })
  verifier: User;
}
