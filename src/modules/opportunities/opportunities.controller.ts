import {
  Body,
  Controller,
  Delete,
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
import { OpportunitiesService } from './opportunities.service';
import { CreateOpportunityDto } from './dto/create-opportunity.dto';
import { UpdateOpportunityDto } from './dto/update-opportunity.dto';
import { OpportunityResponseDto } from './dto/opportunity-response.dto';
import { OpportunityFilterDto } from './dto/opportunity-filter.dto';
import { SetTargetsDto } from './dto/set-targets.dto';
import { TargetResponseDto } from './dto/target-response.dto';
import { SetRoundsDto } from './dto/set-rounds.dto';
import { RoundResponseDto } from './dto/round-response.dto';
import { PaginationMetaDto } from '../../common/dto/pagination.dto';

@ApiTags('Opportunities')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('opportunities')
export class OpportunitiesController {
  constructor(private readonly opportunitiesService: OpportunitiesService) {}

  @Post()
  @Roles('admin', 'mentor', 'team_leader')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new opportunity (draft)' })
  @ApiResponse({ status: 201, description: 'Opportunity created', type: OpportunityResponseDto })
  async create(
    @Body() dto: CreateOpportunityDto,
    @CurrentUser() user: any,
  ): Promise<OpportunityResponseDto> {
    return this.opportunitiesService.create(dto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Get all opportunities with pagination, filtering, and search' })
  @ApiResponse({ status: 200, description: 'Paginated list of opportunities' })
  async findAll(
    @Query() query: OpportunityFilterDto,
  ): Promise<{ data: OpportunityResponseDto[]; meta: PaginationMetaDto }> {
    return this.opportunitiesService.findAll(query);
  }

  @Get('available')
  @ApiOperation({ summary: 'Get available opportunities for the authenticated student' })
  @ApiResponse({ status: 200, description: 'Available opportunities', type: [OpportunityResponseDto] })
  async findAvailable(
    @CurrentUser('id') userId: string,
  ): Promise<OpportunityResponseDto[]> {
    return this.opportunitiesService.findAvailable(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an opportunity by ID with targets' })
  @ApiResponse({ status: 200, description: 'Opportunity found', type: OpportunityResponseDto })
  @ApiResponse({ status: 404, description: 'Opportunity not found' })
  async findOne(
    @Param('id', UuidValidationPipe) id: string,
  ): Promise<OpportunityResponseDto> {
    return this.opportunitiesService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin', 'mentor', 'team_leader')
  @ApiOperation({ summary: 'Update an opportunity' })
  @ApiResponse({ status: 200, description: 'Opportunity updated', type: OpportunityResponseDto })
  @ApiResponse({ status: 404, description: 'Opportunity not found' })
  async update(
    @Param('id', UuidValidationPipe) id: string,
    @Body() dto: UpdateOpportunityDto,
    @CurrentUser() user: any,
  ): Promise<OpportunityResponseDto> {
    return this.opportunitiesService.update(id, dto, user);
  }

  @Delete(':id')
  @Roles('admin', 'mentor', 'team_leader')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a draft opportunity' })
  @ApiResponse({ status: 204, description: 'Opportunity deleted' })
  @ApiResponse({ status: 404, description: 'Opportunity not found' })
  @ApiResponse({ status: 409, description: 'Only draft opportunities can be deleted' })
  async remove(@Param('id', UuidValidationPipe) id: string, @CurrentUser() user: any): Promise<void> {
    await this.opportunitiesService.remove(id, user);
  }

  @Post(':id/publish')
  @Roles('admin', 'mentor', 'team_leader')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Publish a draft opportunity' })
  @ApiResponse({ status: 200, description: 'Opportunity published', type: OpportunityResponseDto })
  @ApiResponse({ status: 404, description: 'Opportunity not found' })
  @ApiResponse({ status: 400, description: 'Cannot publish in current state' })
  async publish(
    @Param('id', UuidValidationPipe) id: string,
    @CurrentUser() user: any,
  ): Promise<OpportunityResponseDto> {
    return this.opportunitiesService.publish(id, user);
  }

  @Post(':id/archive')
  @Roles('admin', 'mentor', 'team_leader')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Archive a published/closed opportunity' })
  @ApiResponse({ status: 200, description: 'Opportunity archived', type: OpportunityResponseDto })
  @ApiResponse({ status: 404, description: 'Opportunity not found' })
  @ApiResponse({ status: 400, description: 'Cannot archive in current state' })
  async archive(
    @Param('id', UuidValidationPipe) id: string,
    @CurrentUser() user: any,
  ): Promise<OpportunityResponseDto> {
    return this.opportunitiesService.archive(id, user);
  }

  @Post(':id/targets')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Set targets for an opportunity (replaces existing)' })
  @ApiResponse({ status: 200, description: 'Targets set', type: [TargetResponseDto] })
  @ApiResponse({ status: 404, description: 'Opportunity not found' })
  async setTargets(
    @Param('id', UuidValidationPipe) id: string,
    @Body() dto: SetTargetsDto,
  ): Promise<TargetResponseDto[]> {
    return this.opportunitiesService.setTargets(id, dto);
  }

  @Get(':id/targets')
  @ApiOperation({ summary: 'Get targets for an opportunity' })
  @ApiResponse({ status: 200, description: 'Targets retrieved', type: [TargetResponseDto] })
  @ApiResponse({ status: 404, description: 'Opportunity not found' })
  async getTargets(
    @Param('id', UuidValidationPipe) id: string,
  ): Promise<TargetResponseDto[]> {
    return this.opportunitiesService.getTargets(id);
  }

  @Post(':id/rounds')
  @Roles('admin', 'mentor', 'team_leader')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Set rounds for an opportunity (replaces existing) — e.g. Round 1: Online Assessment, Round 2: Technical Interview' })
  @ApiResponse({ status: 200, description: 'Rounds set', type: [RoundResponseDto] })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Opportunity not found' })
  async setRounds(
    @Param('id', UuidValidationPipe) id: string,
    @Body() dto: SetRoundsDto,
    @CurrentUser() user: any,
  ): Promise<RoundResponseDto[]> {
    return this.opportunitiesService.setRounds(id, dto, user);
  }

  @Get(':id/rounds')
  @ApiOperation({ summary: 'Get rounds for an opportunity' })
  @ApiResponse({ status: 200, description: 'Rounds retrieved', type: [RoundResponseDto] })
  @ApiResponse({ status: 404, description: 'Opportunity not found' })
  async getRounds(
    @Param('id', UuidValidationPipe) id: string,
  ): Promise<RoundResponseDto[]> {
    return this.opportunitiesService.getRounds(id);
  }
}
