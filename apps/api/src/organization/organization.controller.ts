import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags } from '@nestjs/swagger';
import { UserData } from 'common/decorators/user/user.decorator';
import { UserGuard } from 'common/guards/user/user.guard';
import { User } from 'user/entities/user.entity';
import { OrganizationService } from './organization.service';

@ApiTags('Organization')
@UseGuards(AuthGuard('jwt'), UserGuard)
@Controller('organization')
export class OrganizationController {
  constructor(private readonly service: OrganizationService) {}

  @Get('my')
  my(@UserData() user: User) {
    return this.service.my(user.id);
  }
}
