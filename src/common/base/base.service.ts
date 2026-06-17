import { NotFoundException } from '@nestjs/common';
import { FindOptionsWhere, Repository } from 'typeorm';

export abstract class BaseService<T extends { id: string }> {
  constructor(protected readonly repository: Repository<T>) {}

  async findById(id: string): Promise<T> {
    const where = { id } as FindOptionsWhere<T>;
    const entity = await this.repository.findOne({ where });
    if (!entity) {
      throw new NotFoundException(`Entity with id ${id} not found`);
    }
    return entity;
  }

  async findAll(filter?: Partial<T>): Promise<T[]> {
    if (filter) {
      return this.repository.find({ where: filter as FindOptionsWhere<T> });
    }
    return this.repository.find();
  }

  async exists(id: string): Promise<boolean> {
    const where = { id } as FindOptionsWhere<T>;
    const count = await this.repository.count({ where });
    return count > 0;
  }

  async count(filter?: Partial<T>): Promise<number> {
    if (filter) {
      return this.repository.count({ where: filter as FindOptionsWhere<T> });
    }
    return this.repository.count();
  }
}
