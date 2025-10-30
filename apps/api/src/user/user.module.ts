import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserGuard } from 'common/guards/user/user.guard';
import { SharedModule } from 'shared/shared.module';
import { UserModuleEntities } from './index.entity';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [TypeOrmModule.forFeature([...UserModuleEntities]), SharedModule],
  controllers: [UserController],
  providers: [UserService, UserGuard],
  exports: [UserService, UserGuard, SharedModule],
})
export class UserModule {}
