import { OriginalNormativo } from './entities';

const defaultValidity = {
  date: '01.01.2024',
  deviceId: 'last-device',
};

export const MOCK_FULL_EXAMPLE: OriginalNormativo = {
    id: '99999',
    type: 'original_normativo',
    normativeType: 'L',
    number: '99.999',
    actDate: '01.01.2025',
    publicationDate: '02.01.2025',
    authorityId: '1006', // Presidência da República (valid ID)
    ementa: 'Dispõe sobre a validação completa de todos os estilos de visualização de documentos normativos, incluindo tabelas complexas, figuras, mapas e notas de rodapé.',
    preamble: '<p><strong>O PREFEITO DO MUNICÍPIO DE SÃO PAULO</strong>, no uso das atribuições que lhe são conferidas por lei, faz saber que a Câmara Municipal, em sessão de 31 de dezembro de 2023, decretou e eu promulgo a seguinte Lei:</p>',
    signature: '<p>PREFEITURA DO MUNICÍMIR DE SÃO PAULO, aos 01 de janeiro de 2024, 471º da fundação de São Paulo.</p><p>RICARDO NUNES, Prefeito</p><p>FABRICIO COBRA ARBEX, Secretário Municipal da Casa Civil</p>',
    elements: [
        {
            id: 'tit1',
            type: 'Título',
            index: 'I',
            text: 'DAS DISPOSIÇÕES GERAIS',
            originalStartValidity: defaultValidity,
            specialSituations: []
        },
        {
            id: 'cap1',
            type: 'Capítulo',
            index: 'I',
            text: 'DO OBJETIVO',
            originalStartValidity: defaultValidity,
            specialSituations: []
        },
        {
            id: 'art1',
            type: 'Artigo',
            index: '1º',
            text: 'Esta Lei estabelece as normas para visualização de documentos estruturados.',
            originalStartValidity: defaultValidity,
            specialSituations: []
        },
        {
            id: 'art2',
            type: 'Artigo',
            index: '2º',
            text: 'A visualização deve contemplar todos os elementos ricos possíveis.',
            originalStartValidity: defaultValidity,
            specialSituations: []
        },
        {
            id: 'p1_art2',
            type: 'Parágrafo',
            index: '1º',
            parentId: 'art2',
            text: 'Os parágrafos devem ser indentados corretamente.',
            originalStartValidity: defaultValidity,
            specialSituations: []
        },
        {
            id: 'inc1_art2',
            type: 'Inciso',
            index: 'I',
            parentId: 'art2',
            text: 'Incisos utilizam algarismos romanos.',
            originalStartValidity: defaultValidity,
            specialSituations: []
        },
        {
            id: 'ali_a_inc1',
            type: 'Alínea',
            index: 'a',
            parentId: 'inc1_art2',
            text: 'Alíneas utilizam letras minúsculas.',
            originalStartValidity: defaultValidity,
            specialSituations: []
        },
        {
            id: 'item1_ali_a',
            type: 'Item',
            index: '1',
            parentId: 'ali_a_inc1',
            text: 'Itens utilizam algarismos arábicos.',
            originalStartValidity: defaultValidity,
            specialSituations: []
        },
        {
            id: 'tab_complex',
            type: 'Tabela',
            index: '1',
            text: 'Tabela Complexa de Teste',
            originalStartValidity: defaultValidity,
            specialSituations: [],
            tableData: {
                rows: [
                    { id: 'r1', type: 'Cabeçalho', index: 1 },
                    { id: 'r2', type: 'Cabeçalho', index: 2 },
                    { id: 'r3', type: 'Corpo', index: 3 },
                    { id: 'r4', type: 'Corpo', index: 4 }
                ],
                cols: [
                    { id: 'c1', type: 'Cabeçalho', index: 1 },
                    { id: 'c2', type: 'Cabeçalho', index: 2 },
                    { id: 'c3', type: 'Cabeçalho', index: 3 }
                ],
                cells: [
                    // Header Row 1
                    { rowId: 'r1', colId: 'c1', text: 'Categoria', rowSpan: 2 },
                    { rowId: 'r1', colId: 'c2', text: 'Valores', colSpan: 2 },
                    // Header Row 2 (c1 skipped due to rowspan)
                    { rowId: 'r2', colId: 'c2', text: 'Min' },
                    { rowId: 'r2', colId: 'c3', text: 'Max' },
                    // Body Row 1
                    { rowId: 'r3', colId: 'c1', text: 'Tipo A' },
                    { rowId: 'r3', colId: 'c2', text: '10' },
                    { rowId: 'r3', colId: 'c3', text: '20' },
                    // Body Row 2
                    { rowId: 'r4', colId: 'c1', text: 'Tipo B' },
                    { rowId: 'r4', colId: 'c2', text: '30' },
                    { rowId: 'r4', colId: 'c3', text: '40' }
                ],
                footer: 'Fonte: Dados fictícios gerados para teste.'
            }
        },
        {
            id: 'fig1',
            type: 'Figura',
            index: '1',
            text: 'Exemplo de Figura Ilustrativa',
            originalStartValidity: defaultValidity,
            specialSituations: [],
            figureData: {
                url: 'https://placehold.co/600x400/EEE/31343C?text=Figura+Teste',
                resolution: { width: 600, height: 400 }
            }
        },
        {
            id: 'map1',
            type: 'Mapa',
            index: '1',
            text: 'Mapa de Zoneamento (Simulado)',
            originalStartValidity: defaultValidity,
            specialSituations: [],
            mapData: {
                files: [
                    { name: 'Mapa em PDF (Alta Resolução)', url: '#' },
                    { name: 'Shapefile (.shp)', url: '#' }
                ],
                screen: {
                    url: 'https://placehold.co/800x500/D1FAE5/10B981?text=Mapa+Zoneamento',
                    resolution: { width: 800, height: 500 }
                }
            }
        },
        {
            id: 'art3',
            type: 'Artigo',
            index: '3º',
            text: 'Este artigo contém uma referência a uma nota de rodapé.',
            originalStartValidity: defaultValidity,
            specialSituations: []
        },
        {
            id: 'nota1',
            type: 'Nota',
            index: '1',
            text: 'Esta é a nota explicativa referente ao Artigo 3º.',
            originalStartValidity: defaultValidity,
            specialSituations: [],
            noteData: [
                { targetElementId: 'art3' }
            ]
        },
        {
            id: 'anexo1',
            type: 'Anexo',
            index: 'I',
            text: 'ANEXO ÚNICO - LISTA DE ABREVIAÇÕES',
            originalStartValidity: defaultValidity,
            specialSituations: []
        }
    ],
    sources: [
        { name: 'Diário Oficial', url: 'https://diariooficial.sp.gov.br' }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
};

export const MOCK_LEI_18080: OriginalNormativo = {
  id: '18080',
  type: 'original_normativo',
  normativeType: 'L',
  number: '18.080',
  actDate: '15.01.2024',
  publicationDate: '16.01.2024',
  authorityId: 'pref-sp',
  ementa: 'Institui, a partir do sistema de coordenadas geográficas, a possibilidade de fixação de placas para a identificação de imóveis que não possuam CODLOG e Código de Endereçamento Postal (CEP).',
  elements: [
    {
      id: 'art1',
      type: 'Artigo',
      index: '1º',
      text: 'Fica instituída, a partir do sistema de coordenadas geográficas, a possibilidade de fixação de placas para a identificação de imóveis que não possuam CODLOG e Código de Endereçamento Postal (CEP).',
      originalStartValidity: defaultValidity,
      specialSituations: []
    },
    {
      id: 'p1',
      type: 'Parágrafo',
      index: '1º',
      parentId: 'art1',
      text: 'Entende-se, como sistema de coordenadas geográficas, o conjunto de linhas imaginárias traçadas no globo terrestre sobre as quais se identificam as latitudes e longitudes e quaisquer locais no georreferenciamento paulistano, ainda que não possuam CODLOG e CEP.',
      originalStartValidity: defaultValidity,
      specialSituations: []
    },
    {
      id: 'p2',
      type: 'Parágrafo',
      index: '2º',
      parentId: 'art1',
      text: 'A identificação através do sistema de que trata este artigo poderá se dar por meio da fixação de placas defronte a imóveis, facilitando os serviços de entrega e o acesso a serviços públicos.',
      originalStartValidity: defaultValidity,
      specialSituations: []
    },
    {
        id: 'p3',
        type: 'Parágrafo',
        index: '3º',
        parentId: 'art1',
        text: 'Este parágrafo foi revogado pela Lei 99.999/2025.',
        originalStartValidity: defaultValidity,
        specialSituations: [
            {
                type: 'Perda definitiva de vigor/eficácia',
                date: '01.01.2025', // Should be revoked if viewed after 2025
                relatedDeviceId: '99999'
            }
        ]
    },
    {
        id: 'p4',
        type: 'Parágrafo',
        index: '4º',
        parentId: 'art1',
        text: 'Este parágrafo entrará em vigor em 2030.',
        originalStartValidity: { date: '01.01.2030', deviceId: 'futuro' },
        specialSituations: []
    },
    {
        id: 'p5',
        type: 'Parágrafo',
        index: '5º',
        parentId: 'art1',
        text: 'A identificação de que trata o § 2º deste artigo poderá ser efetuada a partir de informações do Sistema de Referência Cartográfica WGS84, codificadas sob a forma reduzida, com 8 (oito) dígitos.',
        originalStartValidity: defaultValidity,
        specialSituations: [
            {
                type: 'Veto',
                date: '15.01.2024',
                relatedDeviceId: 'razao-veto-1',
                vetoText: '(VETADO)', // The whole text is replaced or just parts? Spec says if full veto, text is replaced.
            }
        ]
    },
    {
        id: 'tab1',
        type: 'Tabela',
        index: '1',
        text: 'Exemplo de Tabela',
        originalStartValidity: defaultValidity,
        specialSituations: []
    }
  ],
  sources: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

export const MOCK_RESOLUCAO_18: OriginalNormativo = {
    id: '32154',
    type: 'original_normativo',
    normativeType: 'RES',
    number: '18',
    actDate: '09.03.1871',
    authorityId: 'ESP',
    ementa: 'MANDA PUBLICAR E EXECUTAR CINCO ARTIGOS DE POSTURAS DA CÂMARA MUNICIPAL DESTA CAPITAL',
    preamble: 'Antonio da Costa Pinto Silva, Presidente da Provincia de S. Paulo etc., etc.\nFaço saber a todos os seus habitantes que a Assembléa Legislativa Provincial, sobre proposta da Camara Municipal da Capital, decretou a seguinte Resolução:',
    signature: 'O Secretario desta Provincia a faça imprimir, publicar e correr.\nDada no Palacio do Governo de S. Paulo, aos nove dias do mez de Março do anno do mil oitocentos e setenta e um.\n(L. S.)\nAntonio Da Costa Pinto Silva.\nPara V. Ex. vêr,\nJoão Maria Rodrigues de Vasconcellos a fez.\nPublicada na Secretaria do Governo de S. Paulo, aos nove dias do mez de Março de mil oitocentos e setenta e um.\nJoão Carlos da Silva Telles.',
    elements: [
        {
            id: 'cap1',
            type: 'Capítulo',
            index: '1',
            text: 'INTRODUÇÃO',
            originalStartValidity: { date: '09.03.1871', deviceId: 'art4' },
            specialSituations: []
        },
        {
            id: 'art1',
            type: 'Artigo',
            index: '1º',
            text: 'Nas ruas em que a Camara mandar fazer esgotos de pedras, ou concertar os existentes, são os proprietarios obrigados a calçar as suas testadas com pedras, dos mesmos esgotos para dentro.',
            originalStartValidity: { date: '09.03.1871', deviceId: 'art4' },
            specialSituations: []
        },
        {
            id: 'art2',
            type: 'Artigo',
            index: '2º',
            text: 'Nas ruas em que a Camara mandar collocar ao lado dos esgotos guias de cantaria, são os proprietarios obrigados a calçar as suas testadas, das ditas guias para dentro, com lages de cantaria.',
            originalStartValidity: { date: '09.03.1871', deviceId: 'art4' },
            specialSituations: []
        }
    ],
    sources: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
};
