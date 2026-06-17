import { Entity, Column, ManyToOne, JoinColumn, Check } from 'typeorm';
import { BaseEntity } from '../../../common/base/base.entity';
import { AcademicYear } from '../../academic-years/entities/academic-year.entity';

export enum AcademicPeriodType {
  SEMESTER = 'semester',
  TRIMESTER = 'trimester',
  TERM = 'term',
}

@Entity('academic_periods')
@Check('ck_academic_periods_dates', '"end_date" > "start_date"')
export class AcademicPeriod extends BaseEntity {
  @Column({ name: 'academic_year_id' })
  academicYearId: string;

  @Column({ length: 100 })
  label: string;

  @Column({ type: 'varchar', length: 20 })
  type: AcademicPeriodType;

  @Column({ name: 'start_date', type: 'date' })
  startDate: Date;

  @Column({ name: 'end_date', type: 'date' })
  endDate: Date;

  @Column({ name: 'is_active', default: false })
  isActive: boolean;

  @ManyToOne(() => AcademicYear)
  @JoinColumn({ name: 'academic_year_id' })
  academicYear: AcademicYear;
}
