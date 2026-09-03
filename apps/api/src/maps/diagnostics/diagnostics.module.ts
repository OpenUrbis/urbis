import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AccessControlModule } from 'common/guards/access-control/access-control.module';
import { LegisPage } from '../../legis/pages/entities/legis-page.entity';
import { LayerSchema } from '../layer-schemas/entities/layer-schema.entity';
import { SearchConfig } from '../search/entities/search-config.entity';
import { DiagnosticsController } from './diagnostics.controller';
import { DiagnosticsService } from './diagnostics.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([LegisPage, LayerSchema, SearchConfig]),
    ConfigModule,
    forwardRef(() => AccessControlModule),
  ],
  controllers: [DiagnosticsController],
  providers: [DiagnosticsService],
  exports: [DiagnosticsService],
})
export class DiagnosticsModule {}
