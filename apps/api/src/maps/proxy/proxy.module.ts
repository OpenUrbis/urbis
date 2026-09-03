import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProxyController } from './proxy.controller';
import { LayerSchema } from '../layer-schemas/entities/layer-schema.entity';
import { UserRoleAssignment } from '../../role/entities/user-role-assignment.entity';
import { OrganizationModule } from 'organization/organization.module';
import { OptionalProxyAuthGuard } from 'common/guards/optional-proxy-auth.guard';
import { ProxyThrottlerGuard } from 'common/guards/proxy-throttler.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([LayerSchema, UserRoleAssignment]),
    OrganizationModule,
  ],
  controllers: [ProxyController],
  providers: [OptionalProxyAuthGuard, ProxyThrottlerGuard],
})
export class ProxyModule {}
