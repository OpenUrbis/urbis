import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { Organization } from './entities/organization.entity';

@Injectable()
export class OrganizationService {
  constructor(
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
  ) {}

  async findOne(id: string) {
    const organization = await this.organizationRepository.findOne({
      where: { id },
    });

    if (!organization)
      throw new NotFoundException({ message: 'Organization is not found' });

    return organization;
  }

  async list() {
    return this.organizationRepository.find();
  }

  async create(data: CreateOrganizationDto) {
    const organization = this.organizationRepository.create(data);

    return await this.organizationRepository.save(organization);
  }

  async update(id: string, data: UpdateOrganizationDto) {
    const organization = await this.findOne(id);

    if (data.name !== undefined) organization.name = data.name;
    if (data.description !== undefined)
      organization.description = data.description;
    if (data.metadata !== undefined) organization.metadata = data.metadata;

    return await this.organizationRepository.save(organization);
  }

  async my(userId: string) {
    const organization = await this.organizationRepository.find({
      where: { userRoleAssignments: { userId } },
    });

    return organization;
  }
}
