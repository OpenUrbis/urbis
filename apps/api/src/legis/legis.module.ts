import { Module } from '@nestjs/common';
import { CategoriesModule } from './categories/categories.module';
import { LegisImportModule } from './import/legis-import.module';
import { PagesModule } from './pages/pages.module';
import { LegisSearchModule } from './search/legis-search.module';

@Module({
  imports: [PagesModule, CategoriesModule, LegisSearchModule, LegisImportModule],
})
export class LegisModule {}