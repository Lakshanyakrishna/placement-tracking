import { Controller, Get, Param, UseGuards, ForbiddenException } from '@nestjs/common';
import { ApiBearerAuth, ApiNotFoundResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UuidValidationPipe } from '../../common/pipes/uuid-validation.pipe';
import { IamService } from './iam.service';
import { MentorSectionResponseDto } from './dto/mentor-section-response.dto';
import { TeamLeaderGroupResponseDto } from './dto/team-leader-group-response.dto';

@ApiTags('Lookups')
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class IamController {
  constructor(private readonly iamService: IamService) {}

  @Get('mentors/:userId/sections')
  @ApiOkResponse({ type: [MentorSectionResponseDto] })
  @ApiNotFoundResponse({ description: 'No sections found for mentor' })
  async findMentorSections(
    @Param('userId', UuidValidationPipe) userId: string,
    @CurrentUser('id') currentUserId: string,
  ): Promise<MentorSectionResponseDto[]> {
    if (userId !== currentUserId) {
      throw new ForbiddenException('You can only view your own mentor assignments');
    }
    const sections = await this.iamService.findMentorSections(userId);
    return sections.map(MentorSectionResponseDto.fromEntity);
  }

  @Get('team-leaders/:userId/groups')
  @ApiOkResponse({ type: [TeamLeaderGroupResponseDto] })
  @ApiNotFoundResponse({ description: 'No groups found for team leader' })
  async findTeamLeaderGroups(
    @Param('userId', UuidValidationPipe) userId: string,
    @CurrentUser('id') currentUserId: string,
  ): Promise<TeamLeaderGroupResponseDto[]> {
    if (userId !== currentUserId) {
      throw new ForbiddenException('You can only view your own team leader assignments');
    }
    const groups = await this.iamService.findTeamLeaderGroups(userId);
    return groups.map(TeamLeaderGroupResponseDto.fromEntity);
  }
}
