import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/base/base.entity';

@Entity('academic_years')
export class AcademicYear extends BaseEntity {
  @Column({ length: 50, unique: true })
  label: string;

  @Column({ name: 'is_active', default: false })
  isActive: boolean;
}
