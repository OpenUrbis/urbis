import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AccessControlGuard } from 'common/guards/access-control/access-control.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserService } from './user.service';
import { RequirePermission } from 'common/decorators/require-permissions/require-permissions.decorator';
import { RolePermissionScopeEnum } from 'role/enums/role-permission-scope.enum';
import { UserData } from 'common/decorators/user-data/user-data.decorator';

@UseGuards(AccessControlGuard)
@ApiTags('Users')
@ApiBearerAuth()
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
  @ApiQuery({
    name: 'page',
    required: false,
    type: String,
    description: 'Page of pagination',
    example: 0,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: String,
    description: 'Limit of registers',
    example: 100,
  })
  list(
    @Query('page', new DefaultValuePipe(0), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('organizationId') organizationId?: string,
  ) {
    return this.service.list({ page, limit }, organizationId);
  }

  @Get('me/usage')
  @HttpCode(HttpStatus.OK)
  async getUsage(@UserData() user: any) {
    return this.service.getUsage(user);
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
