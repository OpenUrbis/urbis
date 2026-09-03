import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoleModule } from '../role/role.module';
import { UserModule } from '../user/user.module';
import { WhitelabelModuleEntities } from './index.entity';
import { WhitelabelController } from './whitelabel.controller';
import { WhitelabelService } from './whitelabel.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([...WhitelabelModuleEntities]),
    forwardRef(() => UserModule),
    forwardRef(() => RoleModule),
  ],
  controllers: [WhitelabelController],
  providers: [WhitelabelService],
  exports: [WhitelabelService],
})
export class WhitelabelModule {}
