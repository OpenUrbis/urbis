import { forwardRef, Module } from '@nestjs/common';
import { OrganizationModule } from 'organization/organization.module';
import { RoleModule } from 'role/role.module';
import { UserModule } from 'user/user.module';
import { AccessControlGuard } from './access-control.guard';

@Module({
  imports: [
    forwardRef(() => UserModule),
    forwardRef(() => RoleModule),
    forwardRef(() => OrganizationModule),
  ],
  providers: [AccessControlGuard],
  exports: [AccessControlGuard, RoleModule, UserModule],
})
export class AccessControlModule {}
