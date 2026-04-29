import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { UserData } from 'common/decorators/user-data/user-data.decorator';
import { AccessControlGuard } from 'common/guards/access-control/access-control.guard';
import { User } from 'user/entities/user.entity';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { OrganizationService } from './organization.service';

@ApiTags('Organization')
@ApiBearerAuth()
@UseGuards(AccessControlGuard)
@Controller('organization')
export class OrganizationController {
  constructor(private readonly service: OrganizationService) {}

  @Get('my')
  my(@UserData() user: User) {
    return this.service.my(user.id);
  }

  @Get('user/:id')
  getByUser(@Param('id') userId: string) {
    return this.service.getByUser(userId);
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
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search term',
    example: 0,
  })
  @ApiQuery({
    name: 'exclude',
    required: false,
    type: String,
    description: 'Exclude permissions',
    example: "['role:create','user:create']",
  })
  list(
    @Query('page', new DefaultValuePipe(0), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('search') search: string,
    @Query('exclude') exclude: string[] | string,
  ) {
    return this.service.list(
      { page, limit },
      search,
      typeof exclude === 'string' ? [exclude] : exclude,
    );
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() data: CreateOrganizationDto) {
    return this.service.create(data);
  }

  @Post('own')
  async createOwn(@Body() data: CreateOrganizationDto, @UserData() user: User) {
    return this.service.createOwn(data, user);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: UpdateOrganizationDto) {
    return this.service.update(id, data);
  }
}
