import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/base/base.entity';
import { User } from '../../users/entities/user.entity';

export enum NotificationType {
  SUBMISSION_PENDING = 'submission_pending',
  SUBMISSION_VERIFIED = 'submission_verified',
  SUBMISSION_REJECTED = 'submission_rejected',
  VERIFICATION_ESCALATED = 'verification_escalated',
  OPPORTUNITY_PUBLISHED = 'opportunity_published',
  OPPORTUNITY_OPENED = 'opportunity_opened',
  MENTOR_ASSIGNED = 'mentor_assigned',
  TL_ASSIGNED = 'tl_assigned',
  DEADLINE_REMINDER = 'deadline_reminder',
}

export enum NotificationChannel {
  IN_APP = 'in_app',
  EMAIL = 'email',
  BOTH = 'both',
}

export enum NotificationDeliveryStatus {
  PENDING = 'pending',
  DELIVERED = 'delivered',
  FAILED = 'failed',
}

@Entity('notifications')
export class Notification extends BaseEntity {
  @Column({ name: 'user_id' })
  userId: string;

  @Column({ type: 'varchar', length: 30 })
  type: NotificationType;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text' })
  body: string;

  @Column({ type: 'varchar', length: 10, default: 'in_app' })
  channel: NotificationChannel;

  @Column({ name: 'delivery_status', type: 'varchar', length: 10, default: 'pending' })
  deliveryStatus: NotificationDeliveryStatus;

  @Column({ name: 'read_at', type: 'timestamptz', nullable: true })
  readAt: Date | null;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
