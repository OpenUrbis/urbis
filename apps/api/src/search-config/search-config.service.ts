import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SearchConfig } from './entities/search-config.entity';

@Injectable()
export class SearchConfigService {
  constructor(
    @InjectRepository(SearchConfig)
    private readonly repository: Repository<SearchConfig>,
  ) {}

  async findAll(): Promise<SearchConfig[]> {
    return this.repository.find({
      where: { isActive: true },
      order: { index: 'ASC' },
      relations: {
        layerSchema: true,
      },
    });
  }
}
