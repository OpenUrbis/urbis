import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccessControlModule } from 'common/guards/access-control/access-control.module';
import { OrganizationModule } from '../organization/organization.module';
import { RoleModule } from '../role/role.module';
import { UserModule } from '../user/user.module';
import { SolicitationEntities } from './entities';
import { SolicitationController } from './solicitation.controller';
import { SolicitationService } from './solicitation.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([...SolicitationEntities]),
    forwardRef(() => OrganizationModule),
    forwardRef(() => RoleModule),
    forwardRef(() => UserModule),
    AccessControlModule,
  ],
  controllers: [SolicitationController],
  providers: [SolicitationService],
  exports: [SolicitationService],
})
export class SolicitationModule {}
