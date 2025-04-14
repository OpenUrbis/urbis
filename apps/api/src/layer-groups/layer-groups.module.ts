import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LayerGroupsService } from './layer-groups.service';
import { LayerGroupsController } from './layer-groups.controller';
import { LayerGroup } from './entities/layer-group.entity';

@Module({
  imports: [TypeOrmModule.forFeature([LayerGroup])],
  providers: [LayerGroupsService],
  controllers: [LayerGroupsController],
})
export class LayerGroupsModule {}
