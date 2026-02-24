import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'auth/auth.module';
import { RoleGuard } from 'common/guards/role/role.guard';
import { OrganizationModule } from 'organization/organization.module';
import { SharedModule } from 'shared/shared.module';
import { UserModule } from 'user/user.module';
import { RoleModuleEntities } from './index.entity';
import { RoleController } from './role.controller';
import { RoleService } from './role.service';
import { PermissionController } from './permission/permission.controller';
import { PermissionService } from './permission/permission.service';

@Module({
  imports: [
    SharedModule,
    TypeOrmModule.forFeature([...RoleModuleEntities]),
    OrganizationModule,
    UserModule,
    AuthModule,
  ],
  controllers: [RoleController, PermissionController],
  providers: [RoleService, RoleGuard, PermissionService],
})
export class RoleModule {}
