import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LayerSchemaEntities } from 'maps/layer-schemas/entities';
import { LayerGroupEntities } from './entities';
import { LayerGroupsController } from './layer-groups.controller';
import { LayerGroupsService } from './layer-groups.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([...LayerGroupEntities, ...LayerSchemaEntities]),
  ],
  exports: [LayerGroupsService],
  providers: [LayerGroupsService],
  controllers: [LayerGroupsController],
})
export class LayerGroupsModule {}
