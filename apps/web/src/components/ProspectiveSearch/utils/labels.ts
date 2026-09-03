// Dictionary mapping camelCase backend keys to readable UI labels based on LPUOS documentation
export const PARAMETER_LABELS: Record<string, string> = {
  // Vagas de Automóveis
  numeroMinimoVagasAutomoveisPorAreaConstruidaOuUnidadesHabitacionaisUh:
    "Número mínimo de vagas de automóveis por área construída ou unidades habitacionais (UH)",
  numeroMinimoVagasAutomoveis: "Número mínimo de vagas de automóveis",
  calculoVagasAutomoveisPorArea:
    "Cálculo de vagas de automóveis por área construída",
  calculoVagasAutomoveisPorUh:
    "Cálculo de vagas de automóveis por unidade habitacional (UH)",

  // Vagas de Bicicletas
  numeroMinimoVagasBicicletasPorAreaConstruidaOuUnidadesHabitacionaisUh:
    "Número mínimo de vagas para bicicletas",
  vestiarioUsuariosBicicleta: "Vestiário para usuários de bicicleta",

  // Vagas de Utilitários e Caminhões
  numeroVagasUtilitario: "Número de vagas para utilitários",
  "numeroVagasCaminhaoAte4.000AreaConstruidaComputavel":
    "Número de vagas para caminhão (até 4.000m² de área construída computável)",
  "numeroVagasCaminhaoAcima4.000AreaConstruidaComputavel":
    "Número de vagas para caminhão (acima de 4.000m² de área construída computável)",
  numeroVagasCaminhao: "Número de vagas para caminhão",

  // Acessos e Vias
  areaEmbarqueDesembarquePassageiros:
    "Área de embarque e desembarque de passageiros",
  larguraMinimaVia: "Largura mínima da via",
  larguraViaExistente: "Largura da via existente",

  // Parâmetros de Incomodidade
  nivelRuidoMaximoDiurno: "Nível de ruído máximo permitido (diurno)",
  nivelRuidoMaximoNoturno: "Nível de ruído máximo permitido (noturno)",
  vibracao: "Vibração",
  radiacaoEletromagnetica: "Radiação eletromagnética",
  olores: "Odores",
  gasesVaporesParticulas: "Gases, vapores e partículas",

  // Outros
  horarioCargaDescarga: "Horário de carga e descarga",
  areaMinimaLote: "Área mínima do lote",
  frenteMinimaLote: "Frente mínima do lote",
  areaManobraVeiculos: "Área de manobra de veículos",
};

// Helper to format any parameter key
export const formatParameter = (key: string) => {
  if (PARAMETER_LABELS[key]) return PARAMETER_LABELS[key];

  // Better fallback for camelCase to readable text
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
};

