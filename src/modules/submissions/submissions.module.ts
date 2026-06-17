import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubmissionsService } from './submissions.service';
import { SubmissionsController } from './submissions.controller';
import { Submission } from './entities/submission.entity';
import { SubmissionFile } from './entities/submission-file.entity';
import { FileReference } from './entities/file-reference.entity';
import { Participation } from '../participations/entities/participation.entity';
import { Enrollment } from '../enrollments/entities/enrollment.entity';
import { Opportunity } from '../opportunities/entities/opportunity.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Submission, SubmissionFile, FileReference, Participation, Enrollment, Opportunity])],
  controllers: [SubmissionsController],
  providers: [SubmissionsService],
  exports: [SubmissionsService],
})
export class SubmissionsModule {}
