import { forwardRef, Module } from '@nestjs/common';
import { RoleModule } from 'role/role.module';
import { UserModule } from 'user/user.module';
import { AccessControlGuard } from './access-control.guard';
import { OptionalAccessControlGuard } from './optional-access-control.guard';

@Module({
  imports: [forwardRef(() => UserModule), forwardRef(() => RoleModule)],
  providers: [AccessControlGuard, OptionalAccessControlGuard],
  exports: [
    AccessControlGuard,
    OptionalAccessControlGuard,
    RoleModule,
    UserModule,
  ],
})
export class AccessControlModule {}
