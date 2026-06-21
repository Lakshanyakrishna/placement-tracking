import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { DashboardService } from './dashboard.service';
import { AdminDashboardDto } from './dto/admin-dashboard.dto';
import { MentorDashboardDto } from './dto/mentor-dashboard.dto';
import { TeamLeaderDashboardDto } from './dto/team-leader-dashboard.dto';
import { StudentDashboardDto } from './dto/student-dashboard.dto';

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('admin')
  @Roles('admin')
  @ApiOperation({ summary: 'Admin dashboard metrics' })
  @ApiResponse({ status: 200, description: 'Admin dashboard data', type: AdminDashboardDto })
  async getAdmin(): Promise<AdminDashboardDto> {
    return this.dashboardService.getAdminDashboard();
  }

  @Get('mentor')
  @Roles('admin', 'mentor')
  @ApiOperation({ summary: 'Mentor dashboard metrics for the authenticated mentor' })
  @ApiResponse({ status: 200, description: 'Mentor dashboard data', type: MentorDashboardDto })
  async getMentor(@CurrentUser('id') userId: string): Promise<MentorDashboardDto> {
    return this.dashboardService.getMentorDashboard(userId);
  }

  @Get('team-leader')
  @Roles('admin', 'team_leader')
  @ApiOperation({ summary: 'Team leader dashboard metrics for the authenticated team leader' })
  @ApiResponse({ status: 200, description: 'Team leader dashboard data', type: TeamLeaderDashboardDto })
  async getTeamLeader(@CurrentUser('id') userId: string): Promise<TeamLeaderDashboardDto> {
    return this.dashboardService.getTeamLeaderDashboard(userId);
  }

  @Get('student')
  @Roles('admin', 'student')
  @ApiOperation({ summary: 'Student dashboard metrics for the authenticated student' })
  @ApiResponse({ status: 200, description: 'Student dashboard data', type: StudentDashboardDto })
  async getStudent(@CurrentUser('id') userId: string): Promise<StudentDashboardDto> {
    return this.dashboardService.getStudentDashboard(userId);
  }
}
