import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IamService } from './iam.service';
import { IamController } from './iam.controller';
import { RoleAssignment } from './entities/role-assignment.entity';
import { Section } from '../sections/entities/section.entity';
import { Group } from '../groups/entities/group.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RoleAssignment, Section, Group])],
  providers: [IamService],
  controllers: [IamController],
  exports: [IamService],
})
export class IamModule {}
