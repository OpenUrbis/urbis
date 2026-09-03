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
import { EntityManager, In, Repository } from 'typeorm';
import { User } from 'user/entities/user.entity';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { Organization } from './entities/organization.entity';
import { Representation } from '../representation/entities/representation.entity';
import {
  REPRESENTATION_ROLE_LABELS,
  REPRESENTATION_RULES,
} from '../representation/representation-rules';
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
    @InjectRepository(Representation)
    private representationRepository: Repository<Representation>,
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
    type?: string,
    status?: 'active' | 'inactive',
  ): Promise<{ data: any[]; total: number }> {
    if (pagination.page > 0) pagination.page--;
    const { limit, page } = pagination;

    const query = this.organizationRepository
      .createQueryBuilder('organization')
      .withDeleted()
      .leftJoin(
        User,
        'personalUser',
        '"personalUser"."id"::text = organization.metadata ->> \'userId\'',
      )
      .loadRelationCountAndMap(
        'organization.userCount',
        'organization.userRoleAssignments',
      )
      .orderBy('organization.name', 'ASC')
      .take(limit)
      .skip(page * limit);

    if (search?.trim()) {
      const normalizedSearch = search.trim();
      const digitsSearch = normalizedSearch.replace(/\D/g, '');
      query.andWhere(
        `(
          organization.name ILIKE :search
          OR "personalUser"."firstName" ILIKE :search
          OR "personalUser"."lastName" ILIKE :search
          OR CONCAT("personalUser"."firstName", ' ', "personalUser"."lastName") ILIKE :search
          OR organization.document ILIKE :search
          ${digitsSearch ? "OR regexp_replace(COALESCE(organization.document, ''), '[^0-9]', '', 'g') ILIKE :documentSearch" : ''}
        )`,
        {
          search: `%${normalizedSearch}%`,
          ...(digitsSearch ? { documentSearch: `%${digitsSearch}%` } : {}),
        },
      );
    }

    if (exclude?.length) {
      query.andWhere('organization.id NOT IN (:...exclude)', { exclude });
    }

    if (status === 'active') {
      query.andWhere('organization."deletedAt" IS NULL');
    } else if (status === 'inactive') {
      query.andWhere('organization."deletedAt" IS NOT NULL');
    }

    if (type) {
      query.andWhere(
        "(organization.metadata ->> 'accountType' = :type OR organization.metadata ->> 'representedType' = :type)",
        { type },
      );
    }

    const [organizations, total] = await query.getManyAndCount();
    const personalUserIds = organizations
      .map((organization) => organization.metadata?.userId)
      .filter((id): id is string => Boolean(id));
    const personalUsers = personalUserIds.length
      ? await this.entityManager.getRepository(User).find({
          where: { id: In(personalUserIds) },
        })
      : [];
    const personalUsersById = new Map(
      personalUsers.map((personalUser) => [personalUser.id, personalUser]),
    );
    const data = organizations.map((organization) => {
      const personalUser = personalUsersById.get(organization.metadata?.userId);
      const organizationData = organization as any;
      const fullName = [personalUser?.firstName, personalUser?.lastName]
        .filter(Boolean)
        .join(' ');

      return {
        ...organizationData,
        ...(fullName ? { name: fullName } : {}),
        status: organization.deletedAt ? 'inactive' : 'active',
        registrationType: organization.metadata?.accountType,
        representedType: organization.metadata?.representedType,
      };
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

  private isHiddenSystemOrganization(organization: Organization): boolean {
    const metadata = organization.metadata || {};
    return (
      metadata.isSystem === true ||
      metadata.hidden === true ||
      metadata.isHidden === true ||
      ['codata', 'urbis'].includes(organization.name?.trim().toLowerCase())
    );
  }

  async my(userId: string, includeHidden = false) {
    const isGlobalAdmin = await this.roleService.hasSystemRole(
      userId,
      SYSTEM_ROLES.admin,
    );

    const organizations = await this.organizationRepository.find({
      where: { userRoleAssignments: { userId } },
    });

    if (isGlobalAdmin || includeHidden) {
      return organizations;
    }

    return organizations.filter((org) => !this.isHiddenSystemOrganization(org));
  }

  async myAdmin(userId: string, includeHidden = false) {
    const isGlobalAdmin = await this.roleService.hasSystemRole(
      userId,
      SYSTEM_ROLES.admin,
    );

    const organizations = await this.organizationRepository.find({
      where: {
        userRoleAssignments: {
          userId,
          roleId: In([SYSTEM_ROLES.admin, SYSTEM_ROLES.organizationAdmin]),
        },
      },
    });

    if (isGlobalAdmin || includeHidden) {
      return organizations;
    }

    return organizations.filter((org) => !this.isHiddenSystemOrganization(org));
  }

  async getByUser(userId: string) {
    const organizations = await this.organizationRepository.find({
      where: { userRoleAssignments: { userId } },
      relations: [
        'userRoleAssignments',
        'userRoleAssignments.user',
        'userRoleAssignments.role',
      ],
    });

    if (!organizations.length) return organizations;

    const representations = await this.representationRepository.find({
      where: { organizationId: In(organizations.map(({ id }) => id)) },
      order: { createdAt: 'DESC' },
    });
    const representationByOrganization = new Map(
      representations.map((representation) => [
        representation.organizationId,
        representation,
      ]),
    );

    return organizations.map((organization) => {
      const representation = representationByOrganization.get(organization.id);
      if (!representation) return organization;

      return {
        ...organization,
        representationType: representation.representationType,
        representedType:
          REPRESENTATION_RULES[representation.representationType || '']
            ?.representedType || representation.representationType,
        representativeType:
          REPRESENTATION_ROLE_LABELS[representation.representationType || ''],
        representative: representation.requester
          ? {
              id: representation.requester.id,
              firstName: representation.requester.firstName,
              lastName: representation.requester.lastName,
            }
          : undefined,
      };
    });
  }

  async createOwn(data: CreateOrganizationDto, user: User) {
    return this.entityManager.transaction(async (manager) => {
      const organization = await this.create(data, user, manager);

      await this.roleService.assign(
        {
          organizationId: organization.id,
          userId: user.id,
          roleId: SYSTEM_ROLES.organizationAdmin,
        },
        organization,
        manager,
      );

      return organization;
    });
  }
}
