import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AnalyticsService } from './analytics.service';
import { GroupCertificationSummaryDto } from './dto/certification-breakdown.dto';

@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('certifications')
  @Roles('admin', 'mentor')
  @ApiOperation({ summary: 'Certification completion breakdown by group. Admins see all groups; mentors see only their own section.' })
  @ApiResponse({ status: 200, description: 'Group certification breakdown', type: [GroupCertificationSummaryDto] })
  async getCertificationBreakdown(@CurrentUser() user: any): Promise<GroupCertificationSummaryDto[]> {
    return this.analyticsService.getCertificationBreakdown(user);
  }
}
