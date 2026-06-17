import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/base/base.entity';
import { Submission } from './submission.entity';
import { FileReference } from './file-reference.entity';

@Entity('submission_files')
export class SubmissionFile extends BaseEntity {
  @Column({ name: 'submission_id' })
  submissionId: string;

  @Column({ name: 'file_reference_id' })
  fileReferenceId: string;

  @ManyToOne(() => Submission, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'submission_id' })
  submission: Submission;

  @ManyToOne(() => FileReference)
  @JoinColumn({ name: 'file_reference_id' })
  fileReference: FileReference;
}
