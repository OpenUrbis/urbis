import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MailService } from 'common/mail/mail.service';
import { IPaginationOptions } from 'common/utils/types/pagination-options';
import { isValidCpfValue } from 'common/utils/validators/is-cpf.validator';
import { Brackets, In, Repository } from 'typeorm';
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
import {
  normalizeRepresentationDocuments,
  REPRESENTATION_ROLE_LABELS,
  REPRESENTATION_RULES,
} from './representation-rules';

const ACTIVE_STATUSES = [
  RepresentationStatus.PENDING,
  RepresentationStatus.APPROVED,
  RepresentationStatus.INFO_REQUESTED,
];

@Injectable()
export class RepresentationService {
  constructor(
    @InjectRepository(Representation)
    private readonly representationRepository: Repository<Representation>,
    @InjectRepository(RepresentationComment)
    private readonly commentRepository: Repository<RepresentationComment>,
    @InjectRepository(RepresentationHistory)
    private readonly historyRepository: Repository<RepresentationHistory>,
    private readonly organizationService: OrganizationService,
    private readonly roleService: RoleService,
    private readonly mailService: MailService,
    private readonly openCnpjService: OpenCnpjService,
  ) {}

  private ruleFor(representationType: string) {
    const rule = REPRESENTATION_RULES[representationType];
    if (!rule)
      throw new BadRequestException('errors.invalid_representation_type');
    return rule;
  }

  private normalizeAndValidateDocuments(
    rule: ReturnType<RepresentationService['ruleFor']>,
    documents: unknown,
  ) {
    if (!Array.isArray(documents) || documents.length === 0) {
      throw new BadRequestException('errors.required_representation_documents');
    }

    // The old string[] shape remains readable for migrated records, but a new
    // request must identify every file by its required document category.
    if (documents.some((document) => typeof document === 'string')) {
      throw new BadRequestException('errors.required_representation_documents');
    }

    for (const document of documents) {
      if (
        !document ||
        typeof document !== 'object' ||
        typeof document.category !== 'string' ||
        !document.category.trim() ||
        !Array.isArray(document.files) ||
        document.files.some(
          (file: unknown) => typeof file !== 'string' || !file.trim(),
        )
      ) {
        throw new BadRequestException(
          'errors.required_representation_documents',
        );
      }
    }

    const normalized = normalizeRepresentationDocuments(documents);
    const expectedCategories = new Set(
      rule.documents.map((document) => document.category),
    );
    if (
      normalized.some((document) => !expectedCategories.has(document.category))
    ) {
      throw new BadRequestException('errors.invalid_representation_documents');
    }

    const providedCategories = new Set(
      normalized
        .filter((document) => document.files.length > 0)
        .map((document) => document.category),
    );
    const missing = rule.documents.filter(
      (document) => !providedCategories.has(document.category),
    );
    if (missing.length) {
      throw new BadRequestException('errors.required_representation_documents');
    }

    return normalized;
  }

  private normalizeCoRepresentatives(value: unknown): string[] {
    if (value === undefined || value === null) return [];
    if (!Array.isArray(value)) {
      throw new BadRequestException('errors.invalid_co_representatives');
    }

    const normalized: string[] = [];
    for (const representative of value) {
      if (typeof representative !== 'string') {
        throw new BadRequestException('errors.invalid_co_representatives');
      }

      const cpf = representative.replace(/\D/g, '');
      if (cpf.length !== 11 || !isValidCpfValue(cpf)) {
        throw new BadRequestException('errors.invalid_cpf');
      }
      if (!normalized.includes(cpf)) normalized.push(cpf);
    }

    return normalized;
  }

  private validateRepresentedData(
    rule: ReturnType<RepresentationService['ruleFor']>,
    data: any,
  ) {
    const value = rule.documentType === 'CPF' ? data.name : data.companyName;
    if (typeof value !== 'string' || !value.trim()) {
      throw new BadRequestException('errors.represented_name_required');
    }
  }

  private accountTypeLabel(accountType?: string) {
    return (
      {
        fisica_capaz: 'Pessoa física capaz',
        fisica_emancipada: 'Pessoa física capaz (emancipada)',
        fisica_assistido_parental:
          'Relativamente incapaz (assistido por autoridade parental)',
        fisica_assistido_tutor: 'Relativamente incapaz (assistido por tutor)',
      }[accountType || ''] ||
      accountType ||
      'Não informado'
    );
  }

