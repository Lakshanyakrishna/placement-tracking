import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from '../../common/common.module';
import { Branch } from '../branches/entities/branch.entity';
import { Section } from '../sections/entities/section.entity';
import { Group } from '../groups/entities/group.entity';
import { User } from '../users/entities/user.entity';
import { Enrollment } from '../enrollments/entities/enrollment.entity';
import { AcademicPeriod } from '../academic-periods/entities/academic-period.entity';
import { Batch } from '../batches/entities/batch.entity';
import { RoleAssignment } from '../iam/entities/role-assignment.entity';
import { ImportsController } from './imports.controller';
import { ExcelParserEngine } from './engines/excel-parser.engine';
import { ImportValidatorEngine } from './engines/import-validator.engine';
import { StudentsImportService } from './services/students-import.service';
import { GroupsImportService } from './services/groups-import.service';
import { TeamLeadersImportService } from './services/team-leaders-import.service';
import { MentorsImportService } from './services/mentors-import.service';
import { ImportHistory } from './entities/import-history.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ImportHistory,
      Branch,
      Section,
      Group,
      User,
      Enrollment,
      AcademicPeriod,
      Batch,
      RoleAssignment,
    ]),
    CommonModule,
  ],
  controllers: [ImportsController],
  providers: [
    ExcelParserEngine,
    ImportValidatorEngine,
    StudentsImportService,
    GroupsImportService,
    TeamLeadersImportService,
    MentorsImportService,
  ],
  exports: [],
})
export class ImportsModule {}
