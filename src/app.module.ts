import { Module } from '@nestjs/common';

import { AppConfigModule } from './config/config.module';
import { CommonModule } from './common/common.module';
import { DatabaseModule } from './modules/database/database.module';
import { StorageModule } from './modules/storage/storage.module';
import { MailModule } from './modules/mail/mail.module';
import { HealthModule } from './modules/health/health.module';
import { PublicModule } from './modules/public/public.module';

import { AuthModule } from './modules/auth/auth.module';
import { IamModule } from './modules/iam/iam.module';
import { UsersModule } from './modules/users/users.module';

import { AcademicYearsModule } from './modules/academic-years/academic-years.module';
import { AcademicPeriodsModule } from './modules/academic-periods/academic-periods.module';
import { BranchesModule } from './modules/branches/branches.module';
import { SectionsModule } from './modules/sections/sections.module';
import { GroupsModule } from './modules/groups/groups.module';
import { BatchesModule } from './modules/batches/batches.module';
import { EnrollmentsModule } from './modules/enrollments/enrollments.module';

import { OpportunitiesModule } from './modules/opportunities/opportunities.module';
import { ParticipationsModule } from './modules/participations/participations.module';
import { SubmissionsModule } from './modules/submissions/submissions.module';
import { VerificationModule } from './modules/verification/verification.module';

import { NotificationsModule } from './modules/notifications/notifications.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { ImportsModule } from './modules/imports/imports.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';

@Module({
  imports: [
    AppConfigModule,
    DatabaseModule,
    StorageModule,
    MailModule,
    CommonModule,
    HealthModule,
    PublicModule,
    AuthModule,
    IamModule,
    UsersModule,
    AcademicYearsModule,
    AcademicPeriodsModule,
    BranchesModule,
    SectionsModule,
    GroupsModule,
    BatchesModule,
    EnrollmentsModule,
    OpportunitiesModule,
    ParticipationsModule,
    SubmissionsModule,
    VerificationModule,
    NotificationsModule,
    AnalyticsModule,
    ImportsModule,
    DashboardModule,
  ],
  providers: [],
})
export class AppModule {}
