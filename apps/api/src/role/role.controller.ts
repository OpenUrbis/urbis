import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { OrganizationData } from 'common/decorators/organization/organization.decorator';
import { OrganizationGuard } from 'common/guards/organization/organization.guard';
import { RoleGuard } from 'common/guards/role/role.guard';
import { UserGuard } from 'common/guards/user/user.guard';
import { Organization } from 'organization/entities/organization.entity';
import { AssignRoleDto } from './dto/assign-role.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { Role } from './entities/role.entity';
import { RoleService } from './role.service';

@ApiTags('Role')
@UseGuards(AuthGuard('jwt'), RoleGuard, UserGuard, OrganizationGuard)
@Controller('role')
export class RoleController {
  constructor(private readonly service: RoleService) {}

  @Get('list')
  @ApiOperation({ summary: 'Get permissions' })
  @ApiResponse({ status: 200, description: 'Permissions' })
  @ApiResponse({ status: 400, description: 'Error' })
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
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search term',
    example: 0,
  })
  list(
    @Query('page', new DefaultValuePipe(0), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('search') search: string,
  ): Promise<Role[]> {
    return this.service.list({ page, limit }, search);
  }

  @Get('user/:userId')
  listUserRoles(
    @Param('userId') userId: string,
    @OrganizationData() organization: Organization,
  ) {
    return this.service.listUserRoles(userId, organization.id);
  }

  @Post()
  create(
    @Body() data: CreateRoleDto,
    @OrganizationData() organization: Organization,
  ) {
    return this.service.create(data, organization);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() data: UpdateRoleDto,
    @OrganizationData() organization: Organization,
  ) {
    return this.service.update(id, data, organization);
  }

  @Patch('assign')
  assign(@Body() data: AssignRoleDto) {
    return this.service.assign(data);
  }

  @Patch('unassign/:id')
  unassign(@Param('id') id: string) {
    return this.service.unassign(id);
  }
}
