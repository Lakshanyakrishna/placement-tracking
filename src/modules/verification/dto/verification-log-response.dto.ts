import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VerificationLog, VerificationAction } from '../entities/verification-log.entity';

export class VerificationLogResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() submissionId: string;
  @ApiProperty({ enum: VerificationAction }) action: VerificationAction;
  @ApiPropertyOptional() actorUserId: string | null;
  @ApiPropertyOptional() reason: string | null;
  @ApiProperty() createdAt: Date;
  @ApiPropertyOptional() actorName?: string;
  @ApiPropertyOptional() participationStatus?: string;

  static fromEntity(log: VerificationLog): VerificationLogResponseDto {
    return {
      id: log.id,
      submissionId: log.submissionId,
      action: log.action,
      actorUserId: log.actorUserId,
      reason: log.reason,
      createdAt: log.createdAt,
      actorName: (log as any).actor?.name,
      participationStatus: (log as any).submission?.participation?.status,
    };
  }
}
