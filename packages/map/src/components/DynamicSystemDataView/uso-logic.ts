export interface UsoLPUOS {
  Código: string;
  Divisão: 'Categoria de uso' | 'Subcategoria de uso' | 'Tipologia' | 'Grupo de atividades' | 'Subtipologia' | 'Atividade';
  Descrição: string;
  'Categoria de uso'?: string;
  'Subcategoria de uso'?: string;
  'Grupo de atividades ou Tipologia'?: string;
  'Atividade ou Subtipologia'?: string;
}

export interface CnaePorAtividade {
  'Seção (CNAE 2.2)': string;
  'Divisão (CNAE 2.2)': string;
  'Grupo (CNAE 2.2)': string;
  'Classe (CNAE 2.2)': string;
  'Subclasses (CNAE 2.2)': string;
  'Denominação (CNAE 2.2)': string;
  'Descrição Complementar do Município de São Paulo onde constam restrições municipais'?: string;
  'Subcategoria de Uso': string;
  'Grupo de Atividades': string;
  'Atividade': string;
}

export interface UsoPermitidoPorZona {
  [key: string]: string; // Column headers vary by Zone
}

export interface ParametrosUrbanisticosPorUso {
  [key: string]: string; // Parameter names vary
}

export interface PesquisaUsoResult {
  tipoBusca: 'CNAE' | 'TEXTO' | 'CODIGO';
  termoBuscado: string;
  resultados: Array<{
    item: UsoLPUOS;
    arvore: {
      categoria?: UsoLPUOS;
      subcategoria?: UsoLPUOS;
      tipologiaOuGrupo?: UsoLPUOS;
      subtipologiaOuAtividade?: UsoLPUOS;
    };
    cnaeOriginario?: CnaePorAtividade;
  }>;
}

/**
 * Normaliza string removendo acentos e deixando minúscula
 */
const normalizeString = (str: string) => 
  str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() : '';

/**
 * Busca a árvore completa de hierarquia de um uso a partir das planilhas
 */
export const buildUsoHierarchy = (
  codigo: string, 
  todosUsos: UsoLPUOS[]
): {
  categoria?: UsoLPUOS;
  subcategoria?: UsoLPUOS;
  tipologiaOuGrupo?: UsoLPUOS;
  subtipologiaOuAtividade?: UsoLPUOS;
} => {
  const item = todosUsos.find(u => u.Código === codigo);
  if (!item) return {};

  const arvore: any = {};
  
  if (item.Divisão === 'Atividade' || item.Divisão === 'Subtipologia') {
    arvore.subtipologiaOuAtividade = item;
    if (item['Grupo de atividades ou Tipologia']) {
      arvore.tipologiaOuGrupo = todosUsos.find(u => u.Código === item['Grupo de atividades ou Tipologia']);
    }
  } else if (item.Divisão === 'Tipologia' || item.Divisão === 'Grupo de atividades') {
    arvore.tipologiaOuGrupo = item;
  } else if (item.Divisão === 'Subcategoria de uso') {
    arvore.subcategoria = item;
  } else if (item.Divisão === 'Categoria de uso') {
    arvore.categoria = item;
  }

  // Preencher itens superiores se possível baseado nas referências
  if (!arvore.subcategoria && arvore.tipologiaOuGrupo && arvore.tipologiaOuGrupo['Subcategoria de uso']) {
    arvore.subcategoria = todosUsos.find(u => u.Código === arvore.tipologiaOuGrupo['Subcategoria de uso']);
  }
  
  if (!arvore.categoria && arvore.subcategoria && arvore.subcategoria['Categoria de uso']) {
    arvore.categoria = todosUsos.find(u => u.Código === arvore.subcategoria['Categoria de uso']);
  }

  return arvore;
};

/**
 * Realiza a pesquisa de usos no sistema
 */
