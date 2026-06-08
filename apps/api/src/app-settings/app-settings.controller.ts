import { Body, Controller, Get, Patch } from '@nestjs/common';
import { AppSettingsService } from './app-settings.service';
import { UpdateAppSettingsDto } from './dto/update-app-settings.dto';

@Controller('app-settings')
export class AppSettingsController {
  constructor(private readonly service: AppSettingsService) {}

  @Get('')
  getSettings() {
    return this.service.getSettings();
  }

  @Patch('')
  updateSettings(@Body() body: UpdateAppSettingsDto) {
    return this.service.updateSettings(body);
  }
}
