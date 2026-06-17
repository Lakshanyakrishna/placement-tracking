import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Submission } from '../entities/submission.entity';
import { FileReference } from '../entities/file-reference.entity';

export class SubmissionFileDto {
  @ApiProperty() id: string;
  @ApiProperty() fileReferenceId: string;
  @ApiProperty() bucket: string;
  @ApiProperty() key: string;
  @ApiProperty() originalFilename: string;
  @ApiProperty() mimeType: string;
  @ApiProperty() sizeBytes: number;
  @ApiProperty() createdAt: Date;

  static fromEntity(fileRef: FileReference): SubmissionFileDto {
    return {
      id: (fileRef as any).submissionFileId ?? '',
      fileReferenceId: fileRef.id,
      bucket: fileRef.bucket,
      key: fileRef.key,
      originalFilename: fileRef.originalFilename,
      mimeType: fileRef.mimeType,
      sizeBytes: Number(fileRef.sizeBytes),
      createdAt: fileRef.createdAt,
    };
  }
}

export class SubmissionResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() participationId: string;
  @ApiProperty() submittedBy: string;
  @ApiPropertyOptional() description: string | null;
  @ApiPropertyOptional({ type: Object }) externalLinks: object | null;
  @ApiProperty() submittedAt: Date;
  @ApiProperty() isLate: boolean;
  @ApiPropertyOptional() rejectionReason: string | null;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
  @ApiPropertyOptional({ type: [SubmissionFileDto] }) files?: SubmissionFileDto[];

  static fromEntity(entity: Submission, files?: SubmissionFileDto[]): SubmissionResponseDto {
    return {
      id: entity.id,
      participationId: entity.participationId,
      submittedBy: entity.submittedBy,
      description: entity.description,
      externalLinks: entity.externalLinks,
      submittedAt: entity.submittedAt,
      isLate: entity.isLate,
      rejectionReason: entity.rejectionReason,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      files,
    };
  }
}
