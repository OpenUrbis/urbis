import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { AppSettings, IAppSettings } from './entities/app-settings.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class AppSettingsService {
  constructor(
    @InjectRepository(AppSettings)
    private appSettingsRepository: Repository<AppSettings>,
  ) {}

  getSettings() {
    return this.appSettingsRepository.findOneBy({ id: 1 });
  }
  async updateSettings(update: IAppSettings) {
    await this.appSettingsRepository.update(
      { id: 1 },
      {
        data: update,
      },
    );
    return this.getSettings();
  }
}
