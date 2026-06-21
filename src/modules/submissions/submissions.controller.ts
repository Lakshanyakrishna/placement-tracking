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
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UuidValidationPipe } from '../../common/pipes/uuid-validation.pipe';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SubmissionsService } from './submissions.service';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { UpdateSubmissionDto } from './dto/update-submission.dto';
import { SubmissionResponseDto } from './dto/submission-response.dto';
import { PaginationQueryDto, PaginationMetaDto } from '../../common/dto/pagination.dto';
import { UploadFile } from './interfaces/upload-file.interface';

@ApiTags('Submissions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('submissions')
export class SubmissionsController {
  constructor(private readonly submissionsService: SubmissionsService) {}

  @Post()
  @UseInterceptors(FilesInterceptor('files', 10))
  @ApiOperation({ summary: 'Upload proof files and create/replace submission' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: { type: 'array', items: { type: 'string', format: 'binary' }, maxItems: 10 },
        participationId: { type: 'string' },
        description: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Submission created', type: SubmissionResponseDto })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @HttpCode(HttpStatus.CREATED)
  async create(
    @UploadedFiles() files: UploadFile[],
    @Body() dto: CreateSubmissionDto,
    @CurrentUser('id') userId: string,
  ): Promise<SubmissionResponseDto> {
    return this.submissionsService.create(files, dto, userId);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get my submissions' })
  @ApiResponse({ status: 200, description: 'My submissions' })
  async findMySubmissions(
    @Query() query: PaginationQueryDto,
    @CurrentUser('id') userId: string,
  ): Promise<{ data: SubmissionResponseDto[]; meta: PaginationMetaDto }> {
    return this.submissionsService.findMySubmissions(query, userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a submission by ID' })
  @ApiResponse({ status: 200, description: 'Submission found', type: SubmissionResponseDto })
  @ApiResponse({ status: 404, description: 'Submission not found' })
  async findOne(
    @Param('id', UuidValidationPipe) id: string,
  ): Promise<SubmissionResponseDto> {
    return this.submissionsService.findOne(id);
  }

  @Get('group/:groupId')
  @Roles('admin', 'mentor', 'team_leader')
  @ApiOperation({ summary: 'Get submissions by group' })
  @ApiResponse({ status: 200, description: 'Submissions for group' })
  async findByGroup(
    @Param('groupId', UuidValidationPipe) groupId: string,
    @Query() query: PaginationQueryDto,
  ): Promise<{ data: SubmissionResponseDto[]; meta: PaginationMetaDto }> {
    return this.submissionsService.findByGroup(groupId, query);
  }

  @Get('section/:sectionId')
  @Roles('admin', 'mentor')
  @ApiOperation({ summary: 'Get submissions by section' })
  @ApiResponse({ status: 200, description: 'Submissions for section' })
  async findBySection(
    @Param('sectionId', UuidValidationPipe) sectionId: string,
    @Query() query: PaginationQueryDto,
  ): Promise<{ data: SubmissionResponseDto[]; meta: PaginationMetaDto }> {
    return this.submissionsService.findBySection(sectionId, query);
  }

  @Patch(':id')
  @UseInterceptors(FilesInterceptor('files', 10))
  @ApiOperation({ summary: 'Update submission (replace files and/or metadata)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: { type: 'array', items: { type: 'string', format: 'binary' }, maxItems: 10 },
        description: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Submission updated', type: SubmissionResponseDto })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 400, description: 'Submission locked after verification' })
  async update(
    @Param('id', UuidValidationPipe) id: string,
    @UploadedFiles() files: UploadFile[],
    @Body() dto: UpdateSubmissionDto,
    @CurrentUser('id') userId: string,
  ): Promise<SubmissionResponseDto> {
    return this.submissionsService.update(id, files, dto, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a submission and its files' })
  @ApiResponse({ status: 204, description: 'Submission deleted' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 400, description: 'Submission locked after verification' })
  async remove(
    @Param('id', UuidValidationPipe) id: string,
    @CurrentUser('id') userId: string,
  ): Promise<void> {
    return this.submissionsService.remove(id, userId);
  }
}
