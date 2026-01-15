import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppSettings } from '../../../../app-settings/entities/app-settings.entity';

@Injectable()
export class SystemAppSettingsSeedService {
  constructor(
    @InjectRepository(AppSettings)
    private appSettingsRepository: Repository<AppSettings>,
  ) {}

  private async createSystemAppSettings() {
    const existingSettings = await this.appSettingsRepository.findOne({
      where: { id: 1 },
    });

    if (existingSettings) {
      return existingSettings;
    }

    const settings = this.appSettingsRepository.create({
      data: {
        organizations: {
          allowUserCreation: false,
        },
      },
    });

    return this.appSettingsRepository.save(settings);
  }

  run() {
    return this.createSystemAppSettings();
  }
}
