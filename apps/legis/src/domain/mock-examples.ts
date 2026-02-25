import { OriginalNormativo as NormativeOriginal, ColetaneaTematica } from './types';

const defaultValidity = {
    date: '01.01.2024',
    deviceId: 'Lei 1.000',
};

// ------------------------------------------------------------
// 1. PLANO DIRETOR ESTRATÉGICO (PDE)
// ------------------------------------------------------------
const LEI_PDE: NormativeOriginal = {
    id: 'lei_pde',
    type: 'original_normativo',
    normativeType: 'L',
    number: '16.050',
    actDate: '31.07.2014',
    publicationDate: '01.08.2014',
    authorityId: 'pref-sp',
    ementa: 'Aprova o Plano Diretor Estratégico e revoga a Lei nº 13.430, de 13 de setembro de 2002.',
    editorContent: JSON.stringify({
        type: 'doc',
        content: [
            { type: 'paragraph', attrs: { normativeId: 'pde_tit1' }, content: [{ type: 'text', text: 'TÍTULO I - DOS PRINCÍPIOS E DIRETRIZES' }] },
            { type: 'paragraph', attrs: { normativeId: 'pde_art1' }, content: [{ type: 'text', text: 'Art. 1º O Plano Diretor Estratégico do Município de São Paulo é o instrumento básico da política de desenvolvimento urbano e tem por objetivo ordenar o pleno desenvolvimento das funções sociais da cidade e da propriedade urbana.' }] },
            { type: 'paragraph', attrs: { normativeId: 'pde_art7' }, content: [{ type: 'text', text: 'Art. 7º São diretrizes da Política de Desenvolvimento Urbano:' }] },
            { type: 'paragraph', attrs: { normativeId: 'pde_art7_inc1' }, content: [{ type: 'text', text: 'I - socialização dos ganhos da produção da cidade;' }] },
            { type: 'paragraph', attrs: { normativeId: 'pde_art7_inc2' }, content: [{ type: 'text', text: 'II - priorização do transporte coletivo e dos modos não motorizados de locomoção;' }] },
            { type: 'paragraph', attrs: { normativeId: 'pde_art8' }, content: [{ type: 'text', text: 'Art. 8º O detalhamento das zonas de uso será objeto da Lei de Parcelamento, Uso e Ocupação do Solo.' }] }
        ]
    }),
    elements: [
        {
            id: 'pde_tit1',
            type: 'Título',
            index: 'I',
            text: 'DOS PRINCÍPIOS E DIRETRIZES',
            originalStartValidity: defaultValidity,
            specialSituations: []
        },
        {
            id: 'pde_art1',
            type: 'Artigo',
            index: '1º',
            text: 'O Plano Diretor Estratégico do Município de São Paulo é o instrumento básico da política de desenvolvimento urbano e tem por objetivo ordenar o pleno desenvolvimento das funções sociais da cidade e da propriedade urbana.',
            originalStartValidity: defaultValidity,
            specialSituations: []
        },
        {
            id: 'pde_art7',
            type: 'Artigo',
            index: '7º',
            text: 'São diretrizes da Política de Desenvolvimento Urbano:',
            originalStartValidity: defaultValidity,
            specialSituations: []
        },
        {
            id: 'pde_art7_inc1',
            type: 'Inciso',
            index: 'I',
            parentId: 'pde_art7',
            text: 'socialização dos ganhos da produção da cidade;',
            originalStartValidity: defaultValidity,
            specialSituations: []
        },
        {
            id: 'pde_art7_inc2',
            type: 'Inciso',
            index: 'II',
            parentId: 'pde_art7',
            text: 'priorização do transporte coletivo e dos modos não motorizados de locomoção;',
            originalStartValidity: defaultValidity,
            specialSituations: []
        },
        {
            id: 'pde_art8',
            type: 'Artigo',
            index: '8º',
            text: 'O detalhamento das zonas de uso será objeto da Lei de Parcelamento, Uso e Ocupação do Solo.',
            originalStartValidity: defaultValidity,
            specialSituations: []
        }
    ],
    sources: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
};

