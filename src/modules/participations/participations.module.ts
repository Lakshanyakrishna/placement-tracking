import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ParticipationsService } from './participations.service';
import { ParticipationsController } from './participations.controller';
import { Participation } from './entities/participation.entity';
import { Enrollment } from '../enrollments/entities/enrollment.entity';
import { Opportunity } from '../opportunities/entities/opportunity.entity';
import { OpportunityRound } from '../opportunities/entities/opportunity-round.entity';
import { Group } from '../groups/entities/group.entity';
import { IamModule } from '../iam/iam.module';

@Module({
  imports: [TypeOrmModule.forFeature([Participation, Enrollment, Opportunity, OpportunityRound, Group]), IamModule],
  controllers: [ParticipationsController],
  providers: [ParticipationsService],
  exports: [ParticipationsService],
})
export class ParticipationsModule {}
