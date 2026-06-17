import { ApiProperty } from '@nestjs/swagger';
import { OpportunityTarget, TargetType } from '../entities/opportunity-target.entity';

export class TargetResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() opportunityId: string;
  @ApiProperty({ enum: TargetType }) targetType: TargetType;
  @ApiProperty({ nullable: true }) branchId: string | null;
  @ApiProperty({ nullable: true }) sectionId: string | null;
  @ApiProperty({ nullable: true }) groupId: string | null;
  @ApiProperty({ nullable: true }) batchId: string | null;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
  @ApiProperty({ nullable: true }) branchName?: string;
  @ApiProperty({ nullable: true }) sectionCode?: string;
  @ApiProperty({ nullable: true }) groupName?: string;

  static fromEntity(target: OpportunityTarget): TargetResponseDto {
    return {
      id: target.id,
      opportunityId: target.opportunityId,
      targetType: target.targetType,
      branchId: target.branchId,
      sectionId: target.sectionId,
      groupId: target.groupId,
      batchId: target.batchId,
      createdAt: target.createdAt,
      updatedAt: target.updatedAt,
      branchName: (target as any).branch?.name,
      sectionCode: (target as any).section?.code,
      groupName: (target as any).group?.name,
    };
  }
}
