import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LayerSchema } from '../layer-schemas/entities/layer-schema.entity';
import { ExportController } from './export.controller';
import { ExportService } from './export.service';

@Module({
  imports: [HttpModule, TypeOrmModule.forFeature([LayerSchema])],
  controllers: [ExportController],
  providers: [ExportService],
  exports: [ExportService],
})
export class ExportModule {}