export const NOTAS_DICTIONARY: Record<string, string> = {
  "4 - a":
    "Permitidos oficina automotiva e posto de gasolina desde que localizados numa distância de até 500m (quinhentos metros) da zona urbana.",
  "4 - b":
    "As subcategorias Residenciais (R) são permitidas observadas as disposições estabelecidas no artigo 55 da Lei nº 16.050, de 31 de Julho de 2014 - PDE.",
  "4 - c":
    "Somente a atividade museu, com possibilidade de usos comerciais e de serviços associados.",
  "4 - d":
    "Nas ZPI localizadas em área de proteção aos mananciais, só é permitida a subcategoria de uso Ind-1a, conforme Lei Estadual nº 1.817, de 27 de outubro 1978.",
  "4 - e": "Permitidos somente os usos públicos.",
  "4 - f":
    "Nas zonas ZCOR ficam proibidas as seguintes atividades: albergue; dispensário; flats; apart hotel; hotel; motel; pensionato; pensão; ensino a distância; ensino supletivo; ensino preparatório para escolas; estacionamento privativo do tipo drive-in.",
  "4 - g":
    "Nos lotes localizados nas ZCOR-1 e ZCOR-2 inseridas no perímetro de ZEPEC/AUE nas Subprefeituras Sé, Lapa e Pinheiros, incluindo os lotes externos e lindeiros às ZEPEC/AUE nas respectivas subprefeituras, fica proibida a instalação de usos enquadrados nas subcategorias de uso nR1-2 e nR1-13 e proibidas as seguintes atividades: buffet, buffet infantil, salão de festas e eventos, auditórios, cinemas, teatros, anfiteatros e arenas.",
  "4 - h": "Observado o disposto no artigo 123 desta lei.",
  "4 - i":
    "Atividade shopping center permitida somente nos lotes localizados na área contida no perímetro de incentivo ao desenvolvimento econômico Jacu-Pêssego, nos termos do art. 362 e Mapa 11 anexo à Lei nº 16.050, de 31 de julho de 2014 - PDE.",
  "4 - j":
    "Nas zonas ZCOR a atividade abrigo de medidas protetivas para crianças e adolescentes dependerá de anuência expressa, devidamente firmada e registrada em Cartório de Registro de Títulos e Documentos, de todos os proprietários limítrofes do imóvel em que se pretenda a instalação do estabelecimento, bem como de, pelo menos, 2/3 (dois terços) dos proprietários dos imóveis que tenham mais de 50% (cinquenta por cento) de sua área contida na faixa de 100m (cem metros) medida a partir do perímetro externo do lote a ser ocupado pelo estabelecimento.",
  "4 - k":
    "Nos parques inseridos em ZEPAM, a permissão de instalação de atividades de comércio e serviços e de espaços destinados a eventos fica condicionada à aprovação do órgão ambiental competente, ouvido o conselho gestor do parque ou, na ausência deste, do Conselho Municipal do Meio Ambiente e Desenvolvimento Sustentável - CADES.",
  "4A - a":
    "Não se aplica nas zonas de uso ZEU, ZEUa, ZEUP, ZEUPa, ZEM, ZEMP e nos usos não residenciais em lotes com área inferior a 250m² (duzentos e cinquenta metros quadrados) em todas as zonas.",
  "4A - b": "De acordo com o Código de Obras e Edificações.",
  "4A - c":
    "Não se exige vaga para carga e descarga nos lotes com área até 250m² (duzentos e cinquenta metros quadrados), exceto em lotes localizados na Macroárea de Urbanização Consolidada e nos seguintes setores e subsetores da Macroárea de Estruturação Metropolitana: I. Subsetores Arco Tietê, Arco Pinheiros e Arco Faria Lima - Águas Espraiadas - Chucri Zaidan do Setor Orla Ferroviária e Fluvial. II. Setor Central (Operação Urbana Centro).",
  "4A - d":
    "Para empreendimentos não residenciais acima de 10.000m² (dez mil metros quadrados) de área construída computável, as vagas para caminhão podem ser compartilhadas com os veículos fretados.",
  "4A - e":
    "Para Serviços de Armazenamento e Guarda de Bens Móveis das subcategorias de uso nR1, nR2 e nR3, o número mínimo de vagas de automóveis exigido será calculado com base na área construída computável destinada à permanência humana.",
  "4A - f":
    "Quando exigido o número mínimo de vagas de automóveis, este deverá ser acrescido do número de vagas especiais conforme definido no Código de Obras e Edificações.",
  "4A - g":
    "O atendimento da vaga de caminhão poderá ser dispensado caso haja parecer favorável do órgão municipal de trânsito.",
  "4A - h":
    "Para o cálculo de vagas de utilitário, deverá ser considerada a área computável.",
  "4A - i":
    "Para estabelecimentos de ensino, o número mínimo de vagas por área construída computável (em m²), será calculado com base na área construída computável destinada às atividades administrativas.",
  "4A - j":
    "Nas ZEU e ZEUP ativada, a largura mínima da via será de 12m (doze metros) quando o empreendimento tiver a previsão de vagas de estacionamento.",
};
