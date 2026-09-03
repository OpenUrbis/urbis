import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccessControlModule } from 'common/guards/access-control/access-control.module';
import { LegisPage } from '../pages/entities';
import { LegisAuthority } from '../authorities/entities';
import { PagesModule } from '../pages/pages.module';
import { LegisSearchController } from './legis-search.controller';
import { LegisSearchService } from './legis-search.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([LegisPage, LegisAuthority]),
    PagesModule,
    AccessControlModule,
  ],
  controllers: [LegisSearchController],
  providers: [LegisSearchService],
})
export class LegisSearchModule {}
