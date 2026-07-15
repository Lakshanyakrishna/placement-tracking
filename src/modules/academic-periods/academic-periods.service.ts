import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AcademicPeriod } from './entities/academic-period.entity';
import { AcademicPeriodResponseDto } from './dto/academic-period-response.dto';

@Injectable()
export class AcademicPeriodsService {
  constructor(
    @InjectRepository(AcademicPeriod)
    private readonly repository: Repository<AcademicPeriod>,
  ) {}

  async findAll(): Promise<AcademicPeriodResponseDto[]> {
    const entities = await this.repository.find({ order: { startDate: 'DESC' } });
    return entities.map(AcademicPeriodResponseDto.fromEntity);
  }
}
