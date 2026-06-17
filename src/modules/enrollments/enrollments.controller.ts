import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { EnrollmentsService } from './enrollments.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';
import { EnrollmentResponseDto } from './dto/enrollment-response.dto';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

@ApiTags('Enrollments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('enrollments')
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Get()
  @ApiOperation({ summary: 'Get paginated list of enrollments' })
  @ApiResponse({ status: 200, description: 'Paginated enrollments' })
  async findAll(@Query() query: PaginationQueryDto) {
    return this.enrollmentsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single enrollment by ID' })
  @ApiResponse({ status: 200, type: EnrollmentResponseDto })
  @ApiResponse({ status: 404, description: 'Enrollment not found' })
  async findOne(@Param('id') id: string): Promise<EnrollmentResponseDto> {
    const entity = await this.enrollmentsService.findOne(id);
    return EnrollmentResponseDto.fromEntity(entity);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new enrollment' })
  @ApiResponse({ status: 201, type: EnrollmentResponseDto })
  @ApiResponse({ status: 409, description: 'Enrollment already exists for this user and academic period' })
  async create(@Body() dto: CreateEnrollmentDto): Promise<EnrollmentResponseDto> {
    const entity = await this.enrollmentsService.create(dto);
    const saved = await this.enrollmentsService.findOne(entity.id);
    return EnrollmentResponseDto.fromEntity(saved);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an enrollment' })
  @ApiResponse({ status: 200, type: EnrollmentResponseDto })
  @ApiResponse({ status: 404, description: 'Enrollment not found' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateEnrollmentDto,
  ): Promise<EnrollmentResponseDto> {
    const entity = await this.enrollmentsService.update(id, dto);
    return EnrollmentResponseDto.fromEntity(entity);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an enrollment' })
  @ApiResponse({ status: 204, description: 'Enrollment deleted' })
  @ApiResponse({ status: 404, description: 'Enrollment not found' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.enrollmentsService.remove(id);
  }
}
