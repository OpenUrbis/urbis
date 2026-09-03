import {
  normalizeRepresentationDocuments,
  REPRESENTATION_ROLE_LABELS,
  REPRESENTATION_RULES,
} from './representation-rules';

describe('representation rules', () => {
  const expectedRepresentationTypes = [
    'attorney',
    'parental_authority_incapable',
    'parental_authority_relatively_incapable',
    'tutor_incapable',
    'curator_incapable',
    'executor',
    'curator_of_vacant_heritage',
    'representative',
    'bankruptcy_trustee',
    'civil_insolvency_administrator',
    'syndic_or_administrator',
  ];

  it('keeps a complete, labelled rule for every supported representation type', () => {
    expect(Object.keys(REPRESENTATION_RULES)).toEqual(
      expectedRepresentationTypes,
    );

    for (const representationType of expectedRepresentationTypes) {
      const rule = REPRESENTATION_RULES[representationType];

      expect(rule.representedType).toEqual(expect.any(String));
      expect(['CPF', 'CNPJ']).toContain(rule.documentType);
      expect(rule.procedure).toBe('CONFERENCE');
      expect(rule.documents.length).toBeGreaterThan(0);
      expect(REPRESENTATION_ROLE_LABELS[representationType]).toEqual(
        expect.any(String),
      );
      expect(
        new Set(rule.documents.map((document) => document.category)).size,
      ).toBe(rule.documents.length);
      expect(
        rule.documents.every(
          (document) =>
            document.category.length > 0 && document.label.length > 0,
        ),
      ).toBe(true);
    }
  });

  it('matches the requested QA definitions for the corrected representation types', () => {
    expect(REPRESENTATION_RULES.attorney).toMatchObject({
      documentType: 'CPF',
    });
    expect(REPRESENTATION_RULES.executor).toMatchObject({
      documentType: 'CPF',
    });
    expect(
      REPRESENTATION_RULES.parental_authority_relatively_incapable,
    ).toMatchObject({
      documentType: 'CPF',
    });
    expect(REPRESENTATION_RULES.curator_of_vacant_heritage).toEqual({
      representedType: 'Herança jacente ou vacante',
      documentType: 'CPF',
      procedure: 'CONFERENCE',
      documents: [
        {
          category: 'curator_appointment',
          label: 'Nomeação judicial e Compromisso do curador',
        },
      ],
    });
    expect(REPRESENTATION_RULES.syndic_or_administrator).toMatchObject({
      representedType: 'Condomínio edilício',
      documentType: 'CNPJ',
    });
  });

  it('groups repeated categories while preserving every non-empty file', () => {
    expect(
      normalizeRepresentationDocuments([
        { category: ' constitutive_documents ', files: ['contract-1.pdf'] },
        { category: 'constitutive_documents', files: ['contract-2.pdf', '  '] },
        { category: 'representation_documents', files: ['minutes.pdf'] },
      ]),
    ).toEqual([
      {
        category: 'constitutive_documents',
        files: ['contract-1.pdf', 'contract-2.pdf'],
      },
      { category: 'representation_documents', files: ['minutes.pdf'] },
    ]);
  });

  it('keeps legacy files readable without treating them as a new category', () => {
    expect(
      normalizeRepresentationDocuments(['old-1.pdf', 'old-2.pdf']),
    ).toEqual([{ category: 'legacy', files: ['old-1.pdf', 'old-2.pdf'] }]);
  });

  it('returns no document categories for non-array or malformed input', () => {
    expect(normalizeRepresentationDocuments(undefined)).toEqual([]);
    expect(normalizeRepresentationDocuments({ category: 'x' })).toEqual([]);
    expect(
      normalizeRepresentationDocuments([
        { category: 'valid', files: ['valid.pdf'] },
        { category: 'missing-files' },
        'mixed-shape.pdf',
      ]),
    ).toEqual([{ category: 'valid', files: ['valid.pdf'] }]);
  });

  it('does not mutate the request input while normalizing documents', () => {
    const input = [{ category: 'power_of_attorney', files: ['mandate.pdf'] }];
    const snapshot = JSON.parse(JSON.stringify(input));

    normalizeRepresentationDocuments(input);

    expect(input).toEqual(snapshot);
  });
});
