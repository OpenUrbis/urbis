import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LegisCategory } from '../../../legis/categories/entities';
import { LegisPage } from '../../../legis/pages/entities';
import { LEGIS_SEED_CATEGORIES, LEGIS_SEED_PAGES } from './legis-seed.data';

@Injectable()
export class LegisSeedService {
  constructor(
    @InjectRepository(LegisCategory)
    private readonly categoriesRepository: Repository<LegisCategory>,
    @InjectRepository(LegisPage)
    private readonly pagesRepository: Repository<LegisPage>,
  ) {}

  async run(): Promise<void> {
    console.info('Seeding Legis categories and pages...');

    for (const categoryData of LEGIS_SEED_CATEGORIES) {
      const existingCategory = await this.categoriesRepository.findOne({
        where: { id: categoryData.id },
      });

      if (existingCategory) {
        await this.categoriesRepository.save({
          ...existingCategory,
          ...categoryData,
        });
        continue;
      }

      await this.categoriesRepository.save(
        this.categoriesRepository.create(categoryData),
      );
    }

    for (const pageData of LEGIS_SEED_PAGES) {
      const existingPage = await this.pagesRepository.findOne({
        where: { id: pageData.id },
        withDeleted: true,
      });

      if (existingPage) {
        await this.pagesRepository.save({
          ...existingPage,
          ...pageData,
          deletedAt: null,
        });
        continue;
      }

      await this.pagesRepository.save(this.pagesRepository.create(pageData));
    }
  }
}
