import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IPaginationOptions } from 'common/utils/types/pagination-options';
import { RoleService } from 'role/role.service';
import { FindOptionsWhere, ILike, In, Not, Or, Repository } from 'typeorm';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { Organization } from './entities/organization.entity';

@Injectable()
export class OrganizationService {
  constructor(
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,

    private readonly roleService: RoleService,
  ) {}

  async findOne(id: string) {
    const organization = await this.organizationRepository.findOne({
      where: { id },
    });

    if (!organization)
      throw new NotFoundException({ message: 'Organization is not found' });

    return organization;
  }

  list(
    pagination: IPaginationOptions,
    search?: string,
    exclude?: string[],
  ): Promise<Organization[]> {
    const { limit, page } = pagination;
    const where: FindOptionsWhere<Organization> = {};

    if (search) where.name = Or(ILike(`%${search}%`));

    if (exclude && exclude?.length > 0) where.id = Not(In(exclude));

    return this.organizationRepository.find({
      where: where,
      take: limit,
      skip: page * limit,
    });
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

  getByUser(userId: string) {
    return this.organizationRepository.find({
      where: { userRoleAssignments: { userId } },
      relations: [
        'userRoleAssignments',
        'userRoleAssignments.user',
        'userRoleAssignments.role',
      ],
    });
  }
}
