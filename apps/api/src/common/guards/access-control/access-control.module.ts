import { forwardRef, Module } from '@nestjs/common';
import { RoleModule } from 'role/role.module';
import { UserModule } from 'user/user.module';
import { AccessControlGuard } from './access-control.guard';

@Module({
  imports: [forwardRef(() => UserModule), forwardRef(() => RoleModule)],
  providers: [AccessControlGuard],
  exports: [AccessControlGuard, RoleModule],
})
export class AccessControlModule {}
