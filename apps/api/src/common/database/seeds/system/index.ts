import { INestApplication } from '@nestjs/common';
import { SystemOrganizationSeedService } from './system-organization.seed';
import { SystemUserSeedService } from './system-user.seed';
import { SystemWhitelabelSeedService } from './system-whitelabel.seed';
import { SystemAppSettingsSeedService } from './system-app-settings.seed';
import { SystemRoleSeedService } from './system-role.seed';

export const systemSeedProviders = [
  SystemOrganizationSeedService,
  SystemUserSeedService,
  SystemWhitelabelSeedService,
  SystemAppSettingsSeedService,
  SystemRoleSeedService,
];
export const runSystemSeed = async (app: INestApplication<any>) => {
  await Promise.all([
    app.get(SystemRoleSeedService).run(),
    app.get(SystemOrganizationSeedService).run(),
    app.get(SystemAppSettingsSeedService).run(),
  ]);
  await Promise.all([
    app.get(SystemUserSeedService).run(),
    app.get(SystemWhitelabelSeedService).run(),
  ]);
};
