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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { GroupResponseDto } from './dto/group-response.dto';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

@ApiTags('Groups')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Get()
  @ApiOperation({ summary: 'Get paginated list of groups' })
  @ApiResponse({ status: 200, description: 'Paginated groups' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.groupsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a group by ID' })
  @ApiResponse({ status: 200, type: GroupResponseDto })
  @ApiResponse({ status: 404, description: 'Group not found' })
  findOne(@Param('id') id: string) {
    return this.groupsService.findOne(id);
  }

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Create a new group' })
  @ApiResponse({ status: 201, type: GroupResponseDto })
  create(@Body() dto: CreateGroupDto) {
    return this.groupsService.create(dto);
  }

  @Patch(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Update a group' })
  @ApiResponse({ status: 200, type: GroupResponseDto })
  @ApiResponse({ status: 404, description: 'Group not found' })
  update(@Param('id') id: string, @Body() dto: UpdateGroupDto) {
    return this.groupsService.update(id, dto);
  }

  @Delete(':id')
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a group' })
  @ApiResponse({ status: 204, description: 'Group deleted' })
  @ApiResponse({ status: 404, description: 'Group not found' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.groupsService.remove(id);
  }

  @Get(':id/students')
  @Roles('admin', 'mentor', 'team_leader')
  @ApiOperation({ summary: 'Get students in a group' })
  @ApiResponse({ status: 200, description: 'Array of students' })
  findStudents(@Param('id') id: string) {
    return this.groupsService.findStudentsByGroup(id);
  }
}
