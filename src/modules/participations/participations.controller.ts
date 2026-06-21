import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UuidValidationPipe } from '../../common/pipes/uuid-validation.pipe';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ParticipationsService } from './participations.service';
import { CreateParticipationDto } from './dto/create-participation.dto';
import { UpdateParticipationStatusDto } from './dto/update-participation-status.dto';
import { ParticipationResponseDto } from './dto/participation-response.dto';
import { ParticipationFilterDto } from './dto/participation-filter.dto';
import { PaginationQueryDto, PaginationMetaDto } from '../../common/dto/pagination.dto';

@ApiTags('Participations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('participations')
export class ParticipationsController {
  constructor(private readonly participationsService: ParticipationsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Start participation in an opportunity' })
  @ApiResponse({ status: 201, description: 'Participation created', type: ParticipationResponseDto })
  @ApiResponse({ status: 403, description: 'Not enrolled in the academic period' })
  @ApiResponse({ status: 409, description: 'Already started this opportunity' })
  async create(
    @Body() dto: CreateParticipationDto,
    @CurrentUser('id') userId: string,
  ): Promise<ParticipationResponseDto> {
    return this.participationsService.create(dto, userId);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get my participations' })
  @ApiResponse({ status: 200, description: 'My participations' })
  async findMyParticipations(
    @Query() query: ParticipationFilterDto,
    @CurrentUser('id') userId: string,
  ): Promise<{ data: ParticipationResponseDto[]; meta: PaginationMetaDto }> {
    return this.participationsService.findMyParticipations(query, userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a participation by ID' })
  @ApiResponse({ status: 200, description: 'Participation found', type: ParticipationResponseDto })
  @ApiResponse({ status: 404, description: 'Participation not found' })
  async findOne(
    @Param('id', UuidValidationPipe) id: string,
  ): Promise<ParticipationResponseDto> {
    return this.participationsService.findOne(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update participation status with transition validation' })
  @ApiResponse({ status: 200, description: 'Status updated', type: ParticipationResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  @ApiResponse({ status: 404, description: 'Participation not found' })
  async updateStatus(
    @Param('id', UuidValidationPipe) id: string,
    @Body() dto: UpdateParticipationStatusDto,
    @CurrentUser('id') userId: string,
  ): Promise<ParticipationResponseDto> {
    return this.participationsService.updateStatus(id, dto, userId);
  }

  @Get('opportunity/:opportunityId')
  @Roles('admin', 'mentor', 'team_leader')
  @ApiOperation({ summary: 'Get participations by opportunity' })
  @ApiResponse({ status: 200, description: 'Participations for opportunity' })
  async findByOpportunity(
    @Param('opportunityId', UuidValidationPipe) opportunityId: string,
    @Query() query: PaginationQueryDto,
  ): Promise<{ data: ParticipationResponseDto[]; meta: PaginationMetaDto }> {
    return this.participationsService.findByOpportunity(opportunityId, query);
  }

  @Get('group/:groupId')
  @Roles('admin', 'mentor', 'team_leader')
  @ApiOperation({ summary: 'Get participations by group' })
  @ApiResponse({ status: 200, description: 'Participations for group' })
  async findByGroup(
    @Param('groupId', UuidValidationPipe) groupId: string,
    @Query() query: PaginationQueryDto,
  ): Promise<{ data: ParticipationResponseDto[]; meta: PaginationMetaDto }> {
    return this.participationsService.findByGroup(groupId, query);
  }

  @Get('section/:sectionId')
  @Roles('admin', 'mentor')
  @ApiOperation({ summary: 'Get participations by section' })
  @ApiResponse({ status: 200, description: 'Participations for section' })
  async findBySection(
    @Param('sectionId', UuidValidationPipe) sectionId: string,
    @Query() query: PaginationQueryDto,
  ): Promise<{ data: ParticipationResponseDto[]; meta: PaginationMetaDto }> {
    return this.participationsService.findBySection(sectionId, query);
  }

  @Get('mentor/:mentorId')
  @Roles('admin', 'mentor')
  @ApiOperation({ summary: 'Get participations by mentor' })
  @ApiResponse({ status: 200, description: 'Participations for mentor sections' })
  async findByMentor(
    @Param('mentorId', UuidValidationPipe) mentorId: string,
    @Query() query: PaginationQueryDto,
  ): Promise<{ data: ParticipationResponseDto[]; meta: PaginationMetaDto }> {
    return this.participationsService.findByMentor(mentorId, query);
  }
}
