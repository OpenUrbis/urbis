import { Body, Controller, Get, Param, Post, Query, Patch } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ShareService } from './share.service';
import { CreateSharedMapDto } from './dto/create-shared-map.dto';
import { UpdateSharedMapDto } from './dto/update-shared-map.dto';
import { SharedMap } from './entities/shared-map.entity';

@ApiTags('Share Map')
@Controller('maps/share')
export class ShareController {
  constructor(private readonly shareService: ShareService) {}

  @Post()
  @ApiOperation({ summary: 'Share current map state' })
  @ApiResponse({
    status: 201,
    description: 'The map state has been successfully shared.',
    type: SharedMap,
  })
  create(@Body() createSharedMapDto: CreateSharedMapDto) {
    return this.shareService.create(createSharedMapDto);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get shared maps by user' })
  @ApiResponse({
    status: 200,
    description: 'List of shared maps by user.',
    type: [SharedMap],
  })
  findAllByUser(
    @Param('userId') userId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.shareService.findAllByUser(userId, page, limit);
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

  @Patch(':id')
  @ApiOperation({ summary: 'Update shared map state' })
  @ApiResponse({
    status: 200,
    description: 'The map state has been successfully updated.',
    type: SharedMap,
  })
  update(@Param('id') id: string, @Body() updateSharedMapDto: UpdateSharedMapDto) {
    return this.shareService.update(id, updateSharedMapDto);
  }
}
