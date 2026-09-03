import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccessControlModule } from 'common/guards/access-control/access-control.module';
import { MailModule } from 'common/mail/mail.module';
import { OrganizationModule } from 'organization/organization.module';
import { RoleModule } from 'role/role.module';
import { SharedModule } from 'shared/shared.module';
import { UserModuleEntities } from './index.entity';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UserApiKeyService } from './user-api-key.service';
import { RepresentationModule } from '../representation/representation.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([...UserModuleEntities]),
    SharedModule,
    forwardRef(() => AccessControlModule),
    forwardRef(() => RoleModule),
    forwardRef(() => OrganizationModule),
    forwardRef(() => MailModule),
    forwardRef(() => RepresentationModule),
  ],
  controllers: [UserController],
  providers: [UserService, UserApiKeyService],
  exports: [UserService, UserApiKeyService],
})
export class UserModule {}
