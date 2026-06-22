import { Entity, Column, DeleteDateColumn } from 'typeorm';
import { BaseEntity } from '../../../common/base/base.entity';

@Entity('branches')
export class Branch extends BaseEntity {
  @Column({ length: 20, unique: true })
  code: string;

  @Column({ length: 255, unique: true })
  name: string;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date | null;
}
