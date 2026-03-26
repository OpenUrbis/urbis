import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LegisPage } from '../pages/entities';
import { LegisSearchController } from './legis-search.controller';
import { LegisSearchService } from './legis-search.service';

@Module({
  imports: [TypeOrmModule.forFeature([LegisPage])],
  controllers: [LegisSearchController],
  providers: [LegisSearchService],
})
export class LegisSearchModule {}