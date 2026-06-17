import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/base/base.entity';
import { AcademicYear } from '../../academic-years/entities/academic-year.entity';

@Entity('batches')
export class Batch extends BaseEntity {
  @Column({ name: 'academic_year_id' })
  academicYearId: string;

  @Column({ length: 50 })
  label: string;

  @Column({ name: 'graduation_year', type: 'integer' })
  graduationYear: number;

  @ManyToOne(() => AcademicYear)
  @JoinColumn({ name: 'academic_year_id' })
  academicYear: AcademicYear;
}
