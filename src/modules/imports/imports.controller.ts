import {
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Get,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { StudentsImportService } from './services/students-import.service';
import { GroupsImportService } from './services/groups-import.service';
import { TeamLeadersImportService } from './services/team-leaders-import.service';
import { MentorsImportService } from './services/mentors-import.service';
import { ValidationResultDto, ImportResultDto, ImportHistoryListItemDto } from './dto/import.dto';
import { ValidationResult, ImportResult, ImportFile } from './interfaces/import-types';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ImportHistory, ImportHistoryType } from './entities/import-history.entity';

@ApiTags('Imports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('imports')
export class ImportsController {
  constructor(
    private readonly studentsImportService: StudentsImportService,
    private readonly groupsImportService: GroupsImportService,
    private readonly teamLeadersImportService: TeamLeadersImportService,
    private readonly mentorsImportService: MentorsImportService,
    @InjectRepository(ImportHistory)
    private readonly importHistoryRepository: Repository<ImportHistory>,
  ) {}

  @Post('students/validate')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Validate student import data without committing' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({ status: 200, type: ValidationResultDto })
  async validateStudents(@UploadedFile() file: ImportFile): Promise<ValidationResultDto> {
    const result = await this.studentsImportService.validate(file);
    return this.toValidationResultDto(result);
  }

  @Post('students/import')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Import students from Excel file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({ status: 201, type: ImportResultDto })
  async importStudents(
    @UploadedFile() file: ImportFile,
    @CurrentUser('id') userId: string,
  ): Promise<ImportResultDto> {
    const result = await this.studentsImportService.import(file, userId);
    return this.toImportResultDto(result);
  }

  @Post('groups/validate')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Validate group import data without committing' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({ status: 200, type: ValidationResultDto })
  async validateGroups(@UploadedFile() file: ImportFile): Promise<ValidationResultDto> {
    const result = await this.groupsImportService.validate(file);
    return this.toValidationResultDto(result);
  }

  @Post('groups/import')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Import groups from Excel file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({ status: 201, type: ImportResultDto })
  async importGroups(
    @UploadedFile() file: ImportFile,
    @CurrentUser('id') userId: string,
  ): Promise<ImportResultDto> {
    const result = await this.groupsImportService.import(file, userId);
    return this.toImportResultDto(result);
  }

  @Post('team-leaders/validate')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Validate team leader import data without committing' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({ status: 200, type: ValidationResultDto })
  async validateTeamLeaders(@UploadedFile() file: ImportFile): Promise<ValidationResultDto> {
    const result = await this.teamLeadersImportService.validate(file);
    return this.toValidationResultDto(result);
  }

  @Post('team-leaders/import')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Import team leaders from Excel file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({ status: 201, type: ImportResultDto })
  async importTeamLeaders(
    @UploadedFile() file: ImportFile,
    @CurrentUser('id') userId: string,
  ): Promise<ImportResultDto> {
    const result = await this.teamLeadersImportService.import(file, userId);
    return this.toImportResultDto(result);
  }

  @Post('mentors/validate')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Validate mentor import data without committing' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({ status: 200, type: ValidationResultDto })
  async validateMentors(@UploadedFile() file: ImportFile): Promise<ValidationResultDto> {
    const result = await this.mentorsImportService.validate(file);
    return this.toValidationResultDto(result);
  }

  @Post('mentors/import')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Import mentors from Excel file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({ status: 201, type: ImportResultDto })
  async importMentors(
    @UploadedFile() file: ImportFile,
    @CurrentUser('id') userId: string,
  ): Promise<ImportResultDto> {
    const result = await this.mentorsImportService.import(file, userId);
    return this.toImportResultDto(result);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get import history' })
  @ApiQuery({ name: 'type', required: false, description: 'Filter by import type' })
  @ApiResponse({ status: 200, type: [ImportHistoryListItemDto] })
  async getHistory(@Query('type') importType?: string): Promise<ImportHistoryListItemDto[]> {
    const where = importType ? { importType: importType as ImportHistoryType } : {};
    const history = await this.importHistoryRepository.find({
      where,
      order: { createdAt: 'DESC' },
      take: 100,
      relations: { importedByUser: true },
    });

    return history.map((h) => ({
      id: h.id,
      importType: h.importType,
      fileName: h.fileName,
      status: h.status,
      totalRows: h.totalRows,
      successCount: h.successCount,
      failureCount: h.failureCount,
      importedAt: h.createdAt,
      importedByName: h.importedByUser?.name,
    }));
  }

  private toValidationResultDto(result: ValidationResult): ValidationResultDto {
    return {
      valid: result.valid,
      summary: result.summary,
      errors: result.errors.map((e) => ({
        row: e.row,
        column: e.column,
        message: e.message,
        value: e.value,
      })),
    };
  }

  private toImportResultDto(result: ImportResult): ImportResultDto {
    return {
      importType: result.importType,
      status: result.status,
      totalRows: result.totalRows,
      successCount: result.successCount,
      failureCount: result.failureCount,
      errors: result.errors.map((e) => ({
        row: e.row,
        column: e.column,
        message: e.message,
        value: e.value,
      })),
      importHistoryId: result.importHistoryId,
    };
  }
}
