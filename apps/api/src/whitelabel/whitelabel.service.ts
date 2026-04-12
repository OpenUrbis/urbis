import { Injectable } from '@nestjs/common';
import { ApplicationName } from './enums/application-name.enum';
import { ApplicationWhitelabel } from './entities/application-whitelabel.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { SharedWhitelabel } from './entities/shared-whitelabel.entity';
import { Repository } from 'typeorm';
import { UpdateWhitelabelDto } from './dto/update-whitelabel.dto';
import { plainToInstance } from 'class-transformer';
import { IWhitelabelFindReturn } from './types/whitelabel-find-return';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WhitelabelService {
  constructor(
    @InjectRepository(SharedWhitelabel)
    private readonly sharedWhitelabel: Repository<SharedWhitelabel>,
    @InjectRepository(ApplicationWhitelabel)
    private readonly applicationWhitelabel: Repository<ApplicationWhitelabel>,
    private readonly configService: ConfigService,
  ) {}

  async getOrganizationWhitelabel(
    organizationId: string,
    applicationName: ApplicationName,
  ) {
    const [shared, application] = await Promise.all([
      this.sharedWhitelabel.findOneBy({ organizationId }),
      this.applicationWhitelabel.findOneBy({
        organizationId,
        application: applicationName,
      }),
    ]);

    return { shared, application };
  }

  async getUnifiedOrganizationWhitelabel(
    organizationId: string,
    applicationName: ApplicationName,
  ): Promise<IWhitelabelFindReturn> {
    const ids = [
      organizationId,
      this.configService.get('admin.organization.id'),
    ];

    const [shared, application] = await Promise.all([
      this.sharedWhitelabel
        .createQueryBuilder('w')
        .where('w.organizationId IN (:...ids)', { ids })
        .orderBy('CASE WHEN w.organizationId = :orgId THEN 0 ELSE 1 END', 'ASC')
        .setParameter('orgId', organizationId)
        .getMany(),
      this.applicationWhitelabel
        .createQueryBuilder('w')
        .where('w.organizationId IN (:...ids)', { ids })
        .andWhere('w.application = :app', { app: applicationName })
        .orderBy('CASE WHEN w.organizationId = :orgId THEN 0 ELSE 1 END', 'ASC')
        .setParameter('orgId', organizationId)
        .getMany(),
    ]);

    const mergedApp = { ...application[1], ...application[0] };
    const mergedShared = { ...shared[1], ...shared[0] };

    return {
      theme: mergedApp.theme,
      primaryColor: mergedShared.primaryColor,
      layout: mergedShared.layout,
    };
  }

  async updateWhitelabel(
    organizationId: string,
    application: ApplicationName,
    dto: UpdateWhitelabelDto,
  ) {
    const sharedDto = plainToInstance(SharedWhitelabel, dto, {
      excludeExtraneousValues: true,
      exposeUnsetFields: false,
    });
    const applicationDto = plainToInstance(ApplicationWhitelabel, dto, {
      excludeExtraneousValues: true,
      exposeUnsetFields: false,
    });

    const hasGlobalUpdates = Object.keys(sharedDto).length > 0;
    const hasApplicationUpdates = Object.keys(applicationDto).length > 0;

    await Promise.all(
      [
        hasGlobalUpdates &&
          this.sharedWhitelabel.upsert(
            {
              organizationId,
              ...sharedDto,
            },
            ['organizationId'],
          ),
        hasApplicationUpdates &&
          this.applicationWhitelabel.upsert(
            {
              organizationId,
              application,
              ...applicationDto,
            },
            ['organizationId', 'application'],
          ),
      ].filter(Boolean),
    );
  }
}
