import { Entity, Column, ManyToOne, JoinColumn, Check } from 'typeorm';
import { BaseEntity } from '../../../common/base/base.entity';
import { User } from '../../users/entities/user.entity';

@Entity('file_references')
@Check('ck_file_references_size', '"size_bytes" > 0')
export class FileReference extends BaseEntity {
  @Column({ length: 255 })
  bucket: string;

  @Column({ type: 'text' })
  key: string;

  @Column({ length: 255 })
  originalFilename: string;

  @Column({ name: 'mime_type', length: 127 })
  mimeType: string;

  @Column({ name: 'size_bytes', type: 'bigint' })
  sizeBytes: number;

  @Column({ name: 'uploaded_by' })
  uploadedBy: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'uploaded_by' })
  uploader: User;
}
