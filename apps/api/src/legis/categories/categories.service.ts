import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { Repository } from 'typeorm';
import { CreateLegisCategoryDto } from './dto/create-legis-category.dto';
import { LegisCategory } from './entities';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(LegisCategory)
    private readonly categoriesRepository: Repository<LegisCategory>,
  ) {}

  async findAll(): Promise<LegisCategory[]> {
    return this.categoriesRepository.find({ order: { name: 'ASC' } });
  }

  async create(
    createLegisCategoryDto: CreateLegisCategoryDto,
    userId?: string,
  ): Promise<LegisCategory> {
    const category = this.categoriesRepository.create({
      id: createLegisCategoryDto.id ?? randomUUID(),
      ...createLegisCategoryDto,
      createdBy: userId ?? null,
    });

    return this.categoriesRepository.save(category);
  }
}
