import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VerificationService } from './verification.service';
import { VerificationController } from './verification.controller';
import { VerificationLog } from './entities/verification-log.entity';
import { Submission } from '../submissions/entities/submission.entity';
import { SubmissionFile } from '../submissions/entities/submission-file.entity';
import { Participation } from '../participations/entities/participation.entity';
import { Enrollment } from '../enrollments/entities/enrollment.entity';
import { IamModule } from '../iam/iam.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([VerificationLog, Submission, SubmissionFile, Participation, Enrollment]),
    IamModule,
  ],
  controllers: [VerificationController],
  providers: [VerificationService],
  exports: [VerificationService],
})
export class VerificationModule {}
