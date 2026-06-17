import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { UuidValidationPipe } from '../../common/pipes/uuid-validation.pipe';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { VerificationService } from './verification.service';
import { RejectSubmissionDto } from './dto/reject-submission.dto';
import { VerificationLogResponseDto } from './dto/verification-log-response.dto';
import { PendingSubmissionResponseDto } from './dto/pending-submission-response.dto';
import { PaginationQueryDto, PaginationMetaDto } from '../../common/dto/pagination.dto';

@ApiTags('Verifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('verifications')
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  @Get('pending')
  @ApiOperation({ summary: 'Get pending submissions for team leader groups' })
  @ApiResponse({ status: 200, description: 'Pending submissions', type: [PendingSubmissionResponseDto] })
  async findPending(
    @CurrentUser('id') userId: string,
  ): Promise<PendingSubmissionResponseDto[]> {
    return this.verificationService.findPending(userId);
  }

  @Get('group/:groupId')
  @ApiOperation({ summary: 'Get verification logs by group' })
  @ApiResponse({ status: 200, description: 'Verification logs for group' })
  async findByGroup(
    @Param('groupId', UuidValidationPipe) groupId: string,
    @Query() query: PaginationQueryDto,
  ): Promise<{ data: VerificationLogResponseDto[]; meta: PaginationMetaDto }> {
    return this.verificationService.findByGroup(groupId, query);
  }

  @Get('section/:sectionId')
  @ApiOperation({ summary: 'Get verification logs by section' })
  @ApiResponse({ status: 200, description: 'Verification logs for section' })
  async findBySection(
    @Param('sectionId', UuidValidationPipe) sectionId: string,
    @Query() query: PaginationQueryDto,
  ): Promise<{ data: VerificationLogResponseDto[]; meta: PaginationMetaDto }> {
    return this.verificationService.findBySection(sectionId, query);
  }

  @Get('submission/:submissionId')
  @ApiOperation({ summary: 'Get verification logs for a submission' })
  @ApiResponse({ status: 200, description: 'Verification logs for submission' })
  @ApiResponse({ status: 404, description: 'Submission not found' })
  async findBySubmission(
    @Param('submissionId', UuidValidationPipe) submissionId: string,
  ): Promise<{ data: VerificationLogResponseDto[] }> {
    return this.verificationService.findBySubmission(submissionId);
  }

  @Post(':submissionId/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve a submission' })
  @ApiResponse({ status: 200, description: 'Submission approved', type: VerificationLogResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid state or duplicate' })
  @ApiResponse({ status: 403, description: 'Not the assigned team leader' })
  @ApiResponse({ status: 404, description: 'Submission not found' })
  async approve(
    @Param('submissionId', UuidValidationPipe) submissionId: string,
    @CurrentUser('id') userId: string,
  ): Promise<VerificationLogResponseDto> {
    return this.verificationService.approve(submissionId, userId);
  }

  @Post(':submissionId/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject a submission with reason' })
  @ApiResponse({ status: 200, description: 'Submission rejected', type: VerificationLogResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid state or duplicate' })
  @ApiResponse({ status: 403, description: 'Not the assigned team leader' })
  @ApiResponse({ status: 404, description: 'Submission not found' })
  async reject(
    @Param('submissionId', UuidValidationPipe) submissionId: string,
    @Body() dto: RejectSubmissionDto,
    @CurrentUser('id') userId: string,
  ): Promise<VerificationLogResponseDto> {
    return this.verificationService.reject(submissionId, dto, userId);
  }
}