  private async validateDocumentConflict(
    document: string,
    representationType: string,
  ) {
    const cleanDocument = document.replace(/\D/g, '');
    const organization =
      await this.organizationService.findOneByDocument(cleanDocument);
    if (!organization) return;

    const approved = await this.representationRepository.find({
      where: {
        organizationId: organization.id,
        status: RepresentationStatus.APPROVED,
      },
    });
    const active = approved.filter((item) => !item.deletedAt);
    if (!active.length) return;

    const requestedRule = this.ruleFor(representationType);
    const existing = active.find(
      (item) =>
        this.ruleFor(item.representationType || '').representedType !==
        requestedRule.representedType,
    );
    if (!existing) return;

    const existingType = this.ruleFor(
      existing.representationType || '',
    ).representedType;
    if (cleanDocument.length === 14) {
      throw new BadRequestException(
        `O CNPJ já se encontra cadastrado como ${existingType}. Caso este cadastro esteja incorreto ou a situação tenha se alterado, contatar o suporte.`,
      );
    }

    const specialTypes = [
      'Espólio',
      'Herança jacente ou vacante',
      'Incapaz (representado por autoridade parental)',
      'Incapaz (representado por tutor)',
      'Incapaz (representado por curador)',
    ];
    if (specialTypes.includes(existingType)) {
      throw new BadRequestException(
        `O CPF já se encontra cadastrado como ${existingType}. Caso este cadastro esteja incorreto ou a situação tenha se alterado, contatar o suporte.`,
      );
    }

    const allowedPfTypes = [
      'Pessoa física capaz',
      'Pessoa física capaz (emancipada)',
      'Relativamente incapaz (assistido por autoridade parental)',
      'Relativamente incapaz (assistido por tutor)',
      'Pessoa Física Capaz (emancipada ou não) ou Assistida (Relativamente Incapaz)',
      'Pessoa Física Assistida (Relativamente Incapaz)',
    ];
    if (!allowedPfTypes.includes(existingType)) {
      throw new BadRequestException(
        `O CPF já se encontra cadastrado como ${existingType}. Caso este cadastro esteja incorreto ou a situação tenha se alterado, contatar o suporte.`,
      );
    }
  }

  async checkOrganizationDocument(
    document: string,
    user: User,
    representationType?: string,
  ) {
    const cleanDocument = document.replace(/\D/g, '');
    if (cleanDocument.length !== 14) {
      throw new BadRequestException('errors.cnpj_required');
    }
    if (representationType) {
      const rule = this.ruleFor(representationType);
      if (rule.documentType !== 'CNPJ') {
        throw new BadRequestException('errors.invalid_document');
      }
      await this.validateDocumentConflict(cleanDocument, representationType);
    }

    let externalData: any = null;
    try {
      externalData = await this.openCnpjService.getCnpjData(cleanDocument);
    } catch (_error) {
      throw new BadRequestException('errors.invalid_cnpj');
    }

    const organization =
      await this.organizationService.findOneByDocument(cleanDocument);
    if (organization) {
      const existing = await this.representationRepository.findOne({
        where: {
          requesterId: user.id,
          organizationId: organization.id,
          status: In(ACTIVE_STATUSES),
        },
      });
      if (existing) throw new BadRequestException('errors.already_requested');
    }
    return {
      document: cleanDocument,
      name: externalData?.razao_social,
      metadata: { socialName: externalData?.nome_fantasia },
      source: 'OpenCNPJ',
    };
  }

