import { RepresentationService } from './representation.service';

import { RepresentationStatus } from './enums/representation-status.enum';
import { RepresentationType } from './enums/representation-type.enum';
import { REPRESENTATION_RULES } from './representation-rules';
import { SYSTEM_ROLES } from '../common/constants/system-roles.const';

describe('RepresentationService', () => {
  let service: RepresentationService;
  let representationRepository: any;
  let commentRepository: any;
  let historyRepository: any;
  let organizationService: any;
  let roleService: any;
  let mailService: any;
  let openCnpjService: any;

  const requester = {
    id: 'requester-1',
    firstName: 'Ana',
    email: 'ana@example.test',
    cpf: '40345362845',
    accountType: 'fisica_capaz',
  } as any;

  const cpf = '52998224725';
  const cnpj = '46395000000139';

  const requestFor = (representationType: string) => {
    const rule = REPRESENTATION_RULES[representationType];
    return {
      representationType,
      document: rule.documentType === 'CPF' ? cpf : cnpj,
      name: 'Pessoa representada',
      companyName: 'Organização representada',
      documents: rule.documents.map((document) => ({
        category: document.category,
        files: [`${document.category}.pdf`, `${document.category}-anexo.pdf`],
      })),
    };
  };

  beforeEach(() => {
    representationRepository = {
      create: jest.fn((input) => ({
        ...input,
        id: 'representation-1',
        requesterId: input.requester?.id,
        organizationId: input.organization?.id,
      })),
      save: jest.fn((value) => Promise.resolve(value)),
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
      findOneByOrFail: jest.fn(),
      createQueryBuilder: jest.fn(),
    };
    commentRepository = {
      create: jest.fn((input) => input),
      save: jest.fn((value) => Promise.resolve({ id: 'comment-1', ...value })),
    };
    historyRepository = {
      save: jest.fn((value) => Promise.resolve({ id: 'history-1', ...value })),
    };
    organizationService = {
      findOneByDocument: jest.fn().mockResolvedValue(null),
      create: jest.fn((input) =>
        Promise.resolve({ id: 'organization-1', ...input }),
      ),
      update: jest.fn(),
    };
    roleService = {
      findDefault: jest.fn().mockResolvedValue({ id: 'default-role' }),
      assign: jest.fn(),
    };
    mailService = { representationAnalysis: jest.fn() };
    openCnpjService = { getCnpjData: jest.fn() };

    service = new RepresentationService(
      representationRepository,
      commentRepository,
      historyRepository,
      organizationService,
      roleService,
      mailService,
      openCnpjService,
    );
  });

  describe('requestRepresentation', () => {
    it.each(Object.keys(REPRESENTATION_RULES))(
      'creates a pending conference request for %s with every required document category',
      async (representationType) => {
        const rule = REPRESENTATION_RULES[representationType];
        const data: any = requestFor(representationType);
        if (representationType === 'parental_authority_incapable') {
          data.otherRepresentatives = ['403.453.628-45'];
        }

        const result = await service.requestRepresentation(requester, data);

        expect(result).toEqual(
          expect.objectContaining({
            status: RepresentationStatus.PENDING,
            type: RepresentationType.MANUAL,
            representationType,
            validationProcedure: 'CONFERENCE',
            requiresJointAgreement: [
              'parental_authority_incapable',
              'parental_authority_relatively_incapable',
            ].includes(representationType),
          }),
        );
        expect(organizationService.create).toHaveBeenCalledWith(
          expect.objectContaining({
            document: rule.documentType === 'CPF' ? cpf : cnpj,
            metadata: expect.objectContaining({
              documentType: rule.documentType,
              representedType: rule.representedType,
            }),
          }),
        );
        expect(result.documents).toEqual(
          rule.documents.map((document) => ({
            category: document.category,
            files: [
              `${document.category}.pdf`,
              `${document.category}-anexo.pdf`,
            ],
          })),
        );
        expect(result.coRepresentatives).toEqual(
          representationType === 'parental_authority_incapable'
            ? ['40345362845']
            : [],
        );
        expect(organizationService.create).toHaveBeenCalledTimes(1);
        expect(representationRepository.save).toHaveBeenCalledWith(result);
        expect(historyRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            action: 'CREATED',
            previousStatus: undefined,
            newStatus: RepresentationStatus.PENDING,
          }),
        );
      },
    );

    it('rejects an unknown representation type', async () => {
      await expect(
        service.requestRepresentation(requester, {
          representationType: 'unknown',
          document: cpf,
        }),
      ).rejects.toThrow('errors.invalid_representation_type');
    });

    it('rejects documents with a type incompatible with the selected representation', async () => {
      await expect(
        service.requestRepresentation(requester, {
          ...requestFor('attorney'),
          document: cnpj,
        }),
      ).rejects.toThrow('errors.invalid_document');
      await expect(
        service.requestRepresentation(requester, {
          ...requestFor('representative'),
          document: cpf,
        }),
      ).rejects.toThrow('errors.invalid_document');
    });

    it('rejects an invalid CPF before creating an organization', async () => {
      await expect(
        service.requestRepresentation(requester, {
          ...requestFor('attorney'),
          document: '11111111111',
        }),
      ).rejects.toThrow('errors.invalid_cpf');

      expect(organizationService.create).not.toHaveBeenCalled();
    });

    it('rejects requesting representation for the requester own CPF before side effects', async () => {
      await expect(
        service.requestRepresentation(requester, {
          ...requestFor('attorney'),
          document: '403.453.628-45',
        }),
      ).rejects.toThrow(
        'Não é permitido solicitar representação para o próprio CPF.',
      );

      expect(organizationService.findOneByDocument).not.toHaveBeenCalled();
      expect(organizationService.create).not.toHaveBeenCalled();
      expect(representationRepository.create).not.toHaveBeenCalled();
      expect(representationRepository.save).not.toHaveBeenCalled();
    });

    it('allows requesting representation for another valid CPF', async () => {
      await expect(
        service.requestRepresentation(requester, requestFor('attorney')),
      ).resolves.toBeDefined();
    });

    it.each([
      ['CPF', 'attorney', { name: '   ' }],
      ['CNPJ', 'representative', { companyName: '' }],
    ])(
      'requires the manually supplied represented %s name',
      async (_documentType, representationType, fields) => {
        await expect(
          service.requestRepresentation(requester, {
            ...requestFor(representationType),
            ...fields,
          }),
        ).rejects.toThrow('errors.represented_name_required');
        expect(organizationService.create).not.toHaveBeenCalled();
      },
    );

    it('requires each mandatory document category to have at least one file', async () => {
      await expect(
        service.requestRepresentation(requester, {
          ...requestFor('representative'),
          documents: [{ category: 'constitutive_documents', files: [] }],
        }),
      ).rejects.toThrow('errors.required_representation_documents');
    });

    it.each(Object.keys(REPRESENTATION_RULES))(
      'rejects %s when any required document category is missing',
      async (representationType) => {
        const rule = REPRESENTATION_RULES[representationType];

        for (const missingCategory of rule.documents.map(
          (document) => document.category,
        )) {
          const documents = requestFor(representationType).documents.filter(
            (document: any) => document.category !== missingCategory,
          );

          await expect(
            service.requestRepresentation(requester, {
              ...requestFor(representationType),
              documents,
            }),
          ).rejects.toThrow('errors.required_representation_documents');
        }
      },
    );

    it.each([
      ['empty file', ['']],
      ['whitespace-only file', ['   ']],
      ['non-string file', [123]],
    ])(
      'rejects a required category containing an invalid %s',
      async (_label, files) => {
        await expect(
          service.requestRepresentation(requester, {
            ...requestFor('attorney'),
            documents: [{ category: 'power_of_attorney', files }],
          }),
        ).rejects.toThrow('errors.required_representation_documents');
        expect(organizationService.create).not.toHaveBeenCalled();
      },
    );

    it('rejects malformed, mixed and legacy document payloads for new requests', async () => {
      const malformedPayloads = [
        [{ category: 'power_of_attorney' }],
        [{ category: '', files: ['mandate.pdf'] }],
        ['legacy.pdf'],
        [
          { category: 'power_of_attorney', files: ['mandate.pdf'] },
          'legacy.pdf',
        ],
      ];

      for (const documents of malformedPayloads) {
        await expect(
          service.requestRepresentation(requester, {
            ...requestFor('attorney'),
            documents,
          }),
        ).rejects.toThrow('errors.required_representation_documents');
      }
    });

    it('rejects an unknown document category even when all required categories exist', async () => {
      await expect(
        service.requestRepresentation(requester, {
          ...requestFor('attorney'),
          documents: [
            ...requestFor('attorney').documents,
            { category: 'unknown_category', files: ['unknown.pdf'] },
          ],
        }),
      ).rejects.toThrow('errors.invalid_representation_documents');
      expect(organizationService.create).not.toHaveBeenCalled();
    });

    it('merges repeated categories and preserves multiple files for cataloguing', async () => {
      const result = await service.requestRepresentation(requester, {
        ...requestFor('representative'),
        documents: [
          { category: 'constitutive_documents', files: ['contract-1.pdf'] },
          {
            category: 'constitutive_documents',
            files: ['contract-2.pdf', 'contract-3.pdf'],
          },
          {
            category: 'representation_documents',
            files: ['election-minutes.pdf', 'term.pdf'],
          },
        ],
      });

      expect(result.documents).toEqual([
        {
          category: 'constitutive_documents',
          files: ['contract-1.pdf', 'contract-2.pdf', 'contract-3.pdf'],
        },
        {
          category: 'representation_documents',
          files: ['election-minutes.pdf', 'term.pdf'],
        },
      ]);
    });

    it.each(Object.keys(REPRESENTATION_RULES))(
      'stores co-representatives as normalized informational data for %s without an acceptance workflow',
      async (representationType) => {
        const result = await service.requestRepresentation(requester, {
          ...requestFor(representationType),
          otherRepresentatives: [
            '403.453.628-45',
            '111.444.777-35',
            '40345362845',
          ],
        });

        expect(result.coRepresentatives).toEqual([
          '40345362845',
          '11144477735',
        ]);
        expect(result.requiresJointAgreement).toBe(
          [
            'parental_authority_incapable',
            'parental_authority_relatively_incapable',
          ].includes(representationType),
        );
        expect(roleService.assign).not.toHaveBeenCalled();
        expect(mailService.representationAnalysis).not.toHaveBeenCalled();
      },
    );

    it.each([
      ['invalid checksum', ['403.453.628-46']],
      ['empty value', ['']],
      ['wrong length', ['123.456.789-0']],
      ['non-string value', [123]],
    ])(
      'rejects a co-representative with %s',
      async (_label, representatives) => {
        await expect(
          service.requestRepresentation(requester, {
            ...requestFor('attorney'),
            otherRepresentatives: representatives,
          }),
        ).rejects.toThrow(
          _label === 'non-string value'
            ? 'errors.invalid_co_representatives'
            : 'errors.invalid_cpf',
        );
        expect(organizationService.create).not.toHaveBeenCalled();
      },
    );

    it('does not consult OpenCNPJ or internal CPF data to fill a manually entered person name', async () => {
      const result = await service.requestRepresentation(requester, {
        ...requestFor('attorney'),
        document: '529.982.247-25',
        name: 'Nome completo informado pelo solicitante',
        socialName: 'Nome social informado pelo solicitante',
      });

      expect(result.organization.name).toBe(
        'Nome completo informado pelo solicitante',
      );
      expect(openCnpjService.getCnpjData).not.toHaveBeenCalled();
      expect(organizationService.findOneByDocument).toHaveBeenCalledWith(cpf);
      expect(organizationService.update).not.toHaveBeenCalled();
    });

    it('keeps corrected CNPJ fields supplied by the requester after the external suggestion', async () => {
      const result = await service.requestRepresentation(requester, {
        ...requestFor('representative'),
        companyName: 'Razão Social corrigida pelo solicitante',
        tradeName: 'Nome fantasia corrigido',
      });

      expect(result.organization.name).toBe(
        'Razão Social corrigida pelo solicitante',
      );
      expect(result.organization.metadata).toEqual(
        expect.objectContaining({ tradeName: 'Nome fantasia corrigido' }),
      );
      // The form's explicit CNPJ lookup is the source of the suggestion; the
      // submit payload is allowed to carry corrections made by the requester.
      expect(openCnpjService.getCnpjData).not.toHaveBeenCalled();
    });
  });

  describe('document conflict validation', () => {
    const approvedRepresentation = (
      representationType: string,
      deletedAt?: Date,
    ) => ({
      representationType,
      status: RepresentationStatus.APPROVED,
      deletedAt,
    });

    it.each([
      [
        'executor',
        'Espólio',
        'Caso este cadastro esteja incorreto ou a situação tenha se alterado, contatar o suporte.',
      ],
      [
        'curator_of_vacant_heritage',
        'Herança jacente ou vacante',
        'Caso este cadastro esteja incorreto ou a situação tenha se alterado, contatar o suporte.',
      ],
      [
        'parental_authority_incapable',
        'Incapaz (representado por autoridade parental)',
        'situação tenha se alterado',
      ],
      [
        'tutor_incapable',
        'Incapaz (representado por tutor)',
        'situação tenha se alterado',
      ],
      [
        'curator_incapable',
        'Incapaz (representado por curador)',
        'situação tenha se alterado',
      ],
    ])(
      'blocks a CPF already represented as %s',
      async (existingType, label, expectedMessage) => {
        organizationService.findOneByDocument.mockResolvedValue({
          id: 'organization-1',
        });
        representationRepository.find.mockResolvedValue([
          approvedRepresentation(existingType),
        ]);

        await expect(
          service.requestRepresentation(requester, requestFor('attorney')),
        ).rejects.toThrow(label);
        await expect(
          service.requestRepresentation(requester, requestFor('attorney')),
        ).rejects.toThrow(expectedMessage);
      },
    );

    it('blocks a CNPJ with an approved active incompatible represented type', async () => {
      organizationService.findOneByDocument.mockResolvedValue({
        id: 'organization-1',
      });
      representationRepository.find.mockResolvedValue([
        approvedRepresentation('bankruptcy_trustee'),
      ]);

      await expect(
        service.requestRepresentation(requester, requestFor('representative')),
      ).rejects.toThrow('O CNPJ já se encontra cadastrado como Massa falida.');
    });

    it.each(
      Object.keys(REPRESENTATION_RULES).filter(
        (representationType) =>
          REPRESENTATION_RULES[representationType].documentType === 'CNPJ',
      ),
    )(
      'allows another %s request when the approved CNPJ has the same represented type',
      async (representationType) => {
        const organization = {
          id: 'organization-1',
          name: 'Organização representada',
          metadata: {},
        };
        organizationService.findOneByDocument.mockResolvedValue(organization);
        organizationService.update.mockResolvedValue(organization);
        representationRepository.find.mockResolvedValue([
          approvedRepresentation(representationType),
        ]);
        representationRepository.findOne.mockResolvedValue(null);

        await expect(
          service.requestRepresentation(
            requester,
            requestFor(representationType),
          ),
        ).resolves.toBeDefined();
      },
    );

    it.each(
      Object.keys(REPRESENTATION_RULES).filter(
        (representationType) =>
          REPRESENTATION_RULES[representationType].documentType === 'CNPJ',
      ),
    )(
      'blocks a CNPJ request for %s when another approved represented type already exists',
      async (existingType) => {
        organizationService.findOneByDocument.mockResolvedValue({
          id: 'organization-1',
        });
        representationRepository.find.mockResolvedValue([
          approvedRepresentation(existingType),
        ]);

        const requestedType =
          existingType === 'representative'
            ? 'bankruptcy_trustee'
            : 'representative';
        if (requestedType === existingType) return;

        await expect(
          service.requestRepresentation(requester, requestFor(requestedType)),
        ).rejects.toThrow(
          `O CNPJ já se encontra cadastrado como ${REPRESENTATION_RULES[existingType].representedType}.`,
        );
      },
    );

    it.each(['attorney', 'parental_authority_relatively_incapable'])(
      'allows a CPF already represented as a compatible person type (%s)',
      async (existingType) => {
        organizationService.findOneByDocument.mockResolvedValue({
          id: 'organization-1',
        });
        representationRepository.find.mockResolvedValue([
          approvedRepresentation(existingType),
        ]);
        representationRepository.findOne.mockResolvedValue(null);

        await expect(
          service.requestRepresentation(requester, requestFor('attorney')),
        ).resolves.toBeDefined();
      },
    );

    it('does not block a matching or inactive prior CNPJ representation', async () => {
      const organization = {
        id: 'organization-1',
        name: 'Organização representada',
        metadata: {},
      };
      organizationService.findOneByDocument.mockResolvedValue(organization);
      organizationService.update.mockResolvedValue(organization);
      representationRepository.find.mockResolvedValue([
        approvedRepresentation('representative'),
        approvedRepresentation('bankruptcy_trustee', new Date()),
      ]);
      representationRepository.findOne.mockResolvedValue(null);

      await expect(
        service.requestRepresentation(requester, requestFor('representative')),
      ).resolves.toBeDefined();
    });

    it.each([
      RepresentationStatus.PENDING,
      RepresentationStatus.APPROVED,
      RepresentationStatus.INFO_REQUESTED,
    ])(
      'blocks a duplicate request while the previous request is %s',
      async (status) => {
        const organization = {
          id: 'organization-1',
          name: 'Pessoa',
          metadata: {},
        };
        organizationService.findOneByDocument.mockResolvedValue(organization);
        representationRepository.find.mockResolvedValue([]);
        representationRepository.findOne.mockResolvedValue({
          id: 'previous-representation',
          status,
        });

        await expect(
          service.requestRepresentation(requester, requestFor('attorney')),
        ).rejects.toThrow('errors.already_requested');
        expect(organizationService.create).not.toHaveBeenCalled();
      },
    );

    it.each([RepresentationStatus.REJECTED, RepresentationStatus.INACTIVE])(
      'allows a new request after a previous request is %s',
      async (_status) => {
        const organization = {
          id: 'organization-1',
          name: 'Pessoa',
          metadata: {},
        };
        organizationService.findOneByDocument.mockResolvedValue(organization);
        representationRepository.find.mockResolvedValue([]);
        representationRepository.findOne.mockResolvedValue(null);

        await expect(
          service.requestRepresentation(requester, requestFor('attorney')),
        ).resolves.toBeDefined();
      },
    );
  });

  describe('checkOrganizationDocument', () => {
    it('returns data from OpenCNPJ and identifies its source', async () => {
      openCnpjService.getCnpjData.mockResolvedValue({
        razao_social: 'MUNICIPIO DE SAO PAULO',
        nome_fantasia: 'Prefeitura',
      });

      await expect(
        service.checkOrganizationDocument(
          '46.395.000/0001-39',
          requester,
          'representative',
        ),
      ).resolves.toEqual({
        document: cnpj,
        name: 'MUNICIPIO DE SAO PAULO',
        metadata: { socialName: 'Prefeitura' },
        source: 'OpenCNPJ',
      });
      expect(openCnpjService.getCnpjData).toHaveBeenCalledWith(cnpj);
    });

    it('rejects invalid CNPJ input and an unavailable OpenCNPJ result', async () => {
      await expect(
        service.checkOrganizationDocument(cpf, requester),
      ).rejects.toThrow('errors.cnpj_required');
      openCnpjService.getCnpjData.mockRejectedValue(new Error('unavailable'));
      await expect(
        service.checkOrganizationDocument(cnpj, requester),
      ).rejects.toThrow('errors.invalid_cnpj');
    });

    it('prevents a duplicate active request from the same requester', async () => {
      openCnpjService.getCnpjData.mockResolvedValue({
        razao_social: 'Organização representada',
      });
      organizationService.findOneByDocument.mockResolvedValue({
        id: 'organization-1',
      });
      representationRepository.findOne.mockResolvedValue({
        id: 'representation-1',
      });

      await expect(
        service.checkOrganizationDocument(cnpj, requester),
      ).rejects.toThrow('errors.already_requested');
    });

    it('does not allow CPF or unknown representation types in the CNPJ lookup endpoint', async () => {
      await expect(
        service.checkOrganizationDocument(cnpj, requester, 'attorney'),
      ).rejects.toThrow('errors.invalid_document');
      await expect(
        service.checkOrganizationDocument(cnpj, requester, 'unknown'),
      ).rejects.toThrow('errors.invalid_representation_type');
      expect(openCnpjService.getCnpjData).not.toHaveBeenCalled();
    });

    it('uses normalized CNPJ data from OpenCNPJ while leaving correction to the request form', async () => {
      openCnpjService.getCnpjData.mockResolvedValue({
        razao_social: 'MUNICIPIO DE SAO PAULO',
        nome_fantasia: 'Prefeitura',
      });

      const result = await service.checkOrganizationDocument(
        '46.395.000/0001-39',
        requester,
        'syndic_or_administrator',
      );

      expect(result).toEqual({
        document: cnpj,
        name: 'MUNICIPIO DE SAO PAULO',
        metadata: { socialName: 'Prefeitura' },
        source: 'OpenCNPJ',
      });
      expect(organizationService.create).not.toHaveBeenCalled();
    });
  });

  describe('reading representations by participant and administrator', () => {
    const representationForReading = () => ({
      id: 'representation-1',
      requesterId: requester.id,
      organizationId: 'organization-1',
      status: RepresentationStatus.PENDING,
      representationType: 'representative',
      validationProcedure: 'CONFERENCE',
      organization: {
        id: 'organization-1',
        name: 'Organização representada',
        document: cnpj,
      },
      requester: {
        ...requester,
        lastName: 'Silva',
      },
    });

    it('lets the requester read the representation and returns the legal labels needed by the detail page', async () => {
      representationRepository.findOne.mockResolvedValue(
        representationForReading(),
      );

      await expect(
        service.findOne('representation-1', requester),
      ).resolves.toEqual(
        expect.objectContaining({
          representativeRoleLabel: 'Representante',
          representedType: 'Pessoa jurídica',
          requesterAccountTypeLabel: 'Pessoa física capaz',
          validationProcedureLabel: 'Conferência',
          documentCategoryLabels: {
            constitutive_documents:
              'Documentos constitutivos da pessoa jurídica (Contrato Social / Estatuto)',
            representation_documents:
              'Documentos demonstrativos da representação da pessoa jurídica',
          },
        }),
      );
    });

    it.each(Object.entries(REPRESENTATION_RULES))(
      'returns the role, represented type and document labels for %s',
      async (representationType, rule) => {
        const item = {
          ...representationForReading(),
          representationType,
          organization: {
            ...representationForReading().organization,
            document: rule.documentType === 'CPF' ? cpf : cnpj,
          },
        };
        representationRepository.findOne.mockResolvedValue(item);

        const result = await service.findOne('representation-1', requester);

        expect(result).toEqual(
          expect.objectContaining({
            representativeRoleLabel: expect.any(String),
            representedType: rule.representedType,
            validationProcedureLabel: 'Conferência',
            documentCategoryLabels: Object.fromEntries(
              rule.documents.map((document) => [
                document.category,
                document.label,
              ]),
            ),
          }),
        );
      },
    );

    it('returns co-representatives and the joint-agreement rule as structured informational fields', async () => {
      representationRepository.findOne.mockResolvedValue({
        ...representationForReading(),
        coRepresentatives: ['40345362845', '11144477735'],
        requiresJointAgreement: true,
      });

      const result = await service.findOne('representation-1', requester);

      expect(result.coRepresentatives).toEqual(['40345362845', '11144477735']);
      expect(result.requiresJointAgreement).toBe(true);
      expect(result).not.toHaveProperty('acceptanceRequests');
      expect(result).not.toHaveProperty('coRepresentativeApprovals');
    });

    it('does not grant a co-representative access merely because its CPF is listed', async () => {
      representationRepository.findOne.mockResolvedValue({
        ...representationForReading(),
        coRepresentatives: ['40345362845'],
      });

      await expect(
        service.findOne('representation-1', {
          id: 'co-representative-user',
        } as any),
      ).rejects.toThrow('errors.cannot_view');
    });

    it('blocks a user authorized only for a different organization', async () => {
      representationRepository.findOne.mockResolvedValue(
        representationForReading(),
      );

      await expect(
        service.findOne(
          'representation-1',
          { id: 'organization-user' } as any,
          ['another-organization'],
        ),
      ).rejects.toThrow('errors.cannot_view');
    });

    it('lets a user authorized for the represented organization read the representation', async () => {
      representationRepository.findOne.mockResolvedValue(
        representationForReading(),
      );
      const organizationUser = { id: 'organization-user' } as any;

      await expect(
        service.findOne('representation-1', organizationUser, [
          'organization-1',
        ]),
      ).resolves.toEqual(expect.objectContaining({ id: 'representation-1' }));
    });

    it('lets a global administrator read any representation', async () => {
      representationRepository.findOne.mockResolvedValue(
        representationForReading(),
      );
      const administrator = { id: 'administrator-1' } as any;

      await expect(
        service.findOne('representation-1', administrator, [], true),
      ).resolves.toEqual(expect.objectContaining({ id: 'representation-1' }));
    });

    it('blocks a third party with no requester or organization relationship', async () => {
      representationRepository.findOne.mockResolvedValue(
        representationForReading(),
      );

      await expect(
        service.findOne('representation-1', { id: 'unrelated-user' } as any),
      ).rejects.toThrow('errors.cannot_view');
    });

    it('returns not found before evaluating permissions when the representation does not exist', async () => {
      representationRepository.findOne.mockResolvedValue(null);

      await expect(
        service.findOne('missing-representation', {
          id: 'unrelated-user',
        } as any),
      ).rejects.toThrow('errors.representation_not_found');
    });

    it('returns an administrative overview with the full requester name and legal classifications', async () => {
      const queryBuilder: any = {
        leftJoinAndSelect: jest.fn(),
        andWhere: jest.fn(),
        setParameter: jest.fn(),
        skip: jest.fn(),
        take: jest.fn(),
        orderBy: jest.fn(),
        getManyAndCount: jest
          .fn()
          .mockResolvedValue([[representationForReading()], 1]),
      };
      Object.values(queryBuilder)
        .filter(
          (method) =>
            typeof method === 'function' &&
            method !== queryBuilder.getManyAndCount,
        )
        .forEach((method: any) => method.mockReturnValue(queryBuilder));
      representationRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      await expect(
        service.getOverview(
          { id: 'administrator-1' } as any,
          { page: 1, limit: 10 } as any,
          [],
          true,
        ),
      ).resolves.toEqual({
        data: [
          expect.objectContaining({
            name: 'Organização representada',
            document: cnpj,
            author: 'Ana Silva',
            representativeRoleLabel: 'Representante',
            representedType: 'Pessoa jurídica',
            requesterAccountTypeLabel: 'Pessoa física capaz',
            validationProcedureLabel: 'Conferência',
          }),
        ],
        total: 1,
        page: 1,
        limit: 10,
      });
      expect(queryBuilder.setParameter).toHaveBeenCalledWith(
        'userId',
        'administrator-1',
      );
      expect(queryBuilder.getManyAndCount).toHaveBeenCalled();
    });

    it('applies status, normalized document search, organization scope and pagination to the overview', async () => {
      const queryBuilder: any = {
        leftJoinAndSelect: jest.fn(),
        andWhere: jest.fn(),
        setParameter: jest.fn(),
        skip: jest.fn(),
        take: jest.fn(),
        orderBy: jest.fn(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };
      Object.values(queryBuilder)
        .filter(
          (method) =>
            typeof method === 'function' &&
            method !== queryBuilder.getManyAndCount,
        )
        .forEach((method: any) => method.mockReturnValue(queryBuilder));
      representationRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      await service.getOverview(
        { id: 'organization-user' } as any,
        {
          page: 2,
          limit: 5,
          status: RepresentationStatus.APPROVED,
          search: '46.395.000/0001-39',
        } as any,
        ['organization-1'],
        false,
      );

      expect(queryBuilder.setParameter).toHaveBeenCalledWith(
        'userId',
        'organization-user',
      );
      expect(queryBuilder.setParameter).toHaveBeenCalledWith(
        'organizationIds',
        ['organization-1'],
      );
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'representation.status = :status',
        { status: RepresentationStatus.APPROVED },
      );
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('regexp_replace(organization.document'),
        {
          textSearch: '%46.395.000/0001-39%',
          documentSearch: '%46395000000139%',
        },
      );
      expect(queryBuilder.skip).toHaveBeenCalledWith(5);
      expect(queryBuilder.take).toHaveBeenCalledWith(5);
    });

    it('findAll uses the same scoped overview response as the administrative screen', async () => {
      const overview = { data: [], total: 0, page: 1, limit: 10 };
      const overviewSpy = jest
        .spyOn(service, 'getOverview')
        .mockResolvedValue(overview as any);

      await expect(
        service.findAll(
          { id: 'requester-1' } as any,
          { page: 1, limit: 10 },
          ['organization-1'],
          false,
        ),
      ).resolves.toBe(overview);
      expect(overviewSpy).toHaveBeenCalledWith(
        { id: 'requester-1' },
        { page: 1, limit: 10 },
        ['organization-1'],
        false,
      );
    });
  });

  describe('administrative actions', () => {
    const reviewer = {
      id: 'reviewer-1',
      firstName: 'Revisor',
      email: 'reviewer@example.test',
    } as any;

    const representation = () => ({
      id: 'representation-1',
      requesterId: requester.id,
      organizationId: 'organization-1',
      requester,
      status: RepresentationStatus.PENDING,
      representationType: 'representative',
      validationProcedure: 'CONFERENCE',
    });

    beforeEach(() => {
      representationRepository.findOne.mockImplementation(() =>
        Promise.resolve(representation()),
      );
    });

    it('does not allow the requester to approve their own representation', async () => {
      await expect(
        service.updateStatus(
          'representation-1',
          requester,
          RepresentationStatus.APPROVED,
          'Tentativa de autoaprovação.',
        ),
      ).rejects.toThrow(
        'O solicitante não pode administrar a própria representação.',
      );

      expect(representationRepository.save).not.toHaveBeenCalled();
      expect(commentRepository.save).not.toHaveBeenCalled();
      expect(historyRepository.save).not.toHaveBeenCalled();
    });

    it('requires an administrative reason before changing status', async () => {
      await expect(
        service.updateStatus(
          'representation-1',
          requester,
          RepresentationStatus.APPROVED,
          '  ',
        ),
      ).rejects.toThrow('errors.representation_action_reason_required');
    });

    it('rejects an invalid status before reading or mutating a representation', async () => {
      await expect(
        service.updateStatus(
          'representation-1',
          requester,
          'NOT_A_STATUS' as RepresentationStatus,
          'Motivo',
        ),
      ).rejects.toThrow('errors.invalid_representation_status');
      expect(representationRepository.findOne).not.toHaveBeenCalled();
      expect(representationRepository.save).not.toHaveBeenCalled();
    });

    it('approves, grants access, records history and emails the requester', async () => {
      const result = await service.updateStatus(
        'representation-1',
        reviewer,
        RepresentationStatus.APPROVED,
        'Documentos conferidos.',
        ['parecer.pdf'],
        [],
        true,
      );

      expect(result.status).toBe(RepresentationStatus.APPROVED);
      expect(commentRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          text: 'Documentos conferidos.',
          attachments: ['parecer.pdf'],
        }),
      );
      expect(historyRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'STATUS_APPROVED',
          previousStatus: RepresentationStatus.PENDING,
          newStatus: RepresentationStatus.APPROVED,
          metadata: {
            reason: 'Documentos conferidos.',
            attachments: ['parecer.pdf'],
          },
        }),
      );
      expect(roleService.assign).toHaveBeenCalledWith({
        userId: requester.id,
        organizationId: 'organization-1',
        roleId: SYSTEM_ROLES.organizationAdmin,
      });
      expect(mailService.representationAnalysis).toHaveBeenCalledWith(
        requester.email,
        requester.firstName,
        'Aprovação',
        'https://conta.urbis.prefeitura.sp.gov.br/representations/detail/representation-1',
      );
    });

    it('does not duplicate access or approval notifications when the status is already approved', async () => {
      const item = representation();
      item.status = RepresentationStatus.APPROVED;
      representationRepository.findOne.mockResolvedValue(item);

      await service.updateStatus(
        'representation-1',
        reviewer,
        RepresentationStatus.APPROVED,
        'Revisão registrada novamente.',
        [],
        [],
        true,
      );

      expect(roleService.assign).not.toHaveBeenCalled();
      expect(mailService.representationAnalysis).not.toHaveBeenCalled();
      expect(historyRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'STATUS_APPROVED',
          previousStatus: RepresentationStatus.APPROVED,
          newStatus: RepresentationStatus.APPROVED,
        }),
      );
    });

    it('allows a global administrator to review a request without becoming its requester', async () => {
      const administrator = {
        id: 'administrator-1',
        firstName: 'Admin',
      } as any;

      await service.updateStatus(
        'representation-1',
        administrator,
        RepresentationStatus.APPROVED,
        'Documentos conferidos pela Prefeitura.',
        [],
        [],
        true,
      );

      expect(representationRepository.save).toHaveBeenCalled();
      expect(roleService.assign).toHaveBeenCalledWith({
        userId: requester.id,
        organizationId: 'organization-1',
        roleId: SYSTEM_ROLES.organizationAdmin,
      });
      expect(mailService.representationAnalysis).toHaveBeenCalledWith(
        requester.email,
        requester.firstName,
        'Aprovação',
        expect.stringContaining('/representation-1'),
      );
    });

    it('rejects with a reason and sends a rejection notification', async () => {
      await service.updateStatus(
        'representation-1',
        reviewer,
        RepresentationStatus.REJECTED,
        'Documento ilegível.',
        [],
        [],
        true,
      );

      expect(historyRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'STATUS_REJECTED' }),
      );
      expect(roleService.assign).not.toHaveBeenCalled();
      expect(mailService.representationAnalysis).toHaveBeenCalledWith(
        requester.email,
        requester.firstName,
        'Rejeição',
        expect.any(String),
      );
    });

    it('requests information as a comment, keeps the request in that status and notifies the requester', async () => {
      await service.requestInfo(
        'representation-1',
        reviewer,
        'Envie uma cópia legível.',
        ['orientacao.pdf'],
        [],
        true,
      );

      expect(representationRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: RepresentationStatus.INFO_REQUESTED,
        }),
      );
      expect(commentRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          text: 'Envie uma cópia legível.',
          attachments: ['orientacao.pdf'],
        }),
      );
      expect(historyRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'STATUS_INFO_REQUESTED',
          newStatus: RepresentationStatus.INFO_REQUESTED,
          metadata: expect.objectContaining({
            reason: 'Envie uma cópia legível.',
            attachments: ['orientacao.pdf'],
          }),
        }),
      );
      expect(mailService.representationAnalysis).toHaveBeenCalledWith(
        requester.email,
        requester.firstName,
        'Comentário',
        expect.any(String),
      );
    });

    it('returns an information-requested representation to pending when the requester answers', async () => {
      const item = representation();
      item.status = RepresentationStatus.INFO_REQUESTED;
      representationRepository.findOne.mockResolvedValue(item);

      await service.addComment(
        'representation-1',
        requester,
        'Documentos complementares enviados.',
        ['complementar.pdf'],
      );

      expect(item.status).toBe(RepresentationStatus.PENDING);
      expect(historyRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'INFO_PROVIDED',
          previousStatus: RepresentationStatus.INFO_REQUESTED,
          newStatus: RepresentationStatus.PENDING,
        }),
      );
      expect(historyRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'COMMENTED',
          previousStatus: RepresentationStatus.INFO_REQUESTED,
          newStatus: RepresentationStatus.PENDING,
        }),
      );
    });

    it('requires non-empty text for comments called directly by the service', async () => {
      await expect(
        service.addComment('representation-1', requester, '  '),
      ).rejects.toThrow('errors.representation_action_reason_required');
      expect(representationRepository.findOne).not.toHaveBeenCalled();
    });

    it('does not attempt an analysis email when the requester has no email', async () => {
      const item = {
        ...representation(),
        requester: { ...requester, email: undefined },
      };
      representationRepository.findOne.mockResolvedValue(item);

      await service.updateStatus(
        'representation-1',
        reviewer,
        RepresentationStatus.REJECTED,
        'Documento ilegível.',
        [],
        [],
        true,
      );

      expect(mailService.representationAnalysis).not.toHaveBeenCalled();
    });

    it('records a comment and notifies the requester without changing status', async () => {
      await service.addComment(
        'representation-1',
        requester,
        'Envie uma cópia legível.',
        ['orientacao.pdf'],
      );

      expect(historyRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'COMMENTED',
          newStatus: RepresentationStatus.PENDING,
        }),
      );
      expect(mailService.representationAnalysis).toHaveBeenCalledWith(
        requester.email,
        requester.firstName,
        'Comentário',
        expect.any(String),
      );
    });

    it('blocks an unrelated user from changing or inactivating a representation', async () => {
      const unrelated = { id: 'unrelated-user' } as any;

      await expect(
        service.updateStatus(
          'representation-1',
          unrelated,
          RepresentationStatus.APPROVED,
          'Tentativa indevida.',
        ),
      ).rejects.toThrow('errors.cannot_view');
      expect(representationRepository.save).not.toHaveBeenCalled();
      expect(commentRepository.save).not.toHaveBeenCalled();
    });

    it('inactivates once, retaining a history record and avoiding duplicate work', async () => {
      const item = representation();
      representationRepository.findOne.mockResolvedValue(item);

      await service.inactivate(
        'representation-1',
        requester,
        'Situação substituída.',
      );
      await service.inactivate(
        'representation-1',
        requester,
        'Nova tentativa.',
      );

      expect(item.status).toBe(RepresentationStatus.INACTIVE);
      expect(historyRepository.save).toHaveBeenCalledTimes(1);
      expect(commentRepository.save).toHaveBeenCalledTimes(1);
    });

    it('inactivates all active requests while deleting an account', async () => {
      const item = representation();
      representationRepository.find.mockResolvedValue([item]);
      representationRepository.findOne.mockResolvedValue(item);

      await service.inactivateForUserDeletion(requester);

      expect(representationRepository.find).toHaveBeenCalledWith({
        where: {
          requesterId: requester.id,
          status: expect.anything(),
        },
      });
      expect(item.status).toBe(RepresentationStatus.INACTIVE);
      expect(historyRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'INACTIVATED',
          previousStatus: RepresentationStatus.PENDING,
          newStatus: RepresentationStatus.INACTIVE,
          metadata: expect.objectContaining({
            reason:
              'Representação inativada pela exclusão da conta do usuário.',
          }),
        }),
      );
    });

    it('inactivates pending, approved and information-requested representations but not finalized history', async () => {
      const activeRepresentations = [
        RepresentationStatus.PENDING,
        RepresentationStatus.APPROVED,
        RepresentationStatus.INFO_REQUESTED,
      ].map((status, index) => ({
        ...representation(),
        id: `representation-${index}`,
        status,
      }));
      representationRepository.find.mockResolvedValue(activeRepresentations);
      representationRepository.findOne.mockImplementation(({ where }: any) =>
        Promise.resolve(
          activeRepresentations.find((item) => item.id === where.id),
        ),
      );

      await service.inactivateForUserDeletion(requester);

      expect(activeRepresentations.map((item) => item.status)).toEqual([
        RepresentationStatus.INACTIVE,
        RepresentationStatus.INACTIVE,
        RepresentationStatus.INACTIVE,
      ]);
      expect(historyRepository.save).toHaveBeenCalledTimes(3);
      expect(commentRepository.save).toHaveBeenCalledTimes(3);
      expect(mailService.representationAnalysis).not.toHaveBeenCalled();
    });

    it('does not create a second history entry when deleting an already inactive representation', async () => {
      const item = {
        ...representation(),
        status: RepresentationStatus.INACTIVE,
      };
      representationRepository.find.mockResolvedValue([item]);
      representationRepository.findOne.mockResolvedValue(item);

      await service.inactivateForUserDeletion(requester);

      expect(item.status).toBe(RepresentationStatus.INACTIVE);
      expect(historyRepository.save).not.toHaveBeenCalled();
      expect(commentRepository.save).not.toHaveBeenCalled();
    });
  });
});
