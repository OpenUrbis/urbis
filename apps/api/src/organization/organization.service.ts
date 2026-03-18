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
import {
  OrganizationHistory,
  OrganizationHistoryAction,
} from './entities/organization-history.entity';

@Injectable()
export class OrganizationService {
  constructor(
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,

    @InjectRepository(OrganizationHistory)
    private historyRepository: Repository<OrganizationHistory>,

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

  private async logHistory(
    organization: Organization,
    action: OrganizationHistoryAction,
    actor?: User,
    changes?: Record<string, any>,
    manager?: EntityManager,
  ) {
    const history = this.historyRepository.create({
      organization,
      actor,
      action,
      changes,
    });

    if (manager) {
      await manager.save(OrganizationHistory, history);
    } else {
      await this.historyRepository.save(history);
    }
  }

  async create(
    data: CreateOrganizationDto,
    actor?: User,
    entityManager?: EntityManager,
  ) {
    const organization = this.organizationRepository.create(data);

    const savedOrganization = entityManager
      ? await entityManager.save(Organization, organization)
      : await this.organizationRepository.save(organization);

    const changes = {
      name: savedOrganization.name,
      document: savedOrganization.document,
      description: savedOrganization.description,
      metadata: savedOrganization.metadata,
    };

    await this.logHistory(
      savedOrganization,
      OrganizationHistoryAction.CREATED,
      actor,
      changes,
      entityManager,
    );

    return savedOrganization;
  }

  async update(
    id: string,
    data: UpdateOrganizationDto,
    actor?: User,
    entityManager?: EntityManager,
  ) {
    const organization = await this.findOne(id);
    const changes: Record<string, any> = {};
    let hasChanges = false;

    if (data.name !== undefined && data.name !== organization.name) {
      changes.prevName = organization.name;
      changes.name = data.name;
      organization.name = data.name;
      hasChanges = true;
    }

    // document may not be in UpdateOrganizationDto, but some internal methods map it directly,
    // so checking explicit UpdateOrganizationDto fields:
    if (
      data.description !== undefined &&
      data.description !== organization.description
    ) {
      changes.prevDescription = organization.description;
      changes.description = data.description;
      organization.description = data.description;
      hasChanges = true;
    }

    if (data.metadata !== undefined) {
      // Basic deep equal check for metadata to avoid unnecessary updates
      if (
        JSON.stringify(data.metadata) !== JSON.stringify(organization.metadata)
      ) {
        changes.prevMetadata = organization.metadata;
        changes.metadata = data.metadata;
        organization.metadata = data.metadata;
        hasChanges = true;
      }
    }

    // If there is an explicit document update (sometimes added dynamically to entity before save, handled separately,
    // but the task specifically mentions using this method. Let's make sure `data` has document if we need it)
    const anyData = data as any;
    if (
      anyData.document !== undefined &&
      anyData.document !== organization.document
    ) {
      changes.prevDocument = organization.document;
      changes.document = anyData.document;
      organization.document = anyData.document;
      hasChanges = true;
    }

    if (!hasChanges) {
      return organization; // No changes to save
    }

    const savedOrganization = entityManager
      ? await entityManager.save(Organization, organization)
      : await this.organizationRepository.save(organization);

    await this.logHistory(
      savedOrganization,
      OrganizationHistoryAction.UPDATED,
      actor,
      changes,
      entityManager,
    );

    return savedOrganization;
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
      const organization = await this.create(data, user, manager);

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
