import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DynamicSystemDataController } from './dynamic-system-data.controller';
import { DynamicSystemDataService } from './dynamic-system-data.service';
import { DynamicSystemDataEntities } from './index.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature(DynamicSystemDataEntities),
  ],
  controllers: [DynamicSystemDataController],
  providers: [DynamicSystemDataService],
  exports: [DynamicSystemDataService],
})
export class DynamicSystemDataModule {}
