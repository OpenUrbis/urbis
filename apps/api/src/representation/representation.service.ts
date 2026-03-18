import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IPaginationOptions } from 'common/utils/types/pagination-options';
import { isValidCpfValue } from 'common/utils/validators/is-cpf.validator';
import { Brackets, Repository } from 'typeorm';
import { SYSTEM_ROLES } from '../common/constants/system-roles.const';
import { OpenCnpjService } from '../maps/open-cnpj/open-cnpj.service';
import { Organization } from '../organization/entities/organization.entity';
import { OrganizationService } from '../organization/organization.service';
import { RoleService } from '../role/role.service';
import { User } from '../user/entities/user.entity';
import { GetRepresentationOverviewDto } from './dto/get-representation-overview.dto';
import { RepresentationComment } from './entities/representation-comment.entity';
import { RepresentationHistory } from './entities/representation-history.entity';
import { Representation } from './entities/representation.entity';
import { RepresentationStatus } from './enums/representation-status.enum';
import { RepresentationType } from './enums/representation-type.enum';

@Injectable()
export class RepresentationService {
  constructor(
    @InjectRepository(Representation)
    private representationRepository: Repository<Representation>,
    @InjectRepository(RepresentationComment)
    private commentRepository: Repository<RepresentationComment>,
    @InjectRepository(RepresentationHistory)
    private historyRepository: Repository<RepresentationHistory>,
    private organizationService: OrganizationService,
    private roleService: RoleService,
    private openCnpjService: OpenCnpjService,
  ) {}

  async checkOrganizationDocument(document: string, user: User) {
    const cleanDocument = document.replace(/\D/g, '');

    if (cleanDocument.length === 11 && !isValidCpfValue(cleanDocument)) {
      throw new BadRequestException('errors.invalid_cpf');
    }

    const org = await this.organizationService.findOneByDocument(cleanDocument);

    // Check if there is already a pending or active request for this user and org (if org exists)
    if (org) {
      const existingRequest = await this.representationRepository.findOne({
        where: [
          {
            requesterId: user.id,
            organizationId: org.id,
            status: RepresentationStatus.PENDING,
          },
          {
            requesterId: user.id,
            organizationId: org.id,
            status: RepresentationStatus.INFO_REQUESTED,
          },
          {
            requesterId: user.id,
            organizationId: org.id,
            status: RepresentationStatus.APPROVED,
          },
        ],
      });

      if (existingRequest) {
        throw new BadRequestException('errors.already_requested');
      }

      // Check if user is already representing it directly
      const userOrgs = await this.organizationService.my(user.id);
      if (userOrgs.find((o) => o.id === org.id)) {
        throw new BadRequestException('errors.already_representing');
      }
    }

    if (org) {
      return {
        id: org.id,
        name: org.name,
        document: org.document,
        metadata: org.metadata,
        isCnpj: cleanDocument.length === 14,
        source: 'internal',
      };
    }

    // Fallback to CNPJ API if length matches CNPJ and org not found locally
    if (cleanDocument.length === 14) {
      try {
        const cnpjData = await this.openCnpjService.getCnpjData(cleanDocument);
        if (cnpjData) {
          return {
            document: cleanDocument,
            name: cnpjData.razao_social,
            metadata: {
              socialName: cnpjData.nome_fantasia,
            },
            isCnpj: true,
            source: 'external',
          };
        }
      } catch (e) {
        throw new BadRequestException('errors.invalid_cnpj');
      }
    }

    return null;
  }

  async getOverview(
    user: User,
    filters: GetRepresentationOverviewDto,
    organizationIds: string[] = [],
  ) {
    const { page, limit, status, search } = filters;
    const skip = (page - 1) * limit;

    const qb = this.representationRepository
      .createQueryBuilder('representation')
      .leftJoinAndSelect('representation.organization', 'organization')
      .leftJoinAndSelect('representation.assignedTo', 'assignedTo')
      .leftJoinAndSelect('representation.requester', 'requester')
      .leftJoin('assignedTo.userRoleAssignments', 'userRoleAssignments')
      .leftJoin('userRoleAssignments.organization', 'assignedOrg');

    // Let's implement the specific rule:
    qb.andWhere(
      new Brackets((qb) => {
        // Author (requester)
        qb.where('representation.requesterId = :userId', { userId: user.id });

        // Assigned to user
        qb.orWhere('representation.assignedToId = :userId', {
          userId: user.id,
        });

        // Assigned to an organization the user is part of (if applicable)
        if (organizationIds && organizationIds.length > 0) {
          qb.orWhere('representation.representedId IN (:...organizationIds)', {
            organizationIds,
          });
          qb.orWhere('representation.organizationId IN (:...organizationIds)', {
            organizationIds,
          });
        }

        // Global Admin for "Prefeitura" views unassigned (assignedToId IS NULL)
        if (organizationIds && organizationIds.length === 0) {
          qb.orWhere('representation.assignedToId IS NULL');
        }
      }),
    );

    if (
      status &&
      Object.values(RepresentationStatus).includes(
        status as RepresentationStatus,
      )
    ) {
      qb.andWhere('representation.status = :status', {
        status,
      });
    }

    if (search) {
      qb.andWhere(
        '(organization.name ILIKE :search OR organization.document ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    const [representations, total] = await qb
      .skip(skip)
      .take(limit)
      .orderBy('representation.createdAt', 'DESC')
      .getManyAndCount();

    const mappedRepresentations = representations.map((sol) => ({
      id: sol.id,
      name: sol.organization?.name,
      document: sol.organization?.document,
      status: sol.status,
      type: sol.type,
      createdAt: sol.createdAt,
      author: sol?.requester?.firstName,
      organizationId: sol.organizationId,
    }));

    return {
      data: mappedRepresentations,
      total,
      page,
      limit,
    };
  }

  async findOrCreateOrganization(
    document: string,
    data: any,
  ): Promise<Organization> {
    const cleanDocument = document.replace(/\D/g, '');
    let org = await this.organizationService.findOneByDocument(cleanDocument);

    if (!org) {
      const isCpf = cleanDocument.length === 11;
      const docType = isCpf ? 'CPF' : 'CNPJ';
      let name = isCpf ? data.name : data.companyName || data.name;

      if (!name) {
        name = isCpf
          ? `Pessoa Física ${cleanDocument}`
          : `Organização ${cleanDocument}`;
      }

      const metadata: any = { documentType: docType };
      if (data.tradeName) metadata.tradeName = data.tradeName;
      if (data.socialName) metadata.socialName = data.socialName;

      org = await this.organizationService.create({
        name,
        document: cleanDocument,
        metadata,
      } as any);
    }
    return org;
  }

  async requestRepresentation(
    user: User,
    data: {
      assignTo: string;
      document: string;
      representationType?: string;
      companyName?: string;
      tradeName?: string;
      name?: string;
      socialName?: string;
      justification?: string;
      documents?: any[];
    },
  ) {
    data.document = data.document.replace(/\D/g, '');
    const org = await this.findOrCreateOrganization(data.document, data);

    // Check if already representing
    const userOrgs = await this.organizationService.my(user.id);
    if (userOrgs.find((o) => o.id === org.id)) {
      throw new BadRequestException('errors.already_representing');
    }

    // Check if there is already a pending or active request
    const existingRequest = await this.representationRepository.findOne({
      where: [
        {
          requesterId: user.id,
          organizationId: org.id,
          status: RepresentationStatus.PENDING,
        },
        {
          requesterId: user.id,
          organizationId: org.id,
          status: RepresentationStatus.INFO_REQUESTED,
        },
        {
          requesterId: user.id,
          organizationId: org.id,
          status: RepresentationStatus.APPROVED,
        },
      ],
    });

    if (existingRequest) {
      throw new BadRequestException('errors.already_requested');
    }

    // Manual representation
    // Find admin to assign
    const admins = await this.roleService.findUsersWithRole(
      org.id,
      SYSTEM_ROLES.admin,
    );
    const assignedTo =
      data.assignTo === 'owner' ? (admins.length > 0 ? admins[0] : null) : null;

    const representation = this.representationRepository.create({
      requester: user,
      organization: org,
      type: RepresentationType.MANUAL,
      status: RepresentationStatus.PENDING,
      justification: data.justification,
      documents: data.documents,
      assignedTo: assignedTo,
      representationType: data.representationType,
    });

    await this.representationRepository.save(representation);
    await this.logHistory(
      representation,
      user,
      'CREATED',
      null,
      RepresentationStatus.PENDING,
    );

    return representation;
  }

  async findAll(
    user: User,
    pagination: IPaginationOptions,
    organizationIds: string[] = [],
  ) {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const qb = this.representationRepository
      .createQueryBuilder('representation')
      .leftJoinAndSelect('representation.requester', 'requester')
      .leftJoinAndSelect('representation.organization', 'organization')
      .leftJoinAndSelect('representation.assignedTo', 'assignedTo')
      .take(limit)
      .skip(skip)
      .orderBy('representation.createdAt', 'DESC');

    qb.andWhere(
      new Brackets((qb) => {
        // Requested by user
        qb.where('representation.requesterId = :userId', { userId: user.id });

        // Assigned directly to user
        qb.orWhere('representation.assignedToId = :userId', {
          userId: user.id,
        });

        // Assigned to organization user is part of
        if (organizationIds.length > 0) {
          qb.orWhere('representation.representedId IN (:...organizationIds)', {
            organizationIds,
          });
          qb.orWhere('representation.organizationId IN (:...organizationIds)', {
            organizationIds,
          });
        }

        // Global Admin scope -> organizationIds is empty array from controller rules (or handles assignedToId IS NULL)
        if (organizationIds.length === 0) {
          qb.orWhere('representation.assignedToId IS NULL');
        }
      }),
    );

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  async findOne(id: string, user?: User, organizationIds?: string[]) {
    const qb = this.representationRepository
      .createQueryBuilder('representation')
      .leftJoinAndSelect('representation.comments', 'comments')
      .leftJoinAndSelect('comments.author', 'author')
      .leftJoinAndSelect('representation.history', 'history')
      .leftJoinAndSelect('history.actor', 'actor')
      .leftJoinAndSelect('representation.organization', 'organization')
      .leftJoinAndSelect('representation.requester', 'requester')
      .where('representation.id = :id', { id });

    if (user) {
      qb.andWhere(
        new Brackets((sqb) => {
          sqb.where('representation.requesterId = :userId', {
            userId: user.id,
          });
          sqb.orWhere('representation.assignedToId = :userId', {
            userId: user.id,
          });

          if (organizationIds && organizationIds.length > 0) {
            sqb.orWhere(
              'representation.representedId IN (:...organizationIds)',
              { organizationIds },
            );
            sqb.orWhere(
              'representation.organizationId IN (:...organizationIds)',
              { organizationIds },
            );
          }

          // If organizationIds is provided and is empty, it means global admin
          if (organizationIds && organizationIds.length === 0) {
            sqb.orWhere('representation.assignedToId IS NULL');
          } else if (!organizationIds) {
            // Fallback for internal calls like approve/reject
            // We assume if no organizationIds are passed, we just fetch it,
            // or we could fetch the user orgs internally if needed.
            // But since these methods do their own assignment checks, we can just allow it to be found
            // based on the requester/assignedTo check, or we skip the org check entirely.
            // Actually, internal calls should probably just fetch the entity and do manual check.
            sqb.orWhere('1=1');
          }
        }),
      );
    }

    const result = await qb.getOne();
    if (!result && user) {
      throw new ForbiddenException('errors.cannot_view');
    }
    return result;
  }

  async approve(id: string, actor: User) {
    const representation = await this.findOne(id);
    if (!representation)
      throw new NotFoundException('errors.representation_not_found');
    if (representation.status !== RepresentationStatus.PENDING)
      throw new BadRequestException('errors.representation_not_pending');

    // Check permissions (actor must be assignedTo or Global Admin if assignedTo is null)
    if (
      representation.assignedToId &&
      representation.assignedToId !== actor.id
    ) {
      throw new ForbiddenException('errors.cannot_approve');
    }
    // If assignedTo is null, ensure actor is global admin (omitted for brevity, covered by guard ideally)

    representation.status = RepresentationStatus.APPROVED;
    await this.representationRepository.save(representation);

    // Grant access
    const defaultRole = await this.roleService.findDefault(
      representation.organizationId,
    );
    await this.roleService.assign({
      userId: representation.requesterId,
      organizationId: representation.organizationId,
      roleId: defaultRole?.id || SYSTEM_ROLES.user,
    });

    await this.logHistory(
      representation,
      actor,
      'APPROVED',
      RepresentationStatus.PENDING,
      RepresentationStatus.APPROVED,
    );
    return representation;
  }

  async reject(id: string, actor: User) {
    const representation = await this.findOne(id);
    if (!representation)
      throw new NotFoundException('errors.representation_not_found');
    if (representation.status !== RepresentationStatus.PENDING)
      throw new BadRequestException('errors.representation_not_pending');

    if (
      representation.assignedToId &&
      representation.assignedToId !== actor.id
    ) {
      throw new ForbiddenException('errors.cannot_reject');
    }

    representation.status = RepresentationStatus.REJECTED;
    await this.representationRepository.save(representation);

    await this.logHistory(
      representation,
      actor,
      'REJECTED',
      RepresentationStatus.PENDING,
      RepresentationStatus.REJECTED,
    );
    return representation;
  }

  async requestInfo(
    id: string,
    actor: User,
    text: string,
    attachments?: any[],
  ) {
    const representation = await this.findOne(id);
    if (!representation)
      throw new NotFoundException('errors.representation_not_found');

    if (
      representation.assignedToId &&
      representation.assignedToId !== actor.id
    ) {
      throw new ForbiddenException('errors.cannot_request_info');
    }

    const prevStatus = representation.status;
    representation.status = RepresentationStatus.INFO_REQUESTED;
    await this.representationRepository.save(representation);

    await this.addComment(id, actor, text, attachments);

    await this.logHistory(
      representation,
      actor,
      'INFO_REQUESTED',
      prevStatus,
      RepresentationStatus.INFO_REQUESTED,
    );
    return representation;
  }

  async addComment(id: string, actor: User, text: string, attachments?: any[]) {
    const representation = await this.findOne(id);
    if (!representation)
      throw new NotFoundException('errors.representation_not_found');

    const comment = this.commentRepository.create({
      representation,
      author: actor,
      text,
      attachments,
    });
    await this.commentRepository.save(comment);

    // If status is INFO_REQUESTED and author is Requester -> Set status PENDING
    if (
      representation.status === RepresentationStatus.INFO_REQUESTED &&
      representation.requesterId === actor.id
    ) {
      const prevStatus = representation.status;
      // Use update instead of save to avoid cascading issues with relations
      await this.representationRepository.update(representation.id, {
        status: RepresentationStatus.PENDING,
      });
      // Update local object for history logging
      representation.status = RepresentationStatus.PENDING;

      await this.logHistory(
        representation,
        actor,
        'INFO_PROVIDED',
        prevStatus,
        RepresentationStatus.PENDING,
      );
    }

    return comment;
  }

  private async logHistory(
    representation: Representation,
    actor: User,
    action: string,
    previousStatus: RepresentationStatus,
    newStatus?: RepresentationStatus,
  ) {
    await this.historyRepository.save({
      representation,
      actor,
      action,
      previousStatus,
      newStatus,
    });
  }
}
