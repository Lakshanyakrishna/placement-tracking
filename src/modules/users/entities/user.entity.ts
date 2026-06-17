import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/base/base.entity';

@Entity('users')
@Index('uq_users_email', { synchronize: false })
export class User extends BaseEntity {
  @Column({ length: 320, unique: true })
  email: string;

  @Column({ name: 'password_hash', type: 'text' })
  passwordHash: string;

  @Column({ length: 255 })
  name: string;

  @Column({ name: 'contact_phone', type: 'varchar', length: 50, nullable: true })
  contactPhone: string | null;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'must_change_password', default: false })
  mustChangePassword: boolean;
}
