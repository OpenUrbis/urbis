import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccessControlModule } from 'common/guards/access-control/access-control.module';
import { OrganizationModule } from '../organization/organization.module';
import { RoleModule } from '../role/role.module';
import { UserModule } from '../user/user.module';
import { RepresentationEntities } from './entities';
import { RepresentationController } from './representation.controller';
import { RepresentationService } from './representation.service';
import { MailModule } from '../common/mail/mail.module';
import { OpenCnpjModule } from '../maps/open-cnpj/open-cnpj.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([...RepresentationEntities]),
    forwardRef(() => OrganizationModule),
    forwardRef(() => RoleModule),
    forwardRef(() => UserModule),
    forwardRef(() => AccessControlModule),
    MailModule,
    OpenCnpjModule,
  ],
  controllers: [RepresentationController],
  providers: [RepresentationService],
  exports: [RepresentationService],
})
export class RepresentationModule {}
