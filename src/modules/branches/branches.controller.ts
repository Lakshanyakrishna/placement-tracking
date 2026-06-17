import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { UuidValidationPipe } from '../../common/pipes/uuid-validation.pipe';
import { BranchesService } from './branches.service';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { BranchResponseDto } from './dto/branch-response.dto';

@ApiTags('Branches')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('branches')
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all branches with pagination, sorting, and search' })
  @ApiResponse({ status: 200, description: 'Paginated list of branches' })
  async findAll(
    @Query() query: PaginationQueryDto,
  ): Promise<{ data: BranchResponseDto[]; meta: { page: number; limit: number; total: number; totalPages: number; hasNextPage: boolean; hasPreviousPage: boolean } }> {
    return this.branchesService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a branch by ID' })
  @ApiResponse({ status: 200, description: 'Branch found', type: BranchResponseDto })
  @ApiResponse({ status: 404, description: 'Branch not found' })
  async findOne(
    @Param('id', UuidValidationPipe) id: string,
  ): Promise<BranchResponseDto> {
    const result = await this.branchesService.findOne(id);
    if (!result) {
      throw new NotFoundException(`Branch with id "${id}" not found`);
    }
    return result;
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new branch' })
  @ApiResponse({ status: 201, description: 'Branch created', type: BranchResponseDto })
  @ApiResponse({ status: 409, description: 'Duplicate code or name' })
  async create(@Body() dto: CreateBranchDto): Promise<BranchResponseDto> {
    return this.branchesService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a branch' })
  @ApiResponse({ status: 200, description: 'Branch updated', type: BranchResponseDto })
  @ApiResponse({ status: 404, description: 'Branch not found' })
  async update(
    @Param('id', UuidValidationPipe) id: string,
    @Body() dto: UpdateBranchDto,
  ): Promise<BranchResponseDto> {
    return this.branchesService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a branch' })
  @ApiResponse({ status: 204, description: 'Branch deleted' })
  @ApiResponse({ status: 404, description: 'Branch not found' })
  async remove(@Param('id', UuidValidationPipe) id: string): Promise<void> {
    await this.branchesService.remove(id);
  }
}