// ------------------------------------------------------------
// 2. LEI DE PARCELAMENTO, USO E OCUPAÇÃO DO SOLO (LPUOS) - ZONEAMENTO
// ------------------------------------------------------------
const LEI_LPUOS: NormativeOriginal = {
    id: 'lei_lpuos',
    type: 'original_normativo',
    normativeType: 'L',
    number: '16.402',
    actDate: '22.03.2016',
    publicationDate: '23.03.2016',
    authorityId: 'pref-sp',
    ementa: 'Disciplina o parcelamento, o uso e a ocupação do solo no Município de São Paulo, de acordo com a Lei nº 16.050, de 31 de julho de 2014 – PDE.',
    editorContent: JSON.stringify({
        type: 'doc',
        content: [
            {
                type: 'paragraph',
                attrs: { normativeId: 'lpuos_art1' },
                content: [{ type: 'text', text: 'Art. 1º Esta lei disciplina o parcelamento, o uso e a ocupação do solo no Município de São Paulo, observadas as diretrizes do Plano Diretor Estratégico - PDE.' }]
            },
            {
                type: 'paragraph',
                attrs: { normativeId: 'lpuos_cap_zonas' },
                content: [{ type: 'text', text: 'CAPÍTULO II - DAS ZONAS' }]
            },
            {
                type: 'paragraph',
                attrs: { normativeId: 'lpuos_art22' },
                content: [{ type: 'text', text: 'Art. 22. As zonas são porções do território onde incidem parâmetros de parcelamento, uso e ocupação do solo específicos.' }]
            },
            {
                type: 'paragraph',
                attrs: { normativeId: 'lpuos_art23' },
                content: [{ type: 'text', text: 'Art. 23. As Zonas Exclusivamente Residenciais - ZER destinam-se à preservação da qualidade ambiental e urbanística de bairros estritamente residenciais.' }]
            }
        ]
    }),
    elements: [
        {
            id: 'lpuos_art1',
            type: 'Artigo',
            index: '1º',
            text: 'Esta lei disciplina o parcelamento, o uso e a ocupação do solo no Município de São Paulo, observadas as diretrizes do Plano Diretor Estratégico - PDE.',
            originalStartValidity: defaultValidity,
            specialSituations: []
        },
        {
            id: 'lpuos_cap_zonas',
            type: 'Capítulo',
            index: 'II',
            text: 'DAS ZONAS',
            originalStartValidity: defaultValidity,
            specialSituations: []
        },
        {
            id: 'lpuos_art22',
            type: 'Artigo',
            index: '22',
            text: 'As zonas são porções do território onde incidem parâmetros de parcelamento, uso e ocupação do solo específicos.',
            originalStartValidity: defaultValidity,
            specialSituations: []
        },
        {
            id: 'lpuos_art23',
            type: 'Artigo',
            index: '23',
            text: 'As Zonas Exclusivamente Residenciais - ZER destinam-se à preservação da qualidade ambiental e urbanística de bairros estritamente residenciais.',
            originalStartValidity: defaultValidity,
            specialSituations: [
                {
                    type: 'Nova redação',
                    date: '10.05.2023',
                    relatedDeviceId: 'lei_revisao_zoneamento',
                    newText: 'As Zonas Exclusivamente Residenciais - ZER destinam-se predominantemente à habitação unifamiliar, admitindo-se usos não residenciais de baixo impacto compatíveis.'
                }
            ]
        }
    ],
    sources: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
};

// ------------------------------------------------------------
// 3. CÓDIGO DE OBRAS E EDIFICAÇÕES (COE)
// ------------------------------------------------------------
const LEI_COE: NormativeOriginal = {
    id: 'lei_coe',
    type: 'original_normativo',
    normativeType: 'L',
    number: '16.642',
    actDate: '09.05.2017',
    publicationDate: '10.05.2017',
    authorityId: 'pref-sp',
    ementa: 'Aprova o Código de Obras e Edificações do Município de São Paulo.',
    editorContent: JSON.stringify({
        type: 'doc',
        content: [
            { type: 'paragraph', attrs: { normativeId: 'coe_art1' }, content: [{ type: 'text', text: 'Art. 1º Fica aprovado o Código de Obras e Edificações do Município de São Paulo, que disciplina as regras gerais a serem observadas no projeto, no licenciamento, na execução, na manutenção e na utilização de obras, edificações e equipamentos.' }] },
            { type: 'paragraph', attrs: { normativeId: 'coe_art15' }, content: [{ type: 'text', text: 'Art. 15. São de responsabilidade do proprietário a manutenção das condições de estabilidade, segurança e salubridade do imóvel.' }] },
            { type: 'paragraph', attrs: { normativeId: 'coe_art22' }, content: [{ type: 'text', text: 'Art. 22. (VETADO)' }] },
            { type: 'paragraph', attrs: { normativeId: 'coe_art55' }, content: [{ type: 'text', text: 'Art. 55. Para o licenciamento de edificações, deverão ser observados os índices urbanísticos estabelecidos na Lei de Parcelamento, Uso e Ocupação do Solo.' }] }
        ]
    }),
    elements: [
        {
            id: 'coe_art1',
            type: 'Artigo',
            index: '1º',
            text: 'Fica aprovado o Código de Obras e Edificações do Município de São Paulo, que disciplina as regras gerais a serem observadas no projeto, no licenciamento, na execução, na manutenção e na utilização de obras, edificações e equipamentos.',
            originalStartValidity: defaultValidity,
            specialSituations: []
        },
        {
            id: 'coe_art15',
            type: 'Artigo',
            index: '15',
            text: 'São de responsabilidade do proprietário a manutenção das condições de estabilidade, segurança e salubridade do imóvel.',
            originalStartValidity: defaultValidity,
            specialSituations: []
        },
        {
            id: 'coe_art22',
            type: 'Artigo',
            index: '22',
            text: '(VETADO)',
            originalStartValidity: defaultValidity,
            specialSituations: [
                {
                    type: 'Veto',
                    date: '09.05.2017',
                    dispositivo: 'Mensagem de Veto nº 10/2024',
                    relatedDeviceId: 'msg_veto_10',
                    vetoText: 'O artigo previa a isenção de taxas para reformas de fachadas em qualquer zona, o que foi considerado renúncia de receita sem a devida compensação.'
                }
            ]
        },
        {
            id: 'coe_art55',
            type: 'Artigo',
            index: '55',
            text: 'Para o licenciamento de edificações, deverão ser observados os índices urbanísticos estabelecidos na Lei de Parcelamento, Uso e Ocupação do Solo.',
            originalStartValidity: defaultValidity,
            specialSituations: []
        }
    ],
    sources: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
};

// ------------------------------------------------------------
// 4. LEI DE PARCELAMENTO DO SOLO (LPS)
// ------------------------------------------------------------
const LEI_LPS: NormativeOriginal = {
    id: 'lei_lps',
    type: 'original_normativo',
    normativeType: 'L',
    number: '9.413',
    actDate: '30.12.1981',
    publicationDate: '31.12.1981',
    authorityId: 'pref-sp',
    ementa: 'Dispõe sobre o parcelamento do solo no Município de São Paulo.',
    editorContent: JSON.stringify({
        type: 'doc',
        content: [
            { type: 'paragraph', attrs: { normativeId: 'lps_art1' }, content: [{ type: 'text', text: 'Art. 1º O parcelamento do solo urbano poderá ser feito mediante loteamento ou desmembramento, observadas as disposições desta lei e das legislações estaduais e federais pertinentes.' }] },
            { type: 'paragraph', attrs: { normativeId: 'lps_art5' }, content: [{ type: 'text', text: 'Art. 5º Os loteamentos deverão atender aos requisitos urbanísticos de percentagem de áreas públicas, dimensões de lotes e sistema viário definidos no Plano Diretor.' }] }
        ]
    }),
    elements: [
        {
            id: 'lps_art1',
            type: 'Artigo',
            index: '1º',
            text: 'O parcelamento do solo urbano poderá ser feito mediante loteamento ou desmembramento, observadas as disposições desta lei e das legislações estaduais e federais pertinentes.',
            originalStartValidity: defaultValidity,
            specialSituations: []
        },
        {
            id: 'lps_art5',
            type: 'Artigo',
            index: '5º',
            text: 'Os loteamentos deverão atender aos requisitos urbanísticos de percentagem de áreas públicas, dimensões de lotes e sistema viário definidos no Plano Diretor.',
            originalStartValidity: defaultValidity,
            specialSituations: [
                {
                    type: 'Perda definitiva de vigor/eficácia',
                    date: '22.03.2016',
                    relatedDeviceId: 'lei_lpuos'
                }
            ]
        }
    ],
    sources: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
};

// ------------------------------------------------------------
// 5. TABELAS COMPLEXAS (Exemplo de Reestruturação)
// ------------------------------------------------------------
const LEI_TABELAS: NormativeOriginal = {
    id: 'lei_tabelas',
    type: 'original_normativo',
    normativeType: 'L',
    number: '1.234',
    actDate: '01.01.2024',
    publicationDate: '02.01.2024',
    authorityId: 'pref-sp',
    ementa: 'Lei de testes para visualização de tabelas normativas simplificadas.',
    editorContent: JSON.stringify({
        type: 'doc',
        content: [
            { type: 'paragraph', content: [{ type: 'text', text: 'Art. 1º Os parâmetros de ocupação do solo são definidos na tabela abaixo:' }] },
            { 
                type: 'table', 
                attrs: { normativeId: 'tab_complexa' },
                content: [
                    {
                        type: 'tableRow',
                        content: [
                            { type: 'tableHeader', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Zona' }] }] },
                            { type: 'tableHeader', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'C.A. Máximo' }] }] },
                            { type: 'tableHeader', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'T.O. Máxima' }] }] }
                        ]
                    },
                    {
                        type: 'tableRow',
                        content: [
                            { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'ZER-1' }] }] },
                            { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: '1.0' }] }] },
                            { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: '0.5' }] }] }
                        ]
                    },
                    {
                        type: 'tableRow',
                        content: [
                            { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Zonas Eixo' }] }] },
                            { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: '4.0' }] }] },
                            { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: '0.7' }] }] }
                        ]
                    }
                ]
            }
        ]
    }),
    elements: [
        {
            id: 'lei_tab_art1',
            type: 'Artigo',
            index: '1º',
            text: 'Os parâmetros de ocupação do solo são definidos na tabela abaixo:',
            originalStartValidity: defaultValidity,
            specialSituations: []
        },
        {
            id: 'tab_complexa',
            type: 'Tabela',
            index: '1',
            text: 'Parâmetros de Ocupação',
            originalStartValidity: defaultValidity,
            specialSituations: [],
            tableData: {
                rows: [
                    { id: 'r1', type: 'Cabeçalho', index: 1 },
                    { id: 'r2', type: 'Corpo', index: 2 },
                    { id: 'r3', type: 'Corpo', index: 3 },
                ],
                cols: [
                    { id: 'c1', type: 'Corpo', index: 1 },
                    { id: 'c2', type: 'Corpo', index: 2 },
                    { id: 'c3', type: 'Corpo', index: 3 },
                ],
                cells: [
                    { rowId: 'r1', colId: 'c1', text: 'Zona', colSpan: 1, rowSpan: 1 },
                    { rowId: 'r1', colId: 'c2', text: 'C.A. Máximo', colSpan: 1, rowSpan: 1 },
                    { rowId: 'r1', colId: 'c3', text: 'T.O. Máxima', colSpan: 1, rowSpan: 1 },
                    { rowId: 'r2', colId: 'c1', text: 'ZER-1', colSpan: 1, rowSpan: 1 },
                    { rowId: 'r2', colId: 'c2', text: '1.0', colSpan: 1, rowSpan: 1 },
                    { rowId: 'r2', colId: 'c3', text: '0.5', colSpan: 1, rowSpan: 1 },
                    { rowId: 'r3', colId: 'c1', text: 'Zonas Eixo', colSpan: 1, rowSpan: 1 },
                    { rowId: 'r3', colId: 'c2', text: '4.0', colSpan: 1, rowSpan: 1 },
                    { rowId: 'r3', colId: 'c3', text: '0.7', colSpan: 1, rowSpan: 1 },
                ]
            }
        }
    ],
    sources: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
};

// ------------------------------------------------------------
// 6. CÓDIGO DE POSTURAS E MOBILIDADE
// ------------------------------------------------------------
const LEI_POSTURAS: NormativeOriginal = {
    id: 'lei_posturas',
    type: 'original_normativo',
    normativeType: 'L',
    number: '14.223',
    actDate: '26.09.2006',
    publicationDate: '27.09.2006',
    authorityId: 'pref-sp',
    ementa: 'Dispõe sobre a ordenação dos elementos que compõem a paisagem urbana do Município de São Paulo (Lei Cidade Limpa).',
    editorContent: JSON.stringify({
        type: 'doc',
        content: [
            { type: 'paragraph', attrs: { normativeId: 'post_art1' }, content: [{ type: 'text', text: 'Art. 1º Fica proibida a colocação de anúncio indicativo ou publicitário na paisagem urbana do Município de São Paulo.' }] },
            { type: 'paragraph', attrs: { normativeId: 'post_art2' }, content: [{ type: 'text', text: 'Art. 2º Para os fins desta lei, considera-se paisagem urbana o espaco aéreo e a superfície externa de qualquer elemento natural ou construído.' }] },
            { type: 'paragraph', attrs: { normativeId: 'post_art15' }, content: [{ type: 'text', text: 'Art. 15. As infrações às normas desta lei sujeitarão os infratores às penalidades de multa e remoção do anúncio.' }] }
        ]
    }),
    elements: [
        {
            id: 'post_art1',
            type: 'Artigo',
            index: '1º',
            text: 'Fica proibida a colocação de anúncio indicativo ou publicitário na paisagem urbana do Município de São Paulo.',
            originalStartValidity: defaultValidity,
            specialSituations: []
        },
        {
            id: 'post_art2',
            type: 'Artigo',
            index: '2º',
            text: 'Para os fins desta lei, considera-se paisagem urbana o espaco aéreo e a superfície externa de qualquer elemento natural ou construído.',
            originalStartValidity: defaultValidity,
            specialSituations: []
        },
        {
            id: 'post_art15',
            type: 'Artigo',
            index: '15',
            text: 'As infrações às normas desta lei sujeitarão os infratores às penalidades de multa e remoção do anúncio.',
            originalStartValidity: defaultValidity,
            specialSituations: []
        }
    ],
    sources: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
};

// ------------------------------------------------------------
// 7. LEI HISTÓRICA E ELEMENTOS DIVERSOS (CAPÍTULOS, FIGURAS, MAPAS, NOTAS)
// ------------------------------------------------------------
const LEI_DIVERSOS: NormativeOriginal = {
    id: 'lei_diversos',
    type: 'original_normativo',
    normativeType: 'L',
    number: '10.406',
    actDate: '10.01.2002',
    publicationDate: '11.01.2002',
    authorityId: 'brasil',
    ementa: 'Institui o Código Civil.',
    name: 'Código Civil',
    preamble: 'O PRESIDENTE DA REPÚBLICA Faço saber que o Congresso Nacional decreta e eu sanciono a seguinte Lei:',
    editorContent: JSON.stringify({
        type: 'doc',
        content: [
            { type: 'paragraph', attrs: { normativeId: 'cap_1' }, content: [{ type: 'text', text: 'CAPÍTULO 1 - INTRODUÇÃO' }] },
            { type: 'paragraph', attrs: { normativeId: 'art_1_antigo' }, content: [{ type: 'text', text: 'Art. 1º Nas ruas em que a Camara mandar fazer esgotos de pedras, ou concertar os existentes, são os proprietarios obrigados a calçar as suas testadas com pedras, dos mesmos esgotos para dentro.' }] },
            { type: 'paragraph', attrs: { normativeId: 'art_2_antigo' }, content: [{ type: 'text', text: 'Art. 2º Nas ruas em que a Camara mandar collocar ao lado dos esgotos guias de cantaria, são os proprietarios obrigados a calçar as suas testadas, das ditas guias para dentro, com lages de cantaria.' }] },
            { type: 'paragraph', attrs: { normativeId: 'art_3_antigo' }, content: [{ type: 'text', text: 'Art. 3º Fica marcado aos proprietarios o prazo de tres mezes, a contar da data em que terminar o concerto das ruas, para cumprirem a obrigação imposta nos artigos, antecedentes.' }] },
            { type: 'paragraph', attrs: { normativeId: 'art_4_antigo' }, content: [{ type: 'text', text: 'Art. 4º Os proprietarios que, findo o prazo, não tiverem feito o calçamento que lhes incumbe, ficão obrigados a satisfazer a despeza que com esse calçamento fizer a Camara, e mais a pagar a multa de 30$, para os cofres da Camara.' }] },
            { type: 'paragraph', attrs: { normativeId: 'fig_88' }, content: [{ type: 'text', text: 'Figura 88 - Faixas de uso da calçada - Corte' }] },
            { type: 'paragraph', attrs: { normativeId: 'mapa_apa' }, content: [{ type: 'text', text: 'APA BORORÉ-COLÔNIA - DELIMITAÇÃO' }] },
            { type: 'paragraph', attrs: { normativeId: 'anexo_1' }, content: [{ type: 'text', text: 'Anexo 1' }] },
            { type: 'paragraph', attrs: { normativeId: 'nota_1' }, content: [{ type: 'text', text: '(1) - Exceto para Zonas de Expansão.' }] }
        ]
    }),
    elements: [
        {
            id: 'cap_1',
            type: 'Capítulo',
            index: '1',
            text: 'INTRODUÇÃO',
            originalStartValidity: defaultValidity,
            specialSituations: []
        },
        {
            id: 'art_1_antigo',
            type: 'Artigo',
            index: '1º',
            text: 'Nas ruas em que a Camara mandar fazer esgotos de pedras, ou concertar os existentes, são os proprietarios obrigados a calçar as suas testadas com pedras, dos mesmos esgotos para dentro.',
            originalStartValidity: defaultValidity,
            specialSituations: []
        },
        {
            id: 'art_2_antigo',
            type: 'Artigo',
            index: '2º',
            text: 'Nas ruas em que a Camara mandar collocar ao lado dos esgotos guias de cantaria, são os proprietarios obrigados a calçar as suas testadas, das ditas guias para dentro, com lages de cantaria.',
            originalStartValidity: defaultValidity,
            specialSituations: []
        },
        {
            id: 'art_3_antigo',
            type: 'Artigo',
            index: '3º',
            text: 'Fica marcado aos proprietarios o prazo de tres mezes, a contar da data em que terminar o concerto das ruas, para cumprirem a obrigação imposta nos artigos, antecedentes.',
            originalStartValidity: defaultValidity,
            specialSituations: []
        },
        {
            id: 'art_4_antigo',
            type: 'Artigo',
            index: '4º',
            text: 'Os proprietarios que, findo o prazo, não tiverem feito o calçamento que lhes incumbe, ficão obrigados a satisfazer a despeza que com esse calçamento fizer a Camara, e mais a pagar a multa de 30$, para os cofres da Camara.',
            originalStartValidity: defaultValidity,
            specialSituations: []
        },
        {
            id: 'fig_88',
            type: 'Figura',
            index: '88',
            text: 'Faixas de uso da calçada - Corte',
            originalStartValidity: defaultValidity,
            specialSituations: [],
            figureData: {
                url: 'https://placehold.co/457x513/000000/FFFFFF/png?text=Figura+88+-+Faixas+de+Uso',
                resolution: { width: 457, height: 513 }
            }
        },
        {
            id: 'mapa_apa',
            type: 'Mapa',
            text: 'APA BORORÉ-COLÔNIA - DELIMITAÇÃO',
            originalStartValidity: defaultValidity,
            specialSituations: [],
            mapData: {
                files: [
                    { name: 'Anexo da Lei (PDF)', url: 'https://legislacao.prefeitura.sp.gov.br/leis/lei-14162-de-24-de-maio-de-2006/anexo/62db2e651411921e64641188/Anexo%20%C3%BAnico%20da%20Lei%20n%C2%BA%2014.162_2006.pdf' }
                ],
                screen: {
                    url: 'https://placehold.co/723x524/2563eb/FFFFFF/png?text=Mapa+APA+Borore-Colonia',
                    resolution: { width: 723, height: 524 }
                }
            }
        },
        {
            id: 'anexo_1',
            type: 'Anexo',
            index: '1',
            text: '',
            originalStartValidity: defaultValidity,
            specialSituations: []
        },
        {
            id: 'nota_1',
            type: 'Nota',
            index: '1',
            text: 'Exceto para Zonas de Expansão.',
            originalStartValidity: defaultValidity,
            specialSituations: [],
            noteData: [
                { targetElementId: 'anexo_1' }
            ]
        }
    ],
    sources: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
};

// ------------------------------------------------------------
// 8. LEI COM SITUAÇÕES ESPECIAIS
// ------------------------------------------------------------
const LEI_SITUACOES_ESPECIAIS: NormativeOriginal = {
    id: 'lei_situacoes_especiais',
    type: 'original_normativo',
    normativeType: 'L',
    number: '18.000',
    actDate: '15.01.2024',
    publicationDate: '16.01.2024',
    authorityId: 'pref-sp',
    ementa: 'Dispõe sobre a identificação de imóveis e sistemas de coordenadas.',
    editorContent: JSON.stringify({
        type: 'doc',
        content: [
            { type: 'paragraph', attrs: { normativeId: 'se_art1' }, content: [{ type: 'text', text: 'Art. 1º Este artigo exemplifica uma vigência inicial alterada (adiada).' }] },
            { type: 'paragraph', attrs: { normativeId: 'se_art2' }, content: [{ type: 'text', text: 'Art. 2º Este artigo exemplifica um veto parcial de trecho.' }] },
            { type: 'paragraph', attrs: { normativeId: 'se_art3' }, content: [{ type: 'text', text: 'Art. 3º Este artigo exemplifica uma derrubada de veto.' }] },
            { type: 'paragraph', attrs: { normativeId: 'se_art4' }, content: [{ type: 'text', text: 'Art. 4º Este artigo exemplifica uma renumeração.' }] }
        ]
    }),
    originalEndValidity: {
        date: '31.12.2030',
        deviceId: 'lei_futura_exemplo'
    },
    alteracoesEmenta: [
        {
            type: 'Alteração de ementa',
            date: '01.07.2024',
            dispositivo: 'Art. 2º da Lei 18.400/2024',
            relatedDeviceId: 'lei_18400_art2',
            newText: 'Dispõe sobre a identificação de imóveis e sistemas de coordenadas geográficas do Município.',
            newTextTrechos: [{ start: 0, end: 85 }]
        }
    ],
    elements: [
        {
            id: 'se_art1',
            type: 'Artigo',
            index: '1º',
            text: 'Este artigo exemplifica uma vigência inicial alterada (adiada).',
            originalStartValidity: {
                date: '01.01.2025',
                deviceId: 'se_art1'
            },
            specialSituations: [
                {
                    type: 'Vigência inicial alterada',
                    date: '01.01.2026',
                    dispositivo: 'Art. 1º da Lei 18.100/2024',
                    relatedDeviceId: 'lei_18100_art1'
                }
            ]
        },
        {
            id: 'se_art2',
            type: 'Artigo',
            index: '2º',
            text: 'Este artigo exemplifica um veto parcial de trecho.',
            originalStartValidity: defaultValidity,
            specialSituations: [
                {
                    type: 'Veto',
                    date: '15.01.2024',
                    dispositivo: 'Mensagem de Veto nº 10/2024',
                    relatedDeviceId: 'msg_veto_10',
                    trechos: [{ start: 13, end: 20 }]
                }
            ]
        },
        {
            id: 'se_art3',
            type: 'Artigo',
            index: '3º',
            text: 'Este artigo exemplifica uma derrubada de veto.',
            originalStartValidity: defaultValidity,
            specialSituations: [
                {
                    type: 'Veto',
                    date: '15.01.2024',
                    dispositivo: 'Mensagem de Veto nº 11/2024',
                    relatedDeviceId: 'msg_veto_11'
                },
                {
                    type: 'Derrubada de veto',
                    date: '20.02.2024',
                    dispositivo: 'Ato da Câmara nº 5/2024',
                    relatedDeviceId: 'ato_camara_5',
                    vetoOverturnedText: 'Este artigo exemplifica uma derrubada de veto.'
                }
            ]
        },
        {
            id: 'se_art4',
            type: 'Artigo',
            index: '4º',
            text: 'Este artigo exemplifica uma renumeração.',
            originalStartValidity: defaultValidity,
            specialSituations: [
                {
                    type: 'Renumeração',
                    date: '01.03.2024',
                    dispositivo: 'Art. 10 da Lei 18.200/2024',
                    relatedDeviceId: 'lei_18200_art10',
                    newIndex: '10-A',
                    newType: 'Artigo'
                }
            ]
        }
    ],
    sources: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
};

// ------------------------------------------------------------
// COLETÂNEAS
// ------------------------------------------------------------
const COL_USO_SOLO: ColetaneaTematica = {
    id: 'col_uso_solo',
    type: 'coletanea_tematica',
    title: 'Compêndio de Uso e Ocupação do Solo',
    collectionType: 'Definições',
    category: 'Urbanístico / parcelamento, uso e ocupação',
    theme: 'Direito Urbanístico',
    shortDescription: 'Compêndio contendo os principais parâmetros de ocupação e zoneamento.',
    fullDescription: JSON.stringify({
        type: "doc",
        content: [
            { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Regras Gerais de Zoneamento" }] },
            { type: "paragraph", content: [{ type: "text", text: "O ordenamento territorial é a base para o desenvolvimento sustentável da cidade." }] }
        ]
    }),
    links: [
        {
            resourceId: 'lei_tabelas',
            resourceType: 'original_normativo',
            linkedElements: [
                {
                    elementId: 'tab_complexa'
                }
            ]
        }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
};

const COL_HISTORICA_COMPLETA: ColetaneaTematica = {
    id: 'col_historica',
    type: 'coletanea_tematica',
    title: 'Coletânea Histórica e Técnica de Urbanismo',
    collectionType: 'Exigências',
    category: 'Infraestrutura e obras públicas',
    theme: 'Evolução Normativa',
    shortDescription: 'Uma coletânea que abrange desde normas históricas de calçamento até parâmetros modernos de ocupação e representação gráfica.',
    fullDescription: JSON.stringify({
        type: "doc",
        content: [
            { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "Documentação Integrada" }] },
            { type: "paragraph", content: [{ type: "text", text: "Esta coletânea agrupa elementos cruciais para entender a infraestrutura urbana." }] },
            { 
                type: "reference", 
                attrs: { 
                    pageId: "lei_diversos", 
                    elementIds: ["cap_1", "art_1_antigo", "art_2_antigo"], 
                    label: "Código Civil - Introdução e Calçamento" 
                } 
            },
            { type: "paragraph", content: [{ type: "text", text: "Abaixo, a representação gráfica das calçadas:" }] },
            { 
                type: "reference", 
                attrs: { 
                    pageId: "lei_diversos", 
                    elementIds: ["fig_88"], 
                    label: "Figura 88 - Faixas de Uso" 
                } 
            },
            { type: "paragraph", content: [{ type: "text", text: "E os dados de zoneamento consolidados:" }] },
            { 
                type: "reference", 
                attrs: { 
                    pageId: "lei_tabelas", 
                    elementIds: ["tab_complexa"], 
                    label: "Parâmetros de Ocupação" 
                } 
            },
            { type: "paragraph", content: [{ type: "text", text: "Por fim, a delimitação da APA Bororé-Colônia:" }] },
            { 
                type: "reference", 
                attrs: { 
                    pageId: "lei_diversos", 
                    elementId: "mapa_apa", 
                    label: "Mapa APA Bororé" 
                } 
            }
        ]
    }),
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
                { elementId: 'nota_1' }
            ]
        },
        {
            resourceId: 'lei_tabelas',
            resourceType: 'original_normativo',
            linkedElements: [
                { elementId: 'tab_complexa' }
            ]
        }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
};

export const MOCK_EXAMPLES: (NormativeOriginal | ColetaneaTematica)[] = [
    LEI_PDE,
    LEI_LPUOS,
    LEI_COE,
    LEI_LPS,
    LEI_POSTURAS,
    LEI_TABELAS,
    LEI_SITUACOES_ESPECIAIS,
    LEI_DIVERSOS,
    COL_USO_SOLO,
    COL_HISTORICA_COMPLETA
];
