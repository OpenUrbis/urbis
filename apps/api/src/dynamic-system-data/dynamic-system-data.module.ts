import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoleModule } from '../role/role.module';
import { UserModule } from '../user/user.module';
import { DynamicSystemDataController } from './dynamic-system-data.controller';
import { DynamicSystemDataService } from './dynamic-system-data.service';
import { DynamicSystemDataEntities } from './index.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature(DynamicSystemDataEntities),
    forwardRef(() => UserModule),
    forwardRef(() => RoleModule),
  ],
  controllers: [DynamicSystemDataController],
  providers: [DynamicSystemDataService],
  exports: [DynamicSystemDataService],
})
export class DynamicSystemDataModule {}
