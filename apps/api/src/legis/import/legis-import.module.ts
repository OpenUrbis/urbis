import { Module } from '@nestjs/common';
import { AccessControlModule } from 'common/guards/access-control/access-control.module';
import { LegisImportController } from './legis-import.controller';
import { LegisImportService } from './legis-import.service';
import { LegisAdminGuard } from '../shared/guards/legis-admin.guard';

@Module({
  imports: [AccessControlModule],
  controllers: [LegisImportController],
  providers: [LegisImportService, LegisAdminGuard],
})
export class LegisImportModule {}