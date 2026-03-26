type LegisSeedCategory = {
  id: string;
  name: string;
  color?: string;
};

type LegisSeedPage = {
  id: string;
  title: string;
  slug: string;
  type: 'original_normativo' | 'coletanea_tematica';
  author: string;
  tags: string[];
  categoryId?: string;
  isPublic: boolean;
  content: string;
  entityType: 'original_normativo' | 'coletanea_tematica';
  entityData: Record<string, unknown>;
};

const DEFAULT_VALIDITY = {
  date: '01.01.2024',
  deviceId: 'Lei 1.000',
};

const toDoc = (
  content: Array<Record<string, unknown>>,
): string => JSON.stringify({ type: 'doc', content });

const paragraph = (text: string, normativeId?: string): Record<string, unknown> => ({
  type: 'paragraph',
  ...(normativeId ? { attrs: { normativeId } } : {}),
  content: [{ type: 'text', text }],
});

const heading = (text: string, level = 1): Record<string, unknown> => ({
  type: 'heading',
  attrs: { level },
  content: [{ type: 'text', text }],
});

const referenceNode = (
  label: string,
  pageId: string,
  elementIds: string[],
): Record<string, unknown> => ({
  type: 'reference',
  attrs: {
    pageId,
    elementIds,
    label,
  },
});

