import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IPaginationOptions } from 'common/utils/types/pagination-options';
import { Brackets, Repository } from 'typeorm';
import { SYSTEM_ROLES } from '../common/constants/system-roles.const';
import { Organization } from '../organization/entities/organization.entity';
import { OrganizationService } from '../organization/organization.service';
import { RoleService } from '../role/role.service';
import { User } from '../user/entities/user.entity';
import { GetRepresentationOverviewDto } from './dto/get-representation-overview.dto';
import { SolicitationComment } from './entities/solicitation-comment.entity';
import { SolicitationHistory } from './entities/solicitation-history.entity';
import { Solicitation } from './entities/solicitation.entity';
import { SolicitationStatus } from './enums/solicitation-status.enum';
import { SolicitationType } from './enums/solicitation-type.enum';

@Injectable()
export class SolicitationService {
  constructor(
    @InjectRepository(Solicitation)
    private solicitationRepository: Repository<Solicitation>,
    @InjectRepository(SolicitationComment)
    private commentRepository: Repository<SolicitationComment>,
    @InjectRepository(SolicitationHistory)
    private historyRepository: Repository<SolicitationHistory>,
    private organizationService: OrganizationService,
    private roleService: RoleService,
  ) {}

  // Mocked CNPJs for direct access
  private readonly MOCK_DIRECT_ACCESS_CNPJS = [
    '00000000000191', // Banco do Brasil
    '33592510000154', // Vale
  ];

  // Mocked CNPJ lookup data
  private readonly MOCK_CNPJ_DATA: Record<string, any> = {
    /*     '00000000000191': { name: 'BANCO DO BRASIL SA', type: 'PJ' },
    '33592510000154': { name: 'VALE S.A.', type: 'PJ' },
    '12345678000199': { name: 'EMPRESA TESTE LTDA', type: 'PJ' }, */
  };

  // Mocked user links for "Available" list
  // In reality, this would come from an external service knowing the user's CPF
  private readonly MOCK_USER_LINKS = [];

  // eslint-disable-next-line @typescript-eslint/require-await
  async checkDirectAccess(_user: User, document: string): Promise<boolean> {
    // Mock logic: If document is in the list, return true.
    // In reality, this would check an external service using user's CPF and target CNPJ.
    return this.MOCK_DIRECT_ACCESS_CNPJS.includes(document.replace(/\D/g, ''));
  }

  async getAvailableRepresentations(user: User) {
    // Return mocked available representations that aren't yet claimed
    // We check if user is already part of the org
    const myOrgs = await this.organizationService.my(user.id);
    const myOrgDocuments = myOrgs.map((o) => o.document).filter(Boolean);

    return this.MOCK_USER_LINKS.map((link) => {
      const isRepresenting = myOrgDocuments.includes(link.document);
      return {
        ...link,
        status: isRepresenting ? 'REPRESENTING' : 'AVAILABLE',
      };
    });
  }

  async getOverview(
    user: User,
    filters: GetRepresentationOverviewDto,
    organizationIds: string[] = [],
  ) {
    const { page, limit, status, search } = filters;
    const skip = (page - 1) * limit;

    const qb = this.solicitationRepository
      .createQueryBuilder('solicitation')
      .leftJoinAndSelect('solicitation.organization', 'organization')
      .leftJoinAndSelect('solicitation.assignedTo', 'assignedTo')
      .leftJoinAndSelect('solicitation.requester', 'requester')
      .leftJoin('assignedTo.userRoleAssignments', 'userRoleAssignments')
      .leftJoin('userRoleAssignments.organization', 'assignedOrg');

    qb.andWhere(
      new Brackets((qb) => {
        qb.where('solicitation.requesterId = :userId', { userId: user.id });

        if (organizationIds && organizationIds.length > 0) {
          qb.orWhere('solicitation.organizationId IN (:...organizationIds)', {
            organizationIds,
          });
        } else {
          qb.orWhere('solicitation.assignedToId IS NULL', {
            organizationIds,
          });
        }
      }),
    );

    if (
      status &&
      Object.values(SolicitationStatus).includes(status as SolicitationStatus)
    ) {
      qb.andWhere('solicitation.status = :status', {
        status,
      });
    }

    if (search) {
      qb.andWhere(
        '(organization.name ILIKE :search OR organization.document ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    const [solicitations, total] = await qb
      .skip(skip)
      .take(limit)
      .orderBy('solicitation.createdAt', 'DESC')
      .getManyAndCount();

    const mappedSolicitations = solicitations.map((sol) => ({
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
      data: mappedSolicitations,
      total,
      page,
      limit,
    };
  }

  async findOrCreateOrganization(document: string, data: any): Promise<Organization> {
    const cleanDocument = document.replace(/\D/g, '');
    let org = await this.organizationService.findOneByDocument(cleanDocument);

    if (!org) {
      const isCpf = cleanDocument.length === 11;
      const docType = isCpf ? 'CPF' : 'CNPJ';
      let name = isCpf ? data.name : (data.companyName || data.name);
      
      if (!name) {
         name = isCpf ? `Pessoa Física ${cleanDocument}` : `Organização ${cleanDocument}`;
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

    const hasDirectAccess = await this.checkDirectAccess(user, data.document);

    if (hasDirectAccess) {
      // Auto-approve
      const solicitation = this.solicitationRepository.create({
        requester: user,
        organization: org,
        type: SolicitationType.DIRECT,
        status: SolicitationStatus.APPROVED,
        justification: 'history.auto_approved',
      });
      await this.solicitationRepository.save(solicitation);

      // Assign role (assuming MEMBER or ADMIN, sticking to MEMBER for safety or default)
      const defaultRole = await this.roleService.findDefault(org.id);
      await this.roleService.assign({
        userId: user.id,
        organizationId: org.id,
        roleId: defaultRole?.id || SYSTEM_ROLES.user,
      });

      await this.logHistory(
        solicitation,
        null,
        'AUTO_APPROVED',
        null,
        SolicitationStatus.APPROVED,
      );

      return solicitation;
    } else {
      // Manual solicitation
      // Find admin to assign
      const admins = await this.roleService.findUsersWithRole(
        org.id,
        SYSTEM_ROLES.admin,
      );
      const assignedTo =
        data.assignTo === 'owner'
          ? admins.length > 0
            ? admins[0]
            : null
          : null;

      const solicitation = this.solicitationRepository.create({
        requester: user,
        organization: org,
        type: SolicitationType.MANUAL,
        status: SolicitationStatus.PENDING,
        justification: data.justification,
        documents: data.documents,
        assignedTo: assignedTo,
        representationType: data.representationType,
      });

      await this.solicitationRepository.save(solicitation);
      await this.logHistory(
        solicitation,
        user,
        'CREATED',
        null,
        SolicitationStatus.PENDING,
      );

      return solicitation;
    }
  }

  async findAll(user: User, pagination: IPaginationOptions) {
    // Logic:
    // 1. Global Admin can see everything (or specifically unassigned ones).
    // 2. Org Admin can see solicitations assigned to them.
    // 3. User can see their own requests.

    // Simplification for MVP:
    // - If user has global permission (check via RoleService or assumptions), show unassigned.
    // - Show assignedTo = user.
    // - Show requester = user.

    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    // This query needs to be refined based on strict permissions,
    // but for now let's return what matters.

    // We can use a query builder to cover OR conditions
    const qb = this.solicitationRepository
      .createQueryBuilder('solicitation')
      .leftJoinAndSelect('solicitation.requester', 'requester')
      .leftJoinAndSelect('solicitation.organization', 'organization')
      .leftJoinAndSelect('solicitation.assignedTo', 'assignedTo')
      .take(limit)
      .skip(skip)
      .orderBy('solicitation.createdAt', 'DESC');

    // Filter logic would depend on the user's role context (which is usually determined by the active organization or global scope).
    // Assuming the controller passes context or we infer it.

    // If user is just listing their own requests:
    // qb.where('requester.id = :userId', { userId: user.id });

    // But this method is for the "Analysis" page too.

    // Let's assume we fetch all relevant to the user:
    // 1. Created by me
    // 2. Assigned to me
    // 3. Unassigned (if I am global admin - how to check? For now, fetch all unassigned if I am admin of admin org?)

    // Check if user is global admin (hacky check for MVP)
    const isGlobalAdmin = await this.roleService.hasSystemRole(
      user.id,
      SYSTEM_ROLES.admin,
    );

    qb.where('solicitation.requesterId = :userId', { userId: user.id }).orWhere(
      'solicitation.assignedToId = :userId',
      { userId: user.id },
    );

    if (isGlobalAdmin) {
      qb.orWhere('solicitation.assignedToId IS NULL');
    }

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  async findOne(id: string) {
    return this.solicitationRepository.findOne({
      where: { id },
      relations: ['comments', 'history', 'comments.author', 'history.actor'],
    });
  }

  async approve(id: string, actor: User) {
    const solicitation = await this.findOne(id);
    if (!solicitation)
      throw new NotFoundException('errors.solicitation_not_found');
    if (solicitation.status !== SolicitationStatus.PENDING)
      throw new BadRequestException('errors.solicitation_not_pending');

    // Check permissions (actor must be assignedTo or Global Admin if assignedTo is null)
    if (solicitation.assignedToId && solicitation.assignedToId !== actor.id) {
      throw new ForbiddenException('errors.cannot_approve');
    }
    // If assignedTo is null, ensure actor is global admin (omitted for brevity, covered by guard ideally)

    solicitation.status = SolicitationStatus.APPROVED;
    await this.solicitationRepository.save(solicitation);

    // Grant access
    const defaultRole = await this.roleService.findDefault(
      solicitation.organizationId,
    );
    await this.roleService.assign({
      userId: solicitation.requesterId,
      organizationId: solicitation.organizationId,
      roleId: defaultRole?.id || SYSTEM_ROLES.user,
    });

    await this.logHistory(
      solicitation,
      actor,
      'APPROVED',
      SolicitationStatus.PENDING,
      SolicitationStatus.APPROVED,
    );
    return solicitation;
  }

  async reject(id: string, actor: User) {
    const solicitation = await this.findOne(id);
    if (!solicitation)
      throw new NotFoundException('errors.solicitation_not_found');
    if (solicitation.status !== SolicitationStatus.PENDING)
      throw new BadRequestException('errors.solicitation_not_pending');

    if (solicitation.assignedToId && solicitation.assignedToId !== actor.id) {
      throw new ForbiddenException('errors.cannot_reject');
    }

    solicitation.status = SolicitationStatus.REJECTED;
    await this.solicitationRepository.save(solicitation);

    await this.logHistory(
      solicitation,
      actor,
      'REJECTED',
      SolicitationStatus.PENDING,
      SolicitationStatus.REJECTED,
    );
    return solicitation;
  }

  async requestInfo(
    id: string,
    actor: User,
    text: string,
    attachments?: any[],
  ) {
    const solicitation = await this.findOne(id);
    if (!solicitation)
      throw new NotFoundException('errors.solicitation_not_found');

    if (solicitation.assignedToId && solicitation.assignedToId !== actor.id) {
      throw new ForbiddenException('errors.cannot_request_info');
    }

    const prevStatus = solicitation.status;
    solicitation.status = SolicitationStatus.INFO_REQUESTED;
    await this.solicitationRepository.save(solicitation);

    await this.addComment(id, actor, text, attachments);

    await this.logHistory(
      solicitation,
      actor,
      'INFO_REQUESTED',
      prevStatus,
      SolicitationStatus.INFO_REQUESTED,
    );
    return solicitation;
  }

  async addComment(id: string, actor: User, text: string, attachments?: any[]) {
    const solicitation = await this.findOne(id);
    if (!solicitation)
      throw new NotFoundException('errors.solicitation_not_found');

    const comment = this.commentRepository.create({
      solicitation,
      author: actor,
      text,
      attachments,
    });
    await this.commentRepository.save(comment);

    // If status is INFO_REQUESTED and author is Requester -> Set status PENDING
    if (
      solicitation.status === SolicitationStatus.INFO_REQUESTED &&
      solicitation.requesterId === actor.id
    ) {
      const prevStatus = solicitation.status;
      // Use update instead of save to avoid cascading issues with relations
      await this.solicitationRepository.update(solicitation.id, {
        status: SolicitationStatus.PENDING,
      });
      // Update local object for history logging
      solicitation.status = SolicitationStatus.PENDING;

      await this.logHistory(
        solicitation,
        actor,
        'INFO_PROVIDED',
        prevStatus,
        SolicitationStatus.PENDING,
      );
    }

    return comment;
  }

  private async logHistory(
    solicitation: Solicitation,
    actor: User,
    action: string,
    previousStatus: SolicitationStatus,
    newStatus?: SolicitationStatus,
  ) {
    await this.historyRepository.save({
      solicitation,
      actor,
      action,
      previousStatus,
      newStatus,
    });
  }
}
