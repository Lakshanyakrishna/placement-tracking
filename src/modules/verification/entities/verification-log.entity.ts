import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/base/base.entity';
import { Submission } from '../../submissions/entities/submission.entity';
import { User } from '../../users/entities/user.entity';

export enum VerificationAction {
  SUBMITTED = 'submitted',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
  AUTO_VERIFIED = 'auto_verified',
  ESCALATED = 'escalated',
  OVERRIDDEN = 'overridden',
  REMINDED = 'reminded',
}

@Entity('verification_logs')
export class VerificationLog extends BaseEntity {
  @Column({ name: 'submission_id' })
  submissionId: string;

  @Column({ type: 'varchar', length: 20 })
  action: VerificationAction;

  @Column({ name: 'actor_user_id', type: 'varchar', nullable: true })
  actorUserId: string | null;

  @Column({ type: 'text', nullable: true })
  reason: string | null;

  @ManyToOne(() => Submission)
  @JoinColumn({ name: 'submission_id' })
  submission: Submission;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'actor_user_id' })
  actor: User;
}
