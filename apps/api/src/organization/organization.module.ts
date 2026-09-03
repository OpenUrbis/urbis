import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganizationGuard } from 'common/guards/organization/organization.guard';
import { RoleModule } from 'role/role.module';
import { UserModule } from 'user/user.module';
import { OrganizationModuleEntities } from './index.entity';
import { Representation } from '../representation/entities/representation.entity';
import { OrganizationController } from './organization.controller';
import { OrganizationService } from './organization.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([...OrganizationModuleEntities, Representation]),
    forwardRef(() => UserModule),
    forwardRef(() => RoleModule),
  ],
  controllers: [OrganizationController],
  providers: [OrganizationService, OrganizationGuard],
  exports: [OrganizationService, OrganizationGuard],
})
export class OrganizationModule {}
