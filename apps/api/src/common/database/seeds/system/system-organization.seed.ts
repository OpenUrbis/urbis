import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Organization } from '../../../../organization/entities/organization.entity';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SystemOrganizationSeedService {
  constructor(
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,

    private configService: ConfigService,
  ) {}

  private async createSystemOrganization() {
    const organizationId = this.configService.get('admin.organization.id');
    const existingOrg = await this.organizationRepository.findOne({
      where: { id: organizationId },
    });

    if (existingOrg) {
      return existingOrg;
    }

    const org = this.organizationRepository.create({
      id: organizationId,
      name: this.configService.get('admin.organization.name'),
    });

    return this.organizationRepository.save(org);
  }

  run() {
    return this.createSystemOrganization();
  }
}
