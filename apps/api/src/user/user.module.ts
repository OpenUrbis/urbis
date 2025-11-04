import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccessControlModule } from 'common/guards/access-control/access-control.module';
import { RoleModule } from 'role/role.module';
import { SharedModule } from 'shared/shared.module';
import { UserModuleEntities } from './index.entity';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([...UserModuleEntities]),
    SharedModule,
    forwardRef(() => AccessControlModule),
    forwardRef(() => RoleModule),
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
