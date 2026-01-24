import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { SYSTEM_ROLES } from 'common/constants/system-roles.const';
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

  async list(
    pagination: IPaginationOptions,
    search?: string,
    exclude?: string[],
    allowedIds?: string[],
  ): Promise<{ data: Organization[]; total: number }> {
    if (pagination.page > 0) pagination.page--;
    const { limit, page } = pagination;
    const where: FindOptionsWhere<Organization> = {};

    if (search) where.name = Or(ILike(`%${search}%`));

    if (allowedIds) {
      let finalIds = allowedIds;
      if (exclude && exclude.length > 0) {
        const excludeSet = new Set(exclude);
        finalIds = allowedIds.filter((id) => !excludeSet.has(id));
      }

      if (finalIds.length === 0) return { data: [], total: 0 };
      where.id = In(finalIds);
    } else if (exclude && exclude?.length > 0) {
      where.id = Not(In(exclude));
    }

    const [data, total] = await this.organizationRepository.findAndCount({
      where: where,
      take: limit,
      skip: page * limit,
      relations: ['parent'],
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

    if (
      data.parentId !== undefined &&
      data.parentId !== organization.parentId &&
      data.parentId !== null
    ) {
      if (data.parentId === id) {
        throw new BadRequestException('Organization cannot be its own parent');
      }
      const descendants = await this.findDescendants([id]);
      const isDescendant = descendants.some((d) => d.id === data.parentId);
      if (isDescendant) {
        throw new BadRequestException(
          'Cannot set a descendant as parent (cycle detected)',
        );
      }
    }

    if (data.name !== undefined) organization.name = data.name;
    if (data.description !== undefined)
      organization.description = data.description;
    if (data.metadata !== undefined) organization.metadata = data.metadata;
    if (data.parentId !== undefined) organization.parentId = data.parentId;

    return await this.organizationRepository.save(organization);
  }

  async findDescendants(orgIds: string[]): Promise<Organization[]> {
    if (orgIds.length === 0) return [];

    const rawData = await this.organizationRepository.query(
      `
      WITH RECURSIVE org_tree AS (
          SELECT id, "parentId", "deletedAt"
          FROM organizations
          WHERE id = ANY($1) AND "deletedAt" IS NULL
          UNION
          SELECT o.id, o."parentId", o."deletedAt"
          FROM organizations o
          INNER JOIN org_tree ot ON ot.id = o."parentId"
          WHERE o."deletedAt" IS NULL
      )
      SELECT * FROM org_tree;
      `,
      [orgIds],
    );

    return this.organizationRepository.create(rawData);
  }

  async findHierarchy(orgIds: string[]): Promise<Organization[]> {
    if (orgIds.length === 0) return [];

    const rawData = await this.organizationRepository.query(
      `
      WITH RECURSIVE 
      ancestors AS (
          SELECT id, "parentId" as parent_id
          FROM organizations
          WHERE id = ANY($1) AND "deletedAt" IS NULL
          UNION
          SELECT o.id, o."parentId" as parent_id
          FROM organizations o
          INNER JOIN ancestors a ON a.parent_id = o.id
          WHERE o."deletedAt" IS NULL
      ),
      roots AS (
          SELECT DISTINCT id FROM ancestors WHERE parent_id IS NULL
      ),
      tree AS (
          SELECT id, "parentId", "deletedAt"
          FROM organizations
          WHERE id IN (SELECT id FROM roots) AND "deletedAt" IS NULL
          UNION
          SELECT o.id, o."parentId", o."deletedAt"
          FROM organizations o
          INNER JOIN tree t ON t.id = o."parentId"
          WHERE o."deletedAt" IS NULL
      )
      SELECT * FROM tree;
      `,
      [orgIds],
    );

    return this.organizationRepository.create(rawData);
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
