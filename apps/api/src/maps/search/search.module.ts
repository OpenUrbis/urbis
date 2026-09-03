import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccessControlModule } from 'common/guards/access-control/access-control.module';
import { LayerSchemaEntities } from 'maps/layer-schemas/entities';
import { LayerSchemasModule } from 'maps/layer-schemas/layer-schemas.module';
import { SearchConfigEntities } from './entities';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([...SearchConfigEntities, ...LayerSchemaEntities]),
    LayerSchemasModule,
    forwardRef(() => AccessControlModule),
  ],
  controllers: [SearchController],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}