  async getOverview(
    user: User,
    filters: GetRepresentationOverviewDto,
    organizationIds: string[] = [],
    isGlobal = false,
  ) {
    const { page, limit, status, search } = filters;
    const qb = this.representationRepository
      .createQueryBuilder('representation')
      .leftJoinAndSelect('representation.organization', 'organization')
      .leftJoinAndSelect('representation.requester', 'requester')
      .andWhere(
        new Brackets((subQb) => {
          subQb.where('representation.requesterId = :userId');
          if (organizationIds.length)
            subQb.orWhere(
              'representation.organizationId IN (:...organizationIds)',
            );
          if (isGlobal) subQb.orWhere('1 = 1');
        }),
      )
      .setParameter('userId', user.id);
    if (organizationIds.length)
      qb.setParameter('organizationIds', organizationIds);
    if (status) {
      if (!Object.values(RepresentationStatus).includes(status)) {
        throw new BadRequestException('Invalid representation status');
      }
      qb.andWhere('representation.status = :status', { status });
    }
    if (search?.trim()) {
      const textSearch = `%${search.trim()}%`;
      const normalizedDocument = search.replace(/\D/g, '');
      const textConditions = [
        'organization.name ILIKE :textSearch',
        'requester."firstName" ILIKE :textSearch',
        'requester."lastName" ILIKE :textSearch',
        `CONCAT(requester."firstName", ' ', requester."lastName") ILIKE :textSearch`,
      ];
      const parameters: Record<string, string> = { textSearch };

      if (normalizedDocument) {
        textConditions.push(
          "(organization.document IS NOT NULL AND regexp_replace(organization.document, '[^0-9]', '', 'g') ILIKE :documentSearch)",
          "(requester.cpf IS NOT NULL AND regexp_replace(requester.cpf, '[^0-9]', '', 'g') ILIKE :documentSearch)",
        );
        parameters.documentSearch = `%${normalizedDocument}%`;
      }

      qb.andWhere(`(${textConditions.join(' OR ')})`, parameters);
    }
    const [representations, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('representation.createdAt', 'DESC')
      .getManyAndCount();
    return {
      data: representations.map((item) => ({
        id: item.id,
        name: item.organization?.name,
        document: item.organization?.document,
        status: item.status,
        createdAt: item.createdAt,
        author: [item.requester?.firstName, item.requester?.lastName]
          .filter(Boolean)
          .join(' '),
        organizationId: item.organizationId,
        requesterId: item.requesterId,
        representativeRoleLabel: this.representationRoleLabel(
          item.representationType || '',
        ),
        // Migrated records may contain a legacy or empty representation type.
        // Do not make the whole overview fail because one old row cannot be
        // mapped to a current rule.
        representedType:
          REPRESENTATION_RULES[item.representationType || '']
            ?.representedType ||
          item.representationType ||
          'Não informado',
        requesterAccountTypeLabel: this.requesterAccountTypeLabel(
          item.requester?.accountType,
        ),
        validationProcedureLabel:
          item.validationProcedure === 'DECLARATORY'
            ? 'Declaratório'
            : 'Conferência',
      })),
      total,
      page,
      limit,
    };
  }

  private async findOrCreateOrganization(
    document: string,
    data: any,
  ): Promise<Organization> {
    const cleanDocument = document.replace(/\D/g, '');
    const isCpf = cleanDocument.length === 11;
    let organization =
      await this.organizationService.findOneByDocument(cleanDocument);
    const metadata = {
      ...(organization?.metadata || {}),
      documentType: isCpf ? 'CPF' : 'CNPJ',
      representedType: this.ruleFor(data.representationType).representedType,
      ...(data.socialName ? { socialName: data.socialName } : {}),
      ...(data.tradeName ? { tradeName: data.tradeName } : {}),
    };
    if (organization) {
      if (!isCpf && (data.companyName || data.tradeName)) {
        organization = await this.organizationService.update(
          organization.id,
          {
            name: data.companyName || organization.name,
            metadata,
          } as any,
          undefined,
        );
      }
      return organization;
    }
    organization = await this.organizationService.create({
      name: isCpf ? data.name : data.companyName,
      document: cleanDocument,
      metadata,
    } as any);
    return organization;
  }

  async requestRepresentation(user: User, data: any) {
    const document = String(data.document || '').replace(/\D/g, '');
    const rule = this.ruleFor(data.representationType);
    if (
      (rule.documentType === 'CPF' && document.length !== 11) ||
      (rule.documentType === 'CNPJ' && document.length !== 14)
    ) {
      throw new BadRequestException('errors.invalid_document');
    }
    this.validateRepresentedData(rule, data);
    if (document.length === 11 && !isValidCpfValue(document))
      throw new BadRequestException('errors.invalid_cpf');
    if (
      document.length === 11 &&
      user.cpf &&
      document === String(user.cpf).replace(/\D/g, '')
    ) {
      throw new BadRequestException(
        'Não é permitido solicitar representação para o próprio CPF.',
      );
    }
    await this.validateDocumentConflict(document, data.representationType);

    const documents = this.normalizeAndValidateDocuments(rule, data.documents);
    const coRepresentatives = this.normalizeCoRepresentatives(
      data.otherRepresentatives,
    );

    const organization = await this.findOrCreateOrganization(document, data);
    const existing = await this.representationRepository.findOne({
      where: {
        requesterId: user.id,
        organizationId: organization.id,
        status: In(ACTIVE_STATUSES),
      },
    });
    if (existing) throw new BadRequestException('errors.already_requested');

    const representation = this.representationRepository.create({
      requester: user,
      organization,
      type: RepresentationType.MANUAL,
      status: RepresentationStatus.PENDING,
      representationType: data.representationType,
      validationProcedure: rule.procedure,
      documents,
      coRepresentatives,
      // This records the legal/documentary rule only. Co-representatives do
      // not receive an invitation and never participate in an Urbis approval
      // step; the Prefeitura remains the sole reviewer.
      requiresJointAgreement: [
        'parental_authority_incapable',
        'parental_authority_relatively_incapable',
      ].includes(data.representationType),
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
    isGlobal = false,
  ) {
    return this.getOverview(
      user,
      { page: pagination.page, limit: pagination.limit },
      organizationIds,
      isGlobal,
    );
  }

  async findOne(
    id: string,
    user: User,
    organizationIds: string[] = [],
    isGlobal = false,
  ) {
    const representation = await this.representationRepository.findOne({
      where: { id },
      relations: [
        'comments',
        'comments.author',
        'history',
        'history.actor',
        'organization',
        'requester',
      ],
    });
    if (!representation)
      throw new NotFoundException('errors.representation_not_found');
    if (
      !isGlobal &&
      representation.requesterId !== user.id &&
      !organizationIds.includes(representation.organizationId)
    ) {
      throw new ForbiddenException('errors.cannot_view');
    }
    const rule = this.ruleFor(representation.representationType || '');
    Object.assign(representation, {
      representativeRoleLabel: this.representationRoleLabel(
        representation.representationType || '',
      ),
      representedType: rule.representedType,
      requesterAccountTypeLabel: this.requesterAccountTypeLabel(
        representation.requester?.accountType,
      ),
      validationProcedureLabel:
        representation.validationProcedure === 'DECLARATORY'
          ? 'Declaratório'
          : 'Conferência',
      documentCategoryLabels: Object.fromEntries(
        rule.documents.map((document) => [document.category, document.label]),
      ),
    });
    return representation;
  }

  async updateStatus(
    id: string,
    actor: User,
    status: RepresentationStatus,
    text: string,
    attachments: string[] = [],
    organizationIds: string[] = [],
    isGlobal = false,
  ) {
    if (!Object.values(RepresentationStatus).includes(status)) {
      throw new BadRequestException('errors.invalid_representation_status');
    }
    if (!text?.trim()) {
      throw new BadRequestException(
        'errors.representation_action_reason_required',
      );
    }

    const representation = await this.findOne(
      id,
      actor,
      organizationIds,
      isGlobal,
    );
    const requesterCannotManageOwnRepresentation =
      String(representation.requesterId) === String(actor.id) &&
      [
        RepresentationStatus.APPROVED,
        RepresentationStatus.REJECTED,
        RepresentationStatus.INFO_REQUESTED,
        RepresentationStatus.INACTIVE,
      ].includes(status);

    if (requesterCannotManageOwnRepresentation) {
      throw new ForbiddenException(
        'O solicitante não pode administrar a própria representação.',
      );
    }

    if (status === RepresentationStatus.INACTIVE) {
      return this.inactivate(
        id,
        actor,
        text,
        attachments,
        organizationIds,
        isGlobal,
      );
    }

    const previousStatus = representation.status;
    const statusChanged = previousStatus !== status;
    representation.status = status;
    await this.representationRepository.save(representation);
    await this.createComment(representation, actor, text, attachments);
    await this.logHistory(
      representation,
      actor,
      `STATUS_${status}`,
      previousStatus,
      status,
      { reason: text, attachments },
    );

    // Repeating the same approval must not duplicate access grants or
    // notifications, while changing back to APPROVED must grant access again.
    if (status === RepresentationStatus.APPROVED && statusChanged) {
      await this.grantAccess(representation);
    }
    if (
      statusChanged &&
      [RepresentationStatus.APPROVED, RepresentationStatus.REJECTED].includes(
        status,
      )
    ) {
      await this.sendAnalysisEmail(
        representation,
        status === RepresentationStatus.APPROVED ? 'Aprovação' : 'Rejeição',
      );
    }
    if (status === RepresentationStatus.INFO_REQUESTED) {
      await this.sendAnalysisEmail(representation, 'Comentário');
    }
    return representation;
  }

  async approve(
    id: string,
    actor: User,
    organizationIds: string[] = [],
    isGlobal = false,
  ) {
    return this.updateStatus(
      id,
      actor,
      RepresentationStatus.APPROVED,
      'Representação aprovada.',
      [],
      organizationIds,
      isGlobal,
    );
  }

  async reject(
    id: string,
    actor: User,
    organizationIds: string[] = [],
    isGlobal = false,
  ) {
    return this.updateStatus(
      id,
      actor,
      RepresentationStatus.REJECTED,
      'Representação reprovada.',
      [],
      organizationIds,
      isGlobal,
    );
  }

  async requestInfo(
    id: string,
    actor: User,
    text: string,
    attachments: string[] = [],
    organizationIds: string[] = [],
    isGlobal = false,
  ) {
    return this.updateStatus(
      id,
      actor,
      RepresentationStatus.INFO_REQUESTED,
      text,
      attachments,
      organizationIds,
      isGlobal,
    );
  }

  async addComment(
    id: string,
    actor: User,
    text: string,
    attachments: string[] = [],
    organizationIds: string[] = [],
    isGlobal = false,
  ) {
    if (!text?.trim()) {
      throw new BadRequestException(
        'errors.representation_action_reason_required',
      );
    }

    const representation = await this.findOne(
      id,
      actor,
      organizationIds,
      isGlobal,
    );
    const previousStatus = representation.status;
    const comment = await this.createComment(
      representation,
      actor,
      text,
      attachments,
    );

    // A requester answering a request for information returns the request to
    // the Prefeitura's pending queue. Co-representatives are never involved.
    if (
      previousStatus === RepresentationStatus.INFO_REQUESTED &&
      representation.requesterId === actor.id
    ) {
      representation.status = RepresentationStatus.PENDING;
      await this.representationRepository.save(representation);
      await this.logHistory(
        representation,
        actor,
        'INFO_PROVIDED',
        previousStatus,
        RepresentationStatus.PENDING,
        { attachments },
      );
    }

    await this.logHistory(
      representation,
      actor,
      'COMMENTED',
      previousStatus,
      representation.status,
      { attachments },
    );
    await this.sendAnalysisEmail(representation, 'Comentário');
    return comment;
  }

  private async createComment(
    representation: Representation,
    actor: User,
    text: string,
    attachments: string[],
  ) {
    return this.commentRepository.save(
      this.commentRepository.create({
        representation,
        author: actor,
        text,
        attachments,
      }),
    );
  }

  private async grantAccess(representation: Representation) {
    await this.roleService.assign({
      userId: representation.requesterId,
      organizationId: representation.organizationId,
      roleId: SYSTEM_ROLES.organizationAdmin,
    });
  }

  async inactivate(
    id: string,
    actor: User | null,
    text: string,
    attachments: string[] = [],
    organizationIds: string[] = [],
    isGlobal = false,
  ) {
    const representation = actor
      ? await this.findOne(id, actor, organizationIds, isGlobal)
      : await this.representationRepository.findOneByOrFail({ id });
    if (representation.status === RepresentationStatus.INACTIVE)
      return representation;
    const previousStatus = representation.status;
    representation.status = RepresentationStatus.INACTIVE;
    await this.representationRepository.save(representation);
    if (actor)
      await this.createComment(representation, actor, text, attachments);
    await this.logHistory(
      representation,
      actor,
      'INACTIVATED',
      previousStatus,
      RepresentationStatus.INACTIVE,
      { reason: text, attachments },
    );
    return representation;
  }

  async inactivateForUserDeletion(user: User) {
    const representations = await this.representationRepository.find({
      where: { requesterId: user.id, status: In(ACTIVE_STATUSES) },
    });
    for (const representation of representations) {
      await this.inactivate(
        representation.id,
        user,
        'Representação inativada pela exclusão da conta do usuário.',
      );
    }
  }

  private async sendAnalysisEmail(
    representation: Representation,
    event: 'Comentário' | 'Aprovação' | 'Rejeição',
  ) {
    const email = representation.requester?.email;
    if (!email) return;
    const name = representation.requester?.firstName || 'usuário';
    const url = `https://conta.urbis.prefeitura.sp.gov.br/representations/detail/${representation.id}`;
    await this.mailService.representationAnalysis(email, name, event, url);
  }

  private async logHistory(
    representation: Representation,
    actor: User | null,
    action: string,
    previousStatus: RepresentationStatus | null,
    newStatus?: RepresentationStatus,
    metadata?: any,
  ) {
    await this.historyRepository.save({
      representation,
      actor: actor || undefined,
      action,
      previousStatus: previousStatus || undefined,
      newStatus,
      metadata,
    });
  }

  representationRoleLabel(representationType: string) {
    return REPRESENTATION_ROLE_LABELS[representationType] || representationType;
  }

  requesterAccountTypeLabel(accountType?: string) {
    return this.accountTypeLabel(accountType);
  }
}
