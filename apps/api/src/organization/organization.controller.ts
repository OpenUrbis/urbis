import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UserData } from 'common/decorators/user-data/user-data.decorator';
import { AccessControlGuard } from 'common/guards/access-control/access-control.guard';
import { User } from 'user/entities/user.entity';
import { OrganizationService } from './organization.service';

@ApiTags('Organization')
@UseGuards(AccessControlGuard)
@Controller('organization')
export class OrganizationController {
  constructor(private readonly service: OrganizationService) {}

  @Get('my')
  my(@UserData() user: User) {
    return this.service.my(user.id);
  }
}