export const pesquisarUsos = (
  termo: string,
  usosData: UsoLPUOS[],
  cnaeData: CnaePorAtividade[]
): PesquisaUsoResult => {
  const result: PesquisaUsoResult = {
    tipoBusca: 'TEXTO',
    termoBuscado: termo,
    resultados: []
  };

  if (!termo || !usosData || !usosData.length) return result;

  const termoNormalizado = normalizeString(termo);

  // 1. Tentar buscar por código exato (palavra única, formato comum como HMP-h1, nR1-1-2)
  if (!termo.includes(' ')) {
    const usoPorCodigo = usosData.find(u => u.Código.toLowerCase() === termo.toLowerCase());
    
    if (usoPorCodigo) {
      result.tipoBusca = 'CODIGO';
      result.resultados.push({
        item: usoPorCodigo,
        arvore: buildUsoHierarchy(usoPorCodigo.Código, usosData)
      });
      return result; // Se achou por código exato, para por aqui
    }
  }

  // 2. Tentar buscar por CNAE (se parecer com CNAE, ex: 4691-5/00 ou 46.91-5)
  const isPossivelCnae = /^\d{2,4}[.\-]?\d{0,3}[/\-]?\d{0,2}$/.test(termo);
  
  if (isPossivelCnae && cnaeData && cnaeData.length) {
    const cnaesEncontrados = cnaeData.filter(c => 
      c['Subclasses (CNAE 2.2)']?.includes(termo) || 
      c['Classe (CNAE 2.2)']?.includes(termo) ||
      c['Divisão (CNAE 2.2)']?.includes(termo) ||
      c['Grupo (CNAE 2.2)']?.includes(termo)
    );

    if (cnaesEncontrados.length > 0) {
      result.tipoBusca = 'CNAE';
      
      cnaesEncontrados.forEach(cnae => {
        // Obter atividade ou grupo de atividade relacionado
        const codigoAlvo = cnae.Atividade || cnae['Grupo de Atividades'];
        if (codigoAlvo) {
          const usoEncontrado = usosData.find(u => u.Código === codigoAlvo);
          if (usoEncontrado) {
            result.resultados.push({
              item: usoEncontrado,
              arvore: buildUsoHierarchy(usoEncontrado.Código, usosData),
              cnaeOriginario: cnae
            });
          }
        }
      });
      
      // Remover duplicatas de resultados que apontam para o mesmo uso
      result.resultados = result.resultados.filter((v, i, a) => a.findIndex(t => (t.item.Código === v.item.Código)) === i);
      
      if (result.resultados.length > 0) return result;
    }
  }

  // 3. Buscar por texto na descrição dos usos
  result.tipoBusca = 'TEXTO';
  const usosEncontrados = usosData.filter(u => 
    u.Divisão !== 'Categoria de uso' && 
    u.Divisão !== 'Subcategoria de uso' && // Pesquisa pede para desconsiderar categorias super altas caso não seja exata
    normalizeString(u.Descrição).includes(termoNormalizado)
  );

  usosEncontrados.forEach(uso => {
    result.resultados.push({
      item: uso,
      arvore: buildUsoHierarchy(uso.Código, usosData)
    });
  });

  return result;
};

/**
 * Obtém regras de zonas e notas para uma Tipologia / Grupo de Atividade
 */
export const getRegrasZonamento = (
  codigoTipologiaOuGrupo: string,
  usosPorZonaData: UsoPermitidoPorZona[]
) => {
  if (!usosPorZonaData || !usosPorZonaData.length) return null;
  
  // A coluna que define o grupo/tipologia geralmente se chama "Categoria de Uso / Tipologia" ou similar.
  // Vamos buscar dinamicamente na primeira coluna que parece ser o identificador
  const keyIdentifier = Object.keys(usosPorZonaData[0]).find(k => k.toLowerCase().includes('categoria') || k.toLowerCase().includes('tipologia') || k.toLowerCase().includes('grupo')) || Object.keys(usosPorZonaData[0])[0];
  
  const regra = usosPorZonaData.find(r => r[keyIdentifier] === codigoTipologiaOuGrupo);
  if (!regra) return null;

  const resultadoFormatado = {
    simSemNota: [] as string[],
    simComNota: {} as Record<string, string[]>,
    naoComNota: {} as Record<string, string[]>,
    naoSemNota: [] as string[],
  };

  // Processar as colunas (que são as Zonas) e seus valores (SIM, NÃO, Notas)
  Object.keys(regra).forEach(zona => {
    if (zona === keyIdentifier || !zona) return; // Ignorar a coluna de identificação
    
    const valorRaw = regra[zona];
    if (!valorRaw) return;
    
    const valor = String(valorRaw).trim().toUpperCase();
    
    // Extrair notas se existirem (ex: "SIM (4 - d)")
    const hasNota = valor.includes('(');
    const isSim = valor.startsWith('S') || valor.startsWith('SIM');
    const isNao = valor.startsWith('N') || valor.startsWith('NAO') || valor.startsWith('NÃO');
    
    let notas: string[] = [];
    if (hasNota) {
      const regex = /\(([^)]+)\)/g;
      let match;
      while ((match = regex.exec(valorRaw)) !== null) {
        notas.push(`(${match[1]})`);
      }
    }

    if (isSim && !hasNota) resultadoFormatado.simSemNota.push(zona);
    else if (isNao && !hasNota) resultadoFormatado.naoSemNota.push(zona);
    else if (isSim && hasNota) {
      notas.forEach(n => {
        if (!resultadoFormatado.simComNota[n]) resultadoFormatado.simComNota[n] = [];
        resultadoFormatado.simComNota[n].push(zona);
      });
    }
    else if (isNao && hasNota) {
      notas.forEach(n => {
        if (!resultadoFormatado.naoComNota[n]) resultadoFormatado.naoComNota[n] = [];
        resultadoFormatado.naoComNota[n].push(zona);
      });
    }
  });

  return resultadoFormatado;
};
