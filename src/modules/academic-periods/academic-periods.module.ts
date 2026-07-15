import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AcademicPeriodsService } from './academic-periods.service';
import { AcademicPeriodsController } from './academic-periods.controller';
import { AcademicPeriod } from './entities/academic-period.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AcademicPeriod])],
  controllers: [AcademicPeriodsController],
  providers: [AcademicPeriodsService],
  exports: [AcademicPeriodsService],
})
export class AcademicPeriodsModule {}