const originalNormativo = ({
  id,
  title,
  slug,
  number,
  actDate,
  publicationDate,
  ementa,
  editorContent,
  elements,
  tags,
  categoryId,
}: {
  id: string;
  title: string;
  slug: string;
  number?: string;
  actDate?: string;
  publicationDate?: string;
  ementa: string;
  editorContent: string;
  elements: Array<Record<string, unknown>>;
  tags: string[];
  categoryId?: string;
}): LegisSeedPage => ({
  id,
  title,
  slug,
  type: 'original_normativo',
  author: 'pref-sp',
  tags,
  categoryId,
  isPublic: true,
  content: editorContent,
  entityType: 'original_normativo',
  entityData: {
    id,
    type: 'original_normativo',
    normativeType: 'L',
    number,
    actDate,
    publicationDate,
    authorityId: 'pref-sp',
    ementa,
    sources: [],
    elements,
    editorContent,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
});

const coletaneaTematica = ({
  id,
  title,
  slug,
  collectionType,
  category,
  theme,
  shortDescription,
  fullDescription,
  links,
}: {
  id: string;
  title: string;
  slug: string;
  collectionType: 'Exigências' | 'Competências' | 'Definições' | 'Fontes de Informação';
  category: string;
  theme: string;
  shortDescription?: string;
  fullDescription: string;
  links: Array<Record<string, unknown>>;
}): LegisSeedPage => ({
  id,
  title,
  slug,
  type: 'coletanea_tematica',
  author: 'Equipe Legis',
  tags: [category, theme],
  categoryId: '1',
  isPublic: true,
  content: fullDescription,
  entityType: 'coletanea_tematica',
  entityData: {
    id,
    type: 'coletanea_tematica',
    title,
    collectionType,
    category,
    theme,
    shortDescription,
    fullDescription,
    links,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
});

export const LEGIS_SEED_CATEGORIES: LegisSeedCategory[] = [
  { id: '1', name: 'Geral', color: 'gray' },
  { id: '2', name: 'Jurídico', color: 'blue' },
  { id: '3', name: 'Urbano', color: 'green' },
];

export const LEGIS_SEED_PAGES: LegisSeedPage[] = [
  originalNormativo({
    id: 'lei_pde',
    title: 'Plano Diretor Estratégico',
    slug: 'lei_pde',
    number: '16.050',
    actDate: '31.07.2014',
    publicationDate: '01.08.2014',
    ementa:
      'Aprova o Plano Diretor Estratégico e revoga a Lei nº 13.430, de 13 de setembro de 2002.',
    editorContent: toDoc([
      paragraph('TÍTULO I - DOS PRINCÍPIOS FUNDAMENTAIS', 'pde_tit1'),
      paragraph('Art. 1º Esta lei institui o Plano Diretor Estratégico do Município de São Paulo.', 'pde_art1'),
      paragraph('Art. 7º São objetivos da política urbana ordenar o pleno desenvolvimento das funções sociais da cidade.', 'pde_art7'),
      paragraph('Inciso I - garantir o direito à cidade sustentável.', 'pde_art7_inc1'),
      paragraph('Inciso II - promover o desenvolvimento urbano equilibrado.', 'pde_art7_inc2'),
      paragraph('Art. 8º O detalhamento das zonas de uso será objeto da Lei de Parcelamento, Uso e Ocupação do Solo.', 'pde_art8'),
    ]),
    elements: [
      {
        id: 'pde_tit1',
        type: 'Título',
        index: 'I',
        text: 'DOS PRINCÍPIOS FUNDAMENTAIS',
        originalStartValidity: DEFAULT_VALIDITY,
        specialSituations: [],
      },
      {
        id: 'pde_art1',
        type: 'Artigo',
        index: '1º',
        text: 'Esta lei institui o Plano Diretor Estratégico do Município de São Paulo.',
        originalStartValidity: DEFAULT_VALIDITY,
        specialSituations: [],
      },
      {
        id: 'pde_art7',
        type: 'Artigo',
        index: '7º',
        text: 'São objetivos da política urbana ordenar o pleno desenvolvimento das funções sociais da cidade.',
        originalStartValidity: DEFAULT_VALIDITY,
        specialSituations: [],
      },
      {
        id: 'pde_art7_inc1',
        type: 'Inciso',
        index: 'I',
        text: 'Garantir o direito à cidade sustentável.',
        parentId: 'pde_art7',
        originalStartValidity: DEFAULT_VALIDITY,
        specialSituations: [],
      },
      {
        id: 'pde_art7_inc2',
        type: 'Inciso',
        index: 'II',
        text: 'Promover o desenvolvimento urbano equilibrado.',
        parentId: 'pde_art7',
        originalStartValidity: DEFAULT_VALIDITY,
        specialSituations: [],
      },
      {
        id: 'pde_art8',
        type: 'Artigo',
        index: '8º',
        text: 'O detalhamento das zonas de uso será objeto da Lei de Parcelamento, Uso e Ocupação do Solo.',
        originalStartValidity: DEFAULT_VALIDITY,
        specialSituations: [],
      },
    ],
    tags: ['planejamento', 'urbano'],
    categoryId: '3',
  }),
  originalNormativo({
    id: 'lei_lpuos',
    title: 'Lei de Parcelamento, Uso e Ocupação do Solo',
    slug: 'lei_lpuos',
    number: '16.402',
    actDate: '22.03.2016',
    publicationDate: '23.03.2016',
    ementa:
      'Disciplina o parcelamento, o uso e a ocupação do solo no Município de São Paulo, de acordo com a Lei nº 16.050, de 31 de julho de 2014 – PDE.',
    editorContent: toDoc([
      paragraph('Art. 1º Esta lei disciplina o parcelamento, o uso e a ocupação do solo no Município de São Paulo.', 'lpuos_art1'),
      paragraph('CAPÍTULO II - DAS ZONAS', 'lpuos_cap_zonas'),
      paragraph('Art. 22. As zonas são porções do território onde incidem parâmetros específicos.', 'lpuos_art22'),
      paragraph('Art. 23. As Zonas Exclusivamente Residenciais - ZER destinam-se à preservação da qualidade ambiental e urbanística.', 'lpuos_art23'),
    ]),
    elements: [
      {
        id: 'lpuos_art1',
        type: 'Artigo',
        index: '1º',
        text: 'Esta lei disciplina o parcelamento, o uso e a ocupação do solo no Município de São Paulo.',
        originalStartValidity: DEFAULT_VALIDITY,
        specialSituations: [],
      },
      {
        id: 'lpuos_cap_zonas',
        type: 'Capítulo',
        index: 'II',
        text: 'DAS ZONAS',
        originalStartValidity: DEFAULT_VALIDITY,
        specialSituations: [],
      },
      {
        id: 'lpuos_art22',
        type: 'Artigo',
        index: '22',
        text: 'As zonas são porções do território onde incidem parâmetros de parcelamento, uso e ocupação do solo específicos.',
        originalStartValidity: DEFAULT_VALIDITY,
        specialSituations: [],
      },
      {
        id: 'lpuos_art23',
        type: 'Artigo',
        index: '23',
        text: 'As Zonas Exclusivamente Residenciais - ZER destinam-se à preservação da qualidade ambiental e urbanística de bairros estritamente residenciais.',
        originalStartValidity: DEFAULT_VALIDITY,
        specialSituations: [
          {
            type: 'Nova redação',
            date: '10.05.2023',
            relatedDeviceId: 'lei_revisao_zoneamento',
            newText:
              'As Zonas Exclusivamente Residenciais - ZER destinam-se predominantemente à habitação unifamiliar, admitindo-se usos não residenciais de baixo impacto compatíveis.',
          },
        ],
      },
    ],
    tags: ['zoneamento', 'urbano'],
    categoryId: '3',
  }),
  originalNormativo({
    id: 'lei_coe',
    title: 'Código de Obras e Edificações',
    slug: 'lei_coe',
    number: '16.642',
    actDate: '09.05.2017',
    publicationDate: '10.05.2017',
    ementa: 'Aprova o Código de Obras e Edificações do Município de São Paulo.',
    editorContent: toDoc([
      paragraph('Art. 1º Fica aprovado o Código de Obras e Edificações do Município de São Paulo.', 'coe_art1'),
      paragraph('Art. 15. São de responsabilidade do proprietário a manutenção das condições de estabilidade, segurança e salubridade do imóvel.', 'coe_art15'),
      paragraph('Art. 22. (VETADO)', 'coe_art22'),
      paragraph('Art. 55. Para o licenciamento de edificações, deverão ser observados os índices urbanísticos estabelecidos na LPUOS.', 'coe_art55'),
    ]),
    elements: [
      {
        id: 'coe_art1',
        type: 'Artigo',
        index: '1º',
        text: 'Fica aprovado o Código de Obras e Edificações do Município de São Paulo.',
        originalStartValidity: DEFAULT_VALIDITY,
        specialSituations: [],
      },
      {
        id: 'coe_art15',
        type: 'Artigo',
        index: '15',
        text: 'São de responsabilidade do proprietário a manutenção das condições de estabilidade, segurança e salubridade do imóvel.',
        originalStartValidity: DEFAULT_VALIDITY,
        specialSituations: [],
      },
      {
        id: 'coe_art22',
        type: 'Artigo',
        index: '22',
        text: '(VETADO)',
        originalStartValidity: DEFAULT_VALIDITY,
        specialSituations: [
          {
            type: 'Veto',
            date: '09.05.2017',
            dispositivo: 'Mensagem de Veto nº 10/2024',
            relatedDeviceId: 'msg_veto_10',
            vetoText:
              'O artigo previa a isenção de taxas para reformas de fachadas em qualquer zona, o que foi considerado renúncia de receita sem a devida compensação.',
          },
        ],
      },
      {
        id: 'coe_art55',
        type: 'Artigo',
        index: '55',
        text: 'Para o licenciamento de edificações, deverão ser observados os índices urbanísticos estabelecidos na Lei de Parcelamento, Uso e Ocupação do Solo.',
        originalStartValidity: DEFAULT_VALIDITY,
        specialSituations: [],
      },
    ],
    tags: ['obras', 'edificacoes'],
    categoryId: '3',
  }),
  originalNormativo({
    id: 'lei_lps',
    title: 'Lei de Parcelamento do Solo',
    slug: 'lei_lps',
    number: '9.413',
    actDate: '30.12.1981',
    publicationDate: '31.12.1981',
    ementa: 'Dispõe sobre o parcelamento do solo no Município de São Paulo.',
    editorContent: toDoc([
      paragraph('Art. 1º O parcelamento do solo urbano poderá ser feito mediante loteamento ou desmembramento.', 'lps_art1'),
      paragraph('Art. 5º Os loteamentos deverão atender aos requisitos urbanísticos definidos no Plano Diretor.', 'lps_art5'),
    ]),
    elements: [
      {
        id: 'lps_art1',
        type: 'Artigo',
        index: '1º',
        text: 'O parcelamento do solo urbano poderá ser feito mediante loteamento ou desmembramento.',
        originalStartValidity: DEFAULT_VALIDITY,
        specialSituations: [],
      },
      {
        id: 'lps_art5',
        type: 'Artigo',
        index: '5º',
        text: 'Os loteamentos deverão atender aos requisitos urbanísticos de percentagem de áreas públicas, dimensões de lotes e sistema viário definidos no Plano Diretor.',
        originalStartValidity: DEFAULT_VALIDITY,
        specialSituations: [
          {
            type: 'Perda definitiva de vigor/eficácia',
            date: '22.03.2016',
            relatedDeviceId: 'lei_lpuos',
          },
        ],
      },
    ],
    tags: ['parcelamento', 'solo'],
    categoryId: '3',
  }),
  originalNormativo({
    id: 'lei_tabelas',
    title: 'Lei de testes para visualização de tabelas',
    slug: 'lei_tabelas',
    number: '1.234',
    actDate: '01.01.2024',
    publicationDate: '02.01.2024',
    ementa: 'Lei de testes para visualização de tabelas normativas simplificadas.',
    editorContent: toDoc([
      paragraph('Art. 1º Os parâmetros de ocupação do solo são definidos na tabela abaixo:', 'lei_tab_art1'),
      {
        type: 'table',
        attrs: { normativeId: 'tab_complexa' },
        content: [
          {
            type: 'tableRow',
            content: [
              { type: 'tableHeader', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Zona' }] }] },
              { type: 'tableHeader', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'C.A. Máximo' }] }] },
              { type: 'tableHeader', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'T.O. Máxima' }] }] },
            ],
          },
          {
            type: 'tableRow',
            content: [
              { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'ZER-1' }] }] },
              { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: '1.0' }] }] },
              { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: '0.5' }] }] },
            ],
          },
        ],
      },
    ]),
    elements: [
      {
        id: 'lei_tab_art1',
        type: 'Artigo',
        index: '1º',
        text: 'Os parâmetros de ocupação do solo são definidos na tabela abaixo.',
        originalStartValidity: DEFAULT_VALIDITY,
        specialSituations: [],
      },
      {
        id: 'tab_complexa',
        type: 'Tabela',
        text: 'Tabela normativa simplificada de parâmetros de ocupação.',
        originalStartValidity: DEFAULT_VALIDITY,
        specialSituations: [],
        tableData: {
          rows: [
            { id: 'row-1', type: 'Cabeçalho', index: 0 },
            { id: 'row-2', type: 'Corpo', index: 1 },
          ],
          cols: [
            { id: 'col-1', type: 'Cabeçalho', index: 0 },
            { id: 'col-2', type: 'Cabeçalho', index: 1 },
            { id: 'col-3', type: 'Cabeçalho', index: 2 },
          ],
          cells: [
            { rowId: 'row-2', colId: 'col-1', text: 'ZER-1' },
            { rowId: 'row-2', colId: 'col-2', text: '1.0' },
            { rowId: 'row-2', colId: 'col-3', text: '0.5' },
          ],
        },
      },
    ],
    tags: ['tabelas', 'visualizacao'],
    categoryId: '3',
  }),
  originalNormativo({
    id: 'lei_posturas',
    title: 'Lei Cidade Limpa',
    slug: 'lei_posturas',
    ementa:
      'Dispõe sobre a ordenação dos elementos que compõem a paisagem urbana do Município de São Paulo (Lei Cidade Limpa).',
    editorContent: toDoc([
      paragraph('Art. 1º Esta lei dispõe sobre a paisagem urbana do Município de São Paulo.', 'post_art1'),
      paragraph('Art. 2º A ordenação dos anúncios obedecerá critérios de interesse público.', 'post_art2'),
      paragraph('Art. 15. Ficam estabelecidas regras para mobiliário urbano e anúncios.', 'post_art15'),
    ]),
    elements: [
      { id: 'post_art1', type: 'Artigo', index: '1º', text: 'Esta lei dispõe sobre a paisagem urbana do Município de São Paulo.', originalStartValidity: DEFAULT_VALIDITY, specialSituations: [] },
      { id: 'post_art2', type: 'Artigo', index: '2º', text: 'A ordenação dos anúncios obedecerá critérios de interesse público.', originalStartValidity: DEFAULT_VALIDITY, specialSituations: [] },
      { id: 'post_art15', type: 'Artigo', index: '15', text: 'Ficam estabelecidas regras para mobiliário urbano e anúncios.', originalStartValidity: DEFAULT_VALIDITY, specialSituations: [] },
    ],
    tags: ['paisagem', 'publicidade'],
    categoryId: '3',
  }),
  originalNormativo({
    id: 'lei_diversos',
    title: 'Código Civil - exemplos diversos',
    slug: 'lei_diversos',
    ementa: 'Institui o Código Civil.',
    editorContent: toDoc([
      paragraph('CAPÍTULO I - DISPOSIÇÕES GERAIS', 'cap_1'),
      paragraph('Art. 1º Antigo texto de introdução normativa.', 'art_1_antigo'),
      paragraph('Art. 2º Antigo texto referente a calçamento.', 'art_2_antigo'),
      paragraph('Art. 3º Texto adicional de referência histórica.', 'art_3_antigo'),
      paragraph('Art. 4º Texto complementar para fins de teste.', 'art_4_antigo'),
      paragraph('Figura 88 - Faixas de Uso.', 'fig_88'),
      paragraph('Mapa APA Bororé-Colônia.', 'mapa_apa'),
      paragraph('Anexo 1 - Documentação complementar.', 'anexo_1'),
      paragraph('Nota 1 - Observação sobre dispositivos.', 'nota_1'),
    ]),
    elements: [
      { id: 'cap_1', type: 'Capítulo', index: 'I', text: 'DISPOSIÇÕES GERAIS', originalStartValidity: DEFAULT_VALIDITY, specialSituations: [] },
      { id: 'art_1_antigo', type: 'Artigo', index: '1º', text: 'Antigo texto de introdução normativa.', originalStartValidity: DEFAULT_VALIDITY, specialSituations: [] },
      { id: 'art_2_antigo', type: 'Artigo', index: '2º', text: 'Antigo texto referente a calçamento.', originalStartValidity: DEFAULT_VALIDITY, specialSituations: [] },
      { id: 'art_3_antigo', type: 'Artigo', index: '3º', text: 'Texto adicional de referência histórica.', originalStartValidity: DEFAULT_VALIDITY, specialSituations: [] },
      { id: 'art_4_antigo', type: 'Artigo', index: '4º', text: 'Texto complementar para fins de teste.', originalStartValidity: DEFAULT_VALIDITY, specialSituations: [] },
      { id: 'fig_88', type: 'Figura', text: 'Figura 88 - Faixas de Uso.', originalStartValidity: DEFAULT_VALIDITY, specialSituations: [], figureData: { url: 'https://placehold.co/800x600?text=Figura+88' } },
      {
        id: 'mapa_apa',
        type: 'Mapa',
        text: 'Mapa APA Bororé-Colônia.',
        originalStartValidity: DEFAULT_VALIDITY,
        specialSituations: [],
        mapData: {
          screen: { url: 'https://placehold.co/1024x768?text=Mapa+APA' },
          minimap: { lat: -23.692, lng: -46.678, zoom: 10, layers: ['apa-borore-colonia'] },
        },
      },
      { id: 'anexo_1', type: 'Anexo', text: 'Documentação complementar do anexo 1.', originalStartValidity: DEFAULT_VALIDITY, specialSituations: [], attachmentId: 'anexo-1' },
      {
        id: 'nota_1',
        type: 'Nota',
        text: 'Observação interpretativa relacionada ao art. 2º.',
        originalStartValidity: DEFAULT_VALIDITY,
        specialSituations: [],
        noteData: [{ targetElementId: 'art_2_antigo' }],
      },
    ],
    tags: ['referencias', 'historico'],
    categoryId: '2',
  }),
  originalNormativo({
    id: 'lei_situacoes_especiais',
    title: 'Situações especiais e coordenadas',
    slug: 'lei_situacoes_especiais',
    ementa: 'Dispõe sobre a identificação de imóveis e sistemas de coordenadas.',
    editorContent: toDoc([
      paragraph('Art. 1º Dispõe sobre identificação de imóveis.', 'se_art1'),
      paragraph('Art. 2º Trata de atualização cadastral.', 'se_art2'),
      paragraph('Art. 3º Define hipóteses especiais de vigência.', 'se_art3'),
      paragraph('Art. 4º Consolida critérios de georreferenciamento.', 'se_art4'),
    ]),
    elements: [
      { id: 'se_art1', type: 'Artigo', index: '1º', text: 'Dispõe sobre identificação de imóveis.', originalStartValidity: DEFAULT_VALIDITY, specialSituations: [] },
      { id: 'se_art2', type: 'Artigo', index: '2º', text: 'Trata de atualização cadastral.', originalStartValidity: DEFAULT_VALIDITY, specialSituations: [] },
      {
        id: 'se_art3',
        type: 'Artigo',
        index: '3º',
        text: 'Define hipóteses especiais de vigência.',
        originalStartValidity: DEFAULT_VALIDITY,
        specialSituations: [{ type: 'Suspensão de vigor/eficácia', date: '01.03.2024', relatedDeviceId: 'decisao-liminar-1' }],
      },
      { id: 'se_art4', type: 'Artigo', index: '4º', text: 'Consolida critérios de georreferenciamento.', originalStartValidity: DEFAULT_VALIDITY, specialSituations: [] },
    ],
    tags: ['vigencia', 'coordenadas'],
    categoryId: '2',
  }),
  coletaneaTematica({
    id: 'col_uso_solo',
    title: 'Compêndio de Uso e Ocupação do Solo',
    slug: 'col_uso_solo',
    collectionType: 'Definições',
    category: 'Uso do Solo',
    theme: 'Zoneamento',
    shortDescription: 'Coletânea temática para consultas rápidas sobre parcelamento e zoneamento.',
    fullDescription: toDoc([
      heading('Compêndio de Uso e Ocupação do Solo'),
      paragraph('Esta coletânea agrupa referências úteis para compreender o zoneamento municipal.'),
      referenceNode('Plano Diretor Estratégico', 'lei_pde', ['pde_art1', 'pde_art7', 'pde_art8']),
      referenceNode('Lei de Parcelamento, Uso e Ocupação do Solo', 'lei_lpuos', ['lpuos_art1', 'lpuos_art22', 'lpuos_art23']),
      referenceNode('Lei de Parcelamento do Solo', 'lei_lps', ['lps_art1', 'lps_art5']),
    ]),
    links: [
      {
        resourceId: 'lei_pde',
        resourceType: 'original_normativo',
        linkedElements: [{ elementId: 'pde_art1' }, { elementId: 'pde_art7' }, { elementId: 'pde_art8' }],
      },
      {
        resourceId: 'lei_lpuos',
        resourceType: 'original_normativo',
        linkedElements: [{ elementId: 'lpuos_art1' }, { elementId: 'lpuos_art22' }, { elementId: 'lpuos_art23' }],
      },
      {
        resourceId: 'lei_lps',
        resourceType: 'original_normativo',
        linkedElements: [{ elementId: 'lps_art1' }, { elementId: 'lps_art5' }],
      },
    ],
  }),
  coletaneaTematica({
    id: 'col_historica',
    title: 'Coletânea Histórica e Técnica de Urbanismo',
    slug: 'col_historica',
    collectionType: 'Fontes de Informação',
    category: 'História Urbana',
    theme: 'Infraestrutura',
    shortDescription: 'Coleção de referências históricas, técnicas e gráficas para o editor do Legis.',
    fullDescription: toDoc([
      heading('Documentação Integrada'),
      paragraph('Esta coletânea agrupa elementos cruciais para entender a infraestrutura urbana.'),
      referenceNode('Código Civil - Introdução e Calçamento', 'lei_diversos', ['cap_1', 'art_1_antigo', 'art_2_antigo']),
      paragraph('Abaixo, a representação gráfica das calçadas:'),
      referenceNode('Figura 88 - Faixas de Uso', 'lei_diversos', ['fig_88']),
      paragraph('E os dados de zoneamento consolidados:'),
      referenceNode('Parâmetros de Ocupação', 'lei_tabelas', ['tab_complexa']),
      paragraph('Por fim, a delimitação da APA Bororé-Colônia:'),
      referenceNode('Mapa APA Bororé', 'lei_diversos', ['mapa_apa']),
    ]),
    links: [
      {
        resourceId: 'lei_diversos',
        resourceType: 'original_normativo',
        linkedElements: [
          { elementId: 'cap_1' },
          { elementId: 'art_1_antigo' },
          { elementId: 'art_2_antigo' },
          { elementId: 'fig_88' },
          { elementId: 'mapa_apa' },
          { elementId: 'anexo_1' },
          { elementId: 'nota_1' },
        ],
      },
      {
        resourceId: 'lei_tabelas',
        resourceType: 'original_normativo',
        linkedElements: [{ elementId: 'tab_complexa' }],
      },
    ],
  }),
];