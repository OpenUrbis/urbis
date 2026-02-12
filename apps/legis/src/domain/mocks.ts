import { NormativeOriginal, NormativeElement } from './types';

const defaultValidity = {
  date: '01.01.2024',
  deviceId: 'last-device',
};

export const MOCK_LEI_18080: NormativeOriginal = {
  id: '18080',
  type: 'L',
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
    },
    {
      id: 'p1',
      type: 'Parágrafo',
      index: '1º',
      parentId: 'art1',
      text: 'Entende-se, como sistema de coordenadas geográficas, o conjunto de linhas imaginárias traçadas no globo terrestre sobre as quais se identificam as latitudes e longitudes e quaisquer locais no georreferenciamento paulistano, ainda que não possuam CODLOG e CEP.',
      originalStartValidity: defaultValidity,
    },
    {
      id: 'p2',
      type: 'Parágrafo',
      index: '2º',
      parentId: 'art1',
      text: 'A identificação através do sistema de que trata este artigo poderá se dar por meio da fixação de placas defronte a imóveis, facilitando os serviços de entrega e o acesso a serviços públicos.',
      originalStartValidity: defaultValidity,
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
                relatedDeviceId: 'lei-revogadora'
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
        originalStartValidity: defaultValidity
    }
  ]
};

export const MOCK_RESOLUCAO_18: NormativeOriginal = {
    id: '32154',
    type: 'RES',
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
            originalStartValidity: { date: '09.03.1871', deviceId: 'art4' }
        },
        {
            id: 'art1',
            type: 'Artigo',
            index: '1º',
            text: 'Nas ruas em que a Camara mandar fazer esgotos de pedras, ou concertar os existentes, são os proprietarios obrigados a calçar as suas testadas com pedras, dos mesmos esgotos para dentro.',
            originalStartValidity: { date: '09.03.1871', deviceId: 'art4' }
        },
        {
            id: 'art2',
            type: 'Artigo',
            index: '2º',
            text: 'Nas ruas em que a Camara mandar collocar ao lado dos esgotos guias de cantaria, são os proprietarios obrigados a calçar as suas testadas, das ditas guias para dentro, com lages de cantaria.',
            originalStartValidity: { date: '09.03.1871', deviceId: 'art4' }
        }
    ]
};
