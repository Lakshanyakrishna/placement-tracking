import { ApiProperty } from '@nestjs/swagger';
import { Opportunity, OpportunityState, OpportunityType } from '../entities/opportunity.entity';
import { TargetResponseDto } from './target-response.dto';
import { RoundResponseDto } from './round-response.dto';

export class OpportunityResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() academicPeriodId: string;
  @ApiProperty() title: string;
  @ApiProperty() description: string;
  @ApiProperty({ nullable: true }) applicationLink: string | null;
  @ApiProperty({ nullable: true }) meetingLink: string | null;
  @ApiProperty({ enum: OpportunityType }) opportunityType: OpportunityType;
  @ApiProperty({ enum: OpportunityState }) state: OpportunityState;
  @ApiProperty() createdBy: string;
  @ApiProperty({ nullable: true }) opensAt: Date | null;
  @ApiProperty({ nullable: true }) closesAt: Date | null;
  @ApiProperty() verificationDeadline: string;
  @ApiProperty() requireProof: boolean;
  @ApiProperty({ nullable: true }) maxSubmissions: number | null;
  @ApiProperty() allowGroupSubmission: boolean;
  @ApiProperty({ nullable: true }) targetGroupId: string | null;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
  @ApiProperty({ nullable: true }) targets?: TargetResponseDto[];
  @ApiProperty({ nullable: true }) rounds?: RoundResponseDto[];

  static fromEntity(entity: Opportunity, targets?: TargetResponseDto[], rounds?: RoundResponseDto[]): OpportunityResponseDto {
    return {
      id: entity.id,
      academicPeriodId: entity.academicPeriodId,
      title: entity.title,
      description: entity.description,
      applicationLink: entity.applicationLink,
      meetingLink: entity.meetingLink,
      opportunityType: entity.opportunityType,
      state: entity.state,
      createdBy: entity.createdBy,
      opensAt: entity.opensAt,
      closesAt: entity.closesAt,
      verificationDeadline: entity.verificationDeadline,
      requireProof: entity.requireProof,
      maxSubmissions: entity.maxSubmissions,
      allowGroupSubmission: entity.allowGroupSubmission,
      targetGroupId: entity.targetGroupId,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      targets,
      rounds,
    };
  }
}
