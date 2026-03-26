import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccessControlModule } from 'common/guards/access-control/access-control.module';
import { LegisAdminGuard } from '../shared/guards/legis-admin.guard';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { LegisCategory } from './entities';

@Module({
  imports: [TypeOrmModule.forFeature([LegisCategory]), AccessControlModule],
  controllers: [CategoriesController],
  providers: [CategoriesService, LegisAdminGuard],
  exports: [CategoriesService],
})
export class CategoriesModule {}