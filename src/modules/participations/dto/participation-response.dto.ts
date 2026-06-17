import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Participation, ParticipationStatus } from '../entities/participation.entity';

export class ParticipationResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() opportunityId: string;
  @ApiProperty() enrollmentId: string;
  @ApiProperty({ enum: ParticipationStatus }) status: ParticipationStatus;
  @ApiPropertyOptional() teamLeaderUserId: string | null;
  @ApiPropertyOptional() startedAt: Date | null;
  @ApiPropertyOptional() submittedAt: Date | null;
  @ApiPropertyOptional() verifiedAt: Date | null;
  @ApiPropertyOptional() verifiedBy: string | null;
  @ApiPropertyOptional() notes: string | null;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
  @ApiPropertyOptional() opportunityTitle?: string;
  @ApiPropertyOptional() opportunityType?: string;
  @ApiPropertyOptional() enrollmentUserId?: string;
  @ApiPropertyOptional() enrollmentRollNumber?: string | null;
  @ApiPropertyOptional() userName?: string;
  @ApiPropertyOptional() userEmail?: string;

  static fromEntity(entity: Participation): ParticipationResponseDto {
    return {
      id: entity.id,
      opportunityId: entity.opportunityId,
      enrollmentId: entity.enrollmentId,
      status: entity.status,
      teamLeaderUserId: entity.teamLeaderUserId,
      startedAt: entity.startedAt,
      submittedAt: entity.submittedAt,
      verifiedAt: entity.verifiedAt,
      verifiedBy: entity.verifiedBy,
      notes: entity.notes,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      opportunityTitle: (entity as any).opportunity?.title,
      opportunityType: (entity as any).opportunity?.opportunityType,
      enrollmentUserId: (entity as any).enrollment?.userId,
      enrollmentRollNumber: (entity as any).enrollment?.rollNumber,
      userName: (entity as any).enrollment?.user?.name,
      userEmail: (entity as any).enrollment?.user?.email,
    };
  }
}
