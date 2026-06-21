import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { SectionsService } from './sections.service';
import { CreateSectionDto } from './dto/create-section.dto';
import { UpdateSectionDto } from './dto/update-section.dto';
import { SectionResponseDto } from './dto/section-response.dto';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

@ApiTags('Sections')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@Controller('sections')
export class SectionsController {
  constructor(private readonly sectionsService: SectionsService) {}

  @Get()
  @ApiOperation({ summary: 'List sections with pagination, sorting, and search' })
  async findAll(@Query() query: PaginationQueryDto) {
    return this.sectionsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a section by ID' })
  async findOne(@Param('id') id: string): Promise<SectionResponseDto> {
    const result = await this.sectionsService.findOne(id);
    if (!result) {
      throw new NotFoundException(`Section with id "${id}" not found`);
    }
    return result;
  }

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Create a new section' })
  async create(@Body() dto: CreateSectionDto): Promise<SectionResponseDto> {
    return this.sectionsService.create(dto);
  }

  @Patch(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Update a section' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateSectionDto,
  ): Promise<SectionResponseDto> {
    return this.sectionsService.update(id, dto);
  }

  @Delete(':id')
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a section' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.sectionsService.remove(id);
  }

  @Get(':id/groups')
  @ApiOperation({ summary: 'Get all groups in a section' })
  async findGroups(@Param('id') id: string): Promise<GroupResponseDto[]> {
    const groups = await this.sectionsService.findGroupsBySection(id);
    return groups.map((g) => ({
      id: g.id,
      sectionId: g.sectionId,
      name: g.name,
      teamLeaderUserId: g.teamLeaderUserId,
    }));
  }

  @Get(':id/students')
  @Roles('admin', 'mentor')
  @ApiOperation({ summary: 'Get all students in a section' })
  async findStudents(@Param('id') id: string): Promise<StudentResponseDto[]> {
    return this.sectionsService.findStudentsBySection(id);
  }
}

export class GroupResponseDto {
  id: string;
  sectionId: string;
  name: string;
  teamLeaderUserId: string | null;
}

export class StudentResponseDto {
  id: string;
  name: string;
  email: string;
  rollNumber: string | null;
}
