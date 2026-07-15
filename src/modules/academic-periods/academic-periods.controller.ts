import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AcademicPeriodsService } from './academic-periods.service';
import { AcademicPeriodResponseDto } from './dto/academic-period-response.dto';

@ApiTags('Academic Periods')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('academic-periods')
export class AcademicPeriodsController {
  constructor(private readonly academicPeriodsService: AcademicPeriodsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all academic periods' })
  @ApiResponse({ status: 200, description: 'List of academic periods', type: [AcademicPeriodResponseDto] })
  async findAll(): Promise<AcademicPeriodResponseDto[]> {
    return this.academicPeriodsService.findAll();
  }
}
