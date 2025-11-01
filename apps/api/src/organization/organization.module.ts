import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganizationGuard } from 'common/guards/organization/organization.guard';
import { UserModule } from 'user/user.module';
import { OrganizationModuleEntities } from './index.entity';
import { OrganizationController } from './organization.controller';
import { OrganizationService } from './organization.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([...OrganizationModuleEntities]),
    UserModule,
  ],
  controllers: [OrganizationController],
  providers: [OrganizationService, OrganizationGuard],
  exports: [OrganizationService, OrganizationGuard],
})
export class OrganizationModule {}
