import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccessControlModule } from 'common/guards/access-control/access-control.module';
import { LegisAdminGuard } from '../shared/guards/legis-admin.guard';
import { LegisSharedModule } from '../shared/legis-shared.module';
import { LegisPage } from './entities';
import { PagesController } from './pages.controller';
import { PagesService } from './pages.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([LegisPage]),
    AccessControlModule,
    LegisSharedModule,
  ],
  controllers: [PagesController],
  providers: [PagesService, LegisAdminGuard],
  exports: [PagesService],
})
export class PagesModule {}
