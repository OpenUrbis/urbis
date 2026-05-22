import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Patch,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ShareService } from './share.service';
import { CreateSharedMapDto } from './dto/create-shared-map.dto';
import { UpdateSharedMapDto } from './dto/update-shared-map.dto';
import { SharedMap } from './entities/shared-map.entity';

@ApiTags('Share Map')
@Controller('maps/share')
export class ShareController {
  constructor(private readonly shareService: ShareService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Share current map state' })
  @ApiResponse({
    status: 201,
    description: 'The map state has been successfully shared.',
    type: SharedMap,
  })
  create(@Body() createSharedMapDto: CreateSharedMapDto, @Req() req: any) {
    return this.shareService.create(createSharedMapDto, req.user.id);
  }

  @Get('user/history')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get shared maps by current user' })
  @ApiResponse({
    status: 200,
    description: 'List of shared maps by current user.',
    type: [SharedMap],
  })
  findAllByUser(
    @Req() req: any,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.shareService.findAllByUser(req.user.id, page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get shared map state' })
  @ApiResponse({
    status: 200,
    description: 'The shared map state.',
    type: SharedMap,
  })
  findOne(@Param('id') id: string) {
    return this.shareService.findOne(id);
  }

  @Get('public/list')
  @ApiOperation({ summary: 'Get public shared maps' })
  @ApiResponse({
    status: 200,
    description: 'List of public shared maps.',
    type: [SharedMap],
  })
  findAllPublic(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('type') type: string = 'map',
  ) {
    return this.shareService.findAllPublic(page, limit, type);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Update shared map state' })
  @ApiResponse({
    status: 200,
    description: 'The map state has been successfully updated.',
    type: SharedMap,
  })
  update(
    @Param('id') id: string,
    @Body() updateSharedMapDto: UpdateSharedMapDto,
    @Req() req: any,
  ) {
    return this.shareService.update(id, updateSharedMapDto, req.user.id);
  }
}
