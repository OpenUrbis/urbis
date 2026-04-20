import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AccessControlGuard } from 'common/guards/access-control/access-control.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserService } from './user.service';
import { RequirePermission } from 'common/decorators/require-permissions/require-permissions.decorator';
import { RolePermissionScopeEnum } from 'role/enums/role-permission-scope.enum';

@UseGuards(AccessControlGuard)
@ApiTags('Users')
@Controller('user')
export class UserController {
  constructor(private readonly service: UserService) {}

  @Post()
  @RequirePermission({
    permissions: {
      action: 'create',
      resource: 'user',
      scope: RolePermissionScopeEnum.ANY,
    },
  })
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createProfileDto: CreateUserDto) {
    return this.service.create(createProfileDto);
  }

  @Get()
  list() {
    return this.service.list();
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  findOne(@Param('id') id: string) {
    return this.service.findOne({ id });
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  update(@Param('id') id: string, @Body() updateProfileDto: UpdateUserDto) {
    return this.service.update(id, updateProfileDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.softDelete(id);
  }
}
