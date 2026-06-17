import { ApiProperty } from '@nestjs/swagger';
import { Section } from '../../sections/entities/section.entity';

export class MentorSectionResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() branchId: string;
  @ApiProperty() academicPeriodId: string;
  @ApiProperty() code: string;
  @ApiProperty({ nullable: true }) mentorUserId: string | null;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
  @ApiProperty({ example: 'CSE' }) branchCode?: string;
  @ApiProperty({ example: 'Computer Science & Engineering' }) branchName?: string;

  static fromEntity(section: Section): MentorSectionResponseDto {
    return {
      id: section.id,
      branchId: section.branchId,
      academicPeriodId: section.academicPeriodId,
      code: section.code,
      mentorUserId: section.mentorUserId,
      createdAt: section.createdAt,
      updatedAt: section.updatedAt,
      branchCode: (section as any).branch?.code,
      branchName: (section as any).branch?.name,
    };
  }
}
