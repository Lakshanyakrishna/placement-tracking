import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../../common/base/base.entity';
import { User } from '../../users/entities/user.entity';

export enum ImportHistoryType {
  STUDENTS = 'students',
  GROUPS = 'groups',
  TEAM_LEADERS = 'team_leaders',
  MENTORS = 'mentors',
}

export enum ImportHistoryStatus {
  SUCCESS = 'success',
  PARTIAL = 'partial',
  FAILED = 'failed',
}

@Entity('import_history')
@Index('idx_import_history_type', ['importType'])
@Index('idx_import_history_imported_by', ['importedBy'])
export class ImportHistory extends BaseEntity {
  @Column({ name: 'import_type', length: 20 })
  importType: ImportHistoryType;

  @Column({ name: 'file_name', length: 255 })
  fileName: string;

  @Column({ name: 'status', length: 10 })
  status: ImportHistoryStatus;

  @Column({ name: 'total_rows', type: 'int' })
  totalRows: number;

  @Column({ name: 'success_count', type: 'int' })
  successCount: number;

  @Column({ name: 'failure_count', type: 'int' })
  failureCount: number;

  @Column({ type: 'jsonb', nullable: true })
  errors: Array<{ row: number; column: string; message: string; value?: string }> | null;

  @Column({ name: 'imported_by' })
  importedBy: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'imported_by' })
  importedByUser: User;
}
