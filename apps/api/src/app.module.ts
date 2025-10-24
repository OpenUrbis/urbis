import { Module } from '@nestjs/common';
import { OidcModule } from 'auth/oidc/oidc.module';
import { LayerSchemaColors } from 'maps/layer-schemas/entities/layer-schema-color.entity';
import { LayerSchema } from 'maps/layer-schemas/entities/layer-schema.entity';
import { MapConfig } from 'maps/map-config/entities/map-config.entity';
import { AuthModule } from './auth/auth.module';
import { FilesModule } from './files/files.module';
import { LayerGroup } from './maps/layer-groups/entities/layer-group.entity';
import { MapsModule } from './maps/maps.module';
import { SearchConfig } from './maps/search/entities/search-config.entity';
import { DatabaseModule } from './shared/database.module';
import { SharedModule } from './shared/shared.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    SharedModule,
    DatabaseModule.forRoot([
      LayerSchema,
      LayerGroup,
      LayerSchemaColors,
      SearchConfig,
      MapConfig,
    ]),
    FilesModule,
    MapsModule,
    UserModule,
    AuthModule,
    OidcModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
