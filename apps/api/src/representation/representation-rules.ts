export type RepresentationDocumentCategory = {
  category: string;
  label: string;
};

export type RepresentationRule = {
  representedType: string;
  documentType: 'CPF' | 'CNPJ';
  procedure: 'CONFERENCE' | 'DECLARATORY';
  documents: RepresentationDocumentCategory[];
};

export const REPRESENTATION_RULES: Record<string, RepresentationRule> = {
  attorney: {
    representedType: 'Procurado',
    documentType: 'CPF',
    procedure: 'CONFERENCE',
    documents: [{ category: 'power_of_attorney', label: 'Procuração' }],
  },
  parental_authority_incapable: {
    representedType: 'Incapaz (representado por autoridade parental)',
    documentType: 'CPF',
    procedure: 'CONFERENCE',
    documents: [
      {
        category: 'parental_authority',
        label:
          'Documentos comprobatórios da autoridade parental (Certidão de nascimento)',
      },
    ],
  },
  parental_authority_relatively_incapable: {
    representedType: 'Pessoa Física Assistida (Relativamente Incapaz)',
    documentType: 'CPF',
    procedure: 'CONFERENCE',
    documents: [
      {
        category: 'parental_authority',
        label:
          'Documentos comprobatórios da autoridade parental (Certidão de nascimento)',
      },
    ],
  },
  tutor_incapable: {
    representedType: 'Incapaz (representado por tutor)',
    documentType: 'CPF',
    procedure: 'CONFERENCE',
    documents: [
      {
        category: 'guardianship',
        label: 'Documentos comprobatórios da tutela (Termo de tutela)',
      },
    ],
  },
  curator_incapable: {
    representedType: 'Incapaz (representado por curador)',
    documentType: 'CPF',
    procedure: 'CONFERENCE',
    documents: [
      {
        category: 'curatorship',
        label: 'Documentos comprobatórios da curatela (Termo de curatela)',
      },
    ],
  },
  executor: {
    representedType: 'Espólio',
    documentType: 'CPF',
    procedure: 'CONFERENCE',
    documents: [
      {
        category: 'executor_appointment',
        label: 'Nomeação judicial e compromisso do inventariante',
      },
    ],
  },
  curator_of_vacant_heritage: {
    representedType: 'Herança jacente ou vacante',
    documentType: 'CPF',
    procedure: 'CONFERENCE',
    documents: [
      {
        category: 'curator_appointment',
        label: 'Nomeação judicial e Compromisso do curador',
      },
    ],
  },
  representative: {
    representedType: 'Pessoa jurídica',
    documentType: 'CNPJ',
    procedure: 'CONFERENCE',
    documents: [
      {
        category: 'constitutive_documents',
        label:
          'Documentos constitutivos da pessoa jurídica (Contrato Social / Estatuto)',
      },
      {
        category: 'representation_documents',
        label: 'Documentos demonstrativos da representação da pessoa jurídica',
      },
    ],
  },
  bankruptcy_trustee: {
    representedType: 'Massa falida',
    documentType: 'CNPJ',
    procedure: 'CONFERENCE',
    documents: [
      {
        category: 'bankruptcy_sentence',
        label: 'Sentença declaratória de falência',
      },
    ],
  },
  civil_insolvency_administrator: {
    representedType: 'Massa do insolvente civil',
    documentType: 'CNPJ',
    procedure: 'CONFERENCE',
    documents: [
      {
        category: 'insolvency_sentence',
        label: 'Sentença declaratória de insolvência',
      },
    ],
  },
  syndic_or_administrator: {
    representedType: 'Condomínio edilício',
    documentType: 'CNPJ',
    procedure: 'CONFERENCE',
    documents: [
      { category: 'condominium_convention', label: 'Convenção do condomínio' },
      {
        category: 'syndic_assembly_minutes',
        label: 'Ata de assembleia que elegeu o síndico',
      },
    ],
  },
};

export const REPRESENTATION_ROLE_LABELS: Record<string, string> = {
  attorney: 'Procurador',
  parental_authority_incapable: 'Autoridade parental',
  parental_authority_relatively_incapable: 'Autoridade parental',
  tutor_incapable: 'Tutor',
  curator_incapable: 'Curador',
  executor: 'Inventariante',
  curator_of_vacant_heritage: 'Curador da herança jacente ou vacante',
  representative: 'Representante',
  bankruptcy_trustee: 'Administrador da massa falida',
  civil_insolvency_administrator: 'Administrador do insolvente civil',
  syndic_or_administrator: 'Síndico ou Administrador',
};

export type NormalizedRepresentationDocument = {
  category: string;
  files: string[];
};

export function normalizeRepresentationDocuments(
  documents: unknown,
): NormalizedRepresentationDocument[] {
  if (!Array.isArray(documents)) return [];

  // Keep the legacy shape readable for migration/detail pages. New requests are
  // validated by the service and must use the categorized shape below.
  if (documents.every((document) => typeof document === 'string')) {
    return [
      {
        category: 'legacy',
        files: documents.map((document) => document.trim()).filter(Boolean),
      },
    ];
  }

  const grouped = new Map<string, string[]>();
  for (const document of documents) {
    if (
      !document ||
      typeof document !== 'object' ||
      typeof document.category !== 'string' ||
      !Array.isArray(document.files)
    ) {
      continue;
    }

    const category = document.category.trim();
    if (!category) continue;

    const files = document.files
      .filter((file: unknown): file is string => typeof file === 'string')
      .map((file: string) => file.trim())
      .filter(Boolean);

    const currentFiles = grouped.get(category) || [];
    grouped.set(category, [...currentFiles, ...files]);
  }

  return Array.from(grouped, ([category, files]) => ({ category, files }));
}
