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
import { UuidValidationPipe } from '../../common/pipes/uuid-validation.pipe';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { OpportunitiesService } from './opportunities.service';
import { CreateOpportunityDto } from './dto/create-opportunity.dto';
import { UpdateOpportunityDto } from './dto/update-opportunity.dto';
import { OpportunityResponseDto } from './dto/opportunity-response.dto';
import { OpportunityFilterDto } from './dto/opportunity-filter.dto';
import { SetTargetsDto } from './dto/set-targets.dto';
import { TargetResponseDto } from './dto/target-response.dto';
import { PaginationMetaDto } from '../../common/dto/pagination.dto';

@ApiTags('Opportunities')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('opportunities')
export class OpportunitiesController {
  constructor(private readonly opportunitiesService: OpportunitiesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new opportunity (draft)' })
  @ApiResponse({ status: 201, description: 'Opportunity created', type: OpportunityResponseDto })
  async create(
    @Body() dto: CreateOpportunityDto,
    @CurrentUser('id') userId: string,
  ): Promise<OpportunityResponseDto> {
    return this.opportunitiesService.create(dto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all opportunities with pagination, filtering, and search' })
  @ApiResponse({ status: 200, description: 'Paginated list of opportunities' })
  async findAll(
    @Query() query: OpportunityFilterDto,
  ): Promise<{ data: OpportunityResponseDto[]; meta: PaginationMetaDto }> {
    return this.opportunitiesService.findAll(query);
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
  @ApiOperation({ summary: 'Update an opportunity' })
  @ApiResponse({ status: 200, description: 'Opportunity updated', type: OpportunityResponseDto })
  @ApiResponse({ status: 404, description: 'Opportunity not found' })
  async update(
    @Param('id', UuidValidationPipe) id: string,
    @Body() dto: UpdateOpportunityDto,
  ): Promise<OpportunityResponseDto> {
    return this.opportunitiesService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a draft opportunity' })
  @ApiResponse({ status: 204, description: 'Opportunity deleted' })
  @ApiResponse({ status: 404, description: 'Opportunity not found' })
  @ApiResponse({ status: 409, description: 'Only draft opportunities can be deleted' })
  async remove(@Param('id', UuidValidationPipe) id: string): Promise<void> {
    await this.opportunitiesService.remove(id);
  }

  @Post(':id/publish')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Publish a draft opportunity' })
  @ApiResponse({ status: 200, description: 'Opportunity published', type: OpportunityResponseDto })
  @ApiResponse({ status: 404, description: 'Opportunity not found' })
  @ApiResponse({ status: 400, description: 'Cannot publish in current state' })
  async publish(
    @Param('id', UuidValidationPipe) id: string,
  ): Promise<OpportunityResponseDto> {
    return this.opportunitiesService.publish(id);
  }

  @Post(':id/archive')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Archive a published/closed opportunity' })
  @ApiResponse({ status: 200, description: 'Opportunity archived', type: OpportunityResponseDto })
  @ApiResponse({ status: 404, description: 'Opportunity not found' })
  @ApiResponse({ status: 400, description: 'Cannot archive in current state' })
  async archive(
    @Param('id', UuidValidationPipe) id: string,
  ): Promise<OpportunityResponseDto> {
    return this.opportunitiesService.archive(id);
  }

  @Post(':id/targets')
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
}
