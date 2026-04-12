import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApplicationWhitelabel } from '../../../../whitelabel/entities/application-whitelabel.entity';
import { SharedWhitelabel } from '../../../../whitelabel/entities/shared-whitelabel.entity';
import { ConfigService } from '@nestjs/config';
import { ApplicationTheme } from '../../../../whitelabel/enums/application-theme.enum';
import { ApplicationName } from '../../../../whitelabel/enums/application-name.enum';

@Injectable()
export class SystemWhitelabelSeedService {
  constructor(
    @InjectRepository(ApplicationWhitelabel)
    private applicationWhitelabelRepository: Repository<ApplicationWhitelabel>,

    @InjectRepository(SharedWhitelabel)
    private sharedWhitelabelRepository: Repository<SharedWhitelabel>,

    private configService: ConfigService,
  ) {}

  private async createSystemSharedWhitelabel() {
    const organizationId = this.configService.get('admin.organization.id');
    const existingWhitelabel = await this.sharedWhitelabelRepository.findOne({
      where: { organizationId },
    });

    if (existingWhitelabel) {
      return existingWhitelabel;
    }

    const whitelabel = this.sharedWhitelabelRepository.create({
      organizationId,
      primaryColor: '#05014a',
      layout: {
        rails: {
          items: [
            {
              icon: 'article',
              name: 'components.rails.items.docs',
              action: 'REDIRECT',
              externalRedirect: true,
              redirectTo: ApplicationName.DOCS,
            },
            {
              icon: 'account_circle',
              name: 'components.rails.items.accounts',
              action: 'REDIRECT',
              externalRedirect: true,
              redirectTo: ApplicationName.ACCOUNTS,
            },
          ],
        },
      },
    });

    return this.sharedWhitelabelRepository.save(whitelabel);
  }

  private async createSytemApplicationWhitelabel(
    applicationName: ApplicationName,
  ) {
    const organizationId = this.configService.get('admin.organization.id');
    const existingWhitelabel =
      await this.applicationWhitelabelRepository.findOne({
        where: { organizationId },
      });

    if (existingWhitelabel) {
      return existingWhitelabel;
    }

    const whitelabel = this.applicationWhitelabelRepository.create({
      organizationId,
      application: applicationName,
      theme: ApplicationTheme.LIGHT,
    });

    return this.applicationWhitelabelRepository.save(whitelabel);
  }

  run() {
    return Promise.all([
      this.createSystemSharedWhitelabel(),
      this.createSytemApplicationWhitelabel(ApplicationName.ACCOUNTS),
    ]);
  }
}
