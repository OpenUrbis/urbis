import {
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { SYSTEM_ROLES } from './../common/constants/system-roles.const';
import { IPaginationOptions } from 'common/utils/types/pagination-options';
import { RoleService } from 'role/role.service';
import {
  EntityManager,
  FindOptionsWhere,
  ILike,
  In,
  Not,
  Or,
  Repository,
} from 'typeorm';
import { User } from 'user/entities/user.entity';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { Organization } from './entities/organization.entity';

@Injectable()
export class OrganizationService {
  constructor(
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,

    @InjectEntityManager()
    private readonly entityManager: EntityManager,

    @Inject(forwardRef(() => RoleService))
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

  async findOneByDocument(document: string) {
    return this.organizationRepository.findOne({
      where: { document },
    });
  }

  async list(
    pagination: IPaginationOptions,
    search?: string,
    exclude?: string[],
  ): Promise<{ data: Organization[]; total: number }> {
    if (pagination.page > 0) pagination.page--;
    const { limit, page } = pagination;
    const where: FindOptionsWhere<Organization> = {};

    if (search) where.name = Or(ILike(`%${search}%`));

    if (exclude && exclude?.length > 0) where.id = Not(In(exclude));

    const [data, total] = await this.organizationRepository.findAndCount({
      where: where,
      take: limit,
      skip: page * limit,
    });

    return { data, total };
  }

  async create(data: CreateOrganizationDto, entityManager?: EntityManager) {
    const organization = this.organizationRepository.create(data);

    return entityManager
      ? entityManager.save(Organization, organization)
      : this.organizationRepository.save(organization);
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

  async createOwn(data: CreateOrganizationDto, user: User) {
    return this.entityManager.transaction(async (manager) => {
      const organization = await this.create(data, manager);

      await this.roleService.assign(
        {
          organizationId: organization.id,
          userId: user.id,
          roleId: SYSTEM_ROLES.admin,
        },
        organization,
        manager,
      );

      return organization;
    });
  }
}
