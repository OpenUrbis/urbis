import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccessControlModule } from 'common/guards/access-control/access-control.module';
import { LayerGroupsModule } from 'maps/layer-groups/layer-groups.module';
import { SharedModule } from 'shared/shared.module';
import { LayerSchemaEntities } from './entities';
import { LayerSchemasController } from './layer-schemas.controller';
import { LayerSchemasService } from './layer-schemas.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([...LayerSchemaEntities]),
    LayerGroupsModule,
    SharedModule,
    forwardRef(() => AccessControlModule),
  ],
  providers: [LayerSchemasService],
  exports: [LayerSchemasService],
  controllers: [LayerSchemasController],
})
export class LayerSchemasModule {}
