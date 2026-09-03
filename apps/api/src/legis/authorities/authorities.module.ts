import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccessControlModule } from 'common/guards/access-control/access-control.module';
import { LegisAdminGuard } from '../shared/guards/legis-admin.guard';
import { LegisSharedModule } from '../shared/legis-shared.module';
import { AuthoritiesController } from './authorities.controller';
import { AuthoritiesService } from './authorities.service';
import { LegisAuthority } from './entities';
import { LegisPage } from '../pages/entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([LegisAuthority, LegisPage]),
    AccessControlModule,
    LegisSharedModule,
  ],
  controllers: [AuthoritiesController],
  providers: [AuthoritiesService, LegisAdminGuard],
  exports: [AuthoritiesService],
})
export class AuthoritiesModule {}
