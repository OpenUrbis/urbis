import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'auth/auth.module';
import { AccessControlModule } from 'common/guards/access-control/access-control.module';
import { OrganizationModule } from 'organization/organization.module';
import { SharedModule } from 'shared/shared.module';
import { UserModule } from 'user/user.module';
import { RoleModuleEntities } from './index.entity';
import { PermissionController } from './permission/permission.controller';
import { PermissionService } from './permission/permission.service';
import { RoleController } from './role.controller';
import { RoleService } from './role.service';

@Module({
  imports: [
    SharedModule,
    TypeOrmModule.forFeature([...RoleModuleEntities]),
    forwardRef(() => OrganizationModule),
    forwardRef(() => UserModule),
    forwardRef(() => AuthModule),
    forwardRef(() => AccessControlModule),
  ],
  controllers: [RoleController, PermissionController],
  providers: [RoleService, PermissionService],
  exports: [RoleService, PermissionService],
})
export class RoleModule {}
