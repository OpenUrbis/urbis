// packages/map/src/components/ProspectiveSearch/utils/use-logic.ts

import {
  UsoLPUOS,
  CnaePorAtividade,
  UsoPermitidoPorZona,
  PesquisaUsoResult,
  RegraZonamento,
  UsoHierarchy,
  CondicaoInstalacao,
  ParametrosUrbanisticosPorUso,
} from "./types";

/**
 * Normaliza string removendo acentos e deixando minúscula
 */
export const normalizeString = (str: string) =>
  str
    ? String(str)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
    : "";

/**
 * Extrai o texto da nota da tabela de metadados.
 * Nas tabelas da Urbis, as notas (ex: (4 - d)) geralmente podem ser cruzadas com a base de dados em algum lugar,
 * ou são explícitas nos cabeçalhos.
 */
export const extractNotas = (valorRaw: string): string[] => {
  const notas: string[] = [];
  if (valorRaw && valorRaw.includes("(")) {
    const regex = /\(([^)]+)\)/g;
    let match;
    while ((match = regex.exec(valorRaw)) !== null) {
      notas.push(`(${match[1]})`);
    }
  }
  return notas;
};

/**
 * Busca a árvore completa de hierarquia de um uso a partir das planilhas
 */
export const buildUsoHierarchy = (
  codigo: string,
  todosUsos: UsoLPUOS[],
): UsoHierarchy => {
  const getVal = (obj: any, keys: string[]) => {
    if (!obj) return "";
    const foundKey = Object.keys(obj).find((k) =>
      keys.some((key) => key.toLowerCase() === k.trim().toLowerCase()),
    );
    return foundKey && obj[foundKey] !== undefined && obj[foundKey] !== null
      ? String(obj[foundKey]).trim()
      : "";
  };

  const item = todosUsos.find(
    (u) => getVal(u, ["Código", "Codigo", "codigo"]) === codigo,
  );
  if (!item) return {};

  const arvore: UsoHierarchy = {};
  const div = getVal(item, ["Divisão", "Divisao", "divisao", "Divisão "]);
  const normalizedDiv = normalizeString(div);

  if (normalizedDiv === "atividade" || normalizedDiv === "subtipologia") {
    arvore.subtipologiaOuAtividade = item;
    const parentCode = getVal(item, [
      "Grupo de atividades ou Tipologia",
      "Grupo de atividades ou tipologia",
      "grupoAtividadesOuTipologia",
      "Tipologia",
      "Grupo de atividades",
    ]);
    if (parentCode) {
      arvore.tipologiaOuGrupo = todosUsos.find(
        (u) => getVal(u, ["Código", "Codigo", "codigo"]) === parentCode,
      );
    }
  } else if (
    normalizedDiv === "tipologia" ||
    normalizedDiv === "grupo de atividades"
  ) {
    arvore.tipologiaOuGrupo = item;
  } else if (normalizedDiv === "subcategoria de uso") {
    arvore.subcategoria = item;
  } else if (normalizedDiv === "categoria de uso") {
    arvore.categoria = item;
  }

  // Preencher itens superiores se possível baseado nas referências
  if (!arvore.subcategoria && arvore.tipologiaOuGrupo) {
    const targetCode = getVal(arvore.tipologiaOuGrupo, [
      "Subcategoria de uso",
      "Subcategoria",
      "subcategoriaUso",
    ]);
    if (targetCode)
      arvore.subcategoria = todosUsos.find(
        (u) => getVal(u, ["Código", "Codigo", "codigo"]) === targetCode,
      );
  }

  if (!arvore.categoria && arvore.subcategoria) {
    const targetCode = getVal(arvore.subcategoria, [
      "Categoria de uso",
      "Categoria",
      "categoriaUso",
    ]);
    if (targetCode)
      arvore.categoria = todosUsos.find(
        (u) => getVal(u, ["Código", "Codigo", "codigo"]) === targetCode,
      );
  }

  return arvore;
};

/**
 * Realiza a pesquisa de usos no sistema
 */
export const pesquisarUsos = (
  termo: string,
  usosData: UsoLPUOS[],
  cnaeData: CnaePorAtividade[],
  modo: "atividade" | "cnae" = "atividade",
): PesquisaUsoResult => {
  const result: PesquisaUsoResult = {
    tipoBusca: "TEXTO",
    termoBuscado: termo,
    resultados: [],
  };

  if (!termo || !usosData || !usosData.length) return result;

  const termoNormalizado = normalizeString(termo);
  const termoCodigo = termo.trim().toLowerCase();

  // Helper function to safely get dynamic object keys in case they have trailing spaces like "Código "
  const getVal = (obj: any, possibleKeys: string[]) => {
    if (!obj) return "";
    for (const k of possibleKeys) {
      const foundKey = Object.keys(obj).find(
        (key) => key.trim().toLowerCase() === k.toLowerCase(),
      );
      if (foundKey && obj[foundKey] !== undefined && obj[foundKey] !== null) {
        return String(obj[foundKey]).trim();
      }
    }
    return "";
  };

  // 1. Buscar por código parcial ou exato (Apenas para modo Atividade)
  if (modo === "atividade") {
    const termoCodigoClean = termoCodigo.replace(/[^a-z0-9]/g, "");

    const usosPorCodigo = usosData.filter((u) => {
      const cod = getVal(u, ["Código", "Codigo", "codigo"]);
      if (!cod) return false;
      const codClean = cod.toLowerCase().replace(/[^a-z0-9]/g, "");
      return (
        codClean.includes(termoCodigoClean) ||
        cod.toLowerCase().includes(termoCodigo)
      );
    });

    if (usosPorCodigo.length > 0) {
      result.tipoBusca = "CODIGO";

      // Check if we have an EXACT match for a leaf code (e.g. "nR1-1" strictly matching "nR1-1")
      const exatos = usosPorCodigo.filter((u) => {
        const cod = getVal(u, ["Código", "Codigo", "codigo"])
          .toLowerCase()
          .trim();
        const div = getVal(u, ["Divisão", "Divisao", "divisao"])
          .toLowerCase()
          .trim();
        return (
          cod === termoCodigo.trim() &&
          ([
            "atividade",
            "grupo de atividades",
            "subtipologia",
            "tipologia",
          ].includes(div) ||
            cod === "r1")
        );
      });

      if (exatos.length > 0) {
        exatos.forEach((uso) => {
          result.resultados.push({
            item: uso,
            arvore: buildUsoHierarchy(
              getVal(uso, ["Código", "Codigo", "codigo"]),
              usosData,
            ),
          });
        });
        return result;
      }

      // Otherwise, we do partial matching (e.g. user typed "nR" and we show "nRa-1", "nR1", etc)
      usosPorCodigo.forEach((uso) => {
        result.resultados.push({
          item: uso,
          arvore: buildUsoHierarchy(
            getVal(uso, ["Código", "Codigo", "codigo"]),
            usosData,
          ),
        });
      });

      // Limit to avoid breaking the UI with 500 results
      result.resultados = result.resultados.slice(0, 50);
      if (result.resultados.length > 0) return result;
    }
  }

  // 2. Tentar buscar por CNAE (Apenas para modo CNAE)
  if (modo === "cnae" && cnaeData && cnaeData.length) {
    const termoCnae = termo.replace(/[.\-/]/g, ""); // Remove separadores para busca flexível

    const cnaesEncontrados = cnaeData.filter((c) => {
      const subclass = getVal(c, [
        "subclassesCnae2.2",
        "Subclasses (CNAE 2.2)",
      ]).replace(/[.\-/]/g, "");
      const denom = normalizeString(
        getVal(c, ["denominacaoCnae2.2", "Denominação (CNAE 2.2)"]),
      );

      return subclass.includes(termoCnae) || denom.includes(termoNormalizado);
    });

    if (cnaesEncontrados.length > 0) {
      result.tipoBusca = "CNAE";

      cnaesEncontrados.forEach((cnae) => {
        // Obter atividade ou grupo de atividade relacionado
        const codigoAlvo = getVal(cnae, [
          "atividade",
          "Atividade",
          "grupoAtividades",
          "Grupo de Atividades",
        ]);
        if (codigoAlvo) {
          const usoEncontrado = usosData.find(
            (u) => getVal(u, ["Código", "Codigo", "codigo"]) === codigoAlvo,
          );
          if (usoEncontrado) {
            result.resultados.push({
              item: usoEncontrado,
              arvore: buildUsoHierarchy(
                getVal(usoEncontrado, ["Código", "Codigo", "codigo"]),
                usosData,
              ),
              cnaeOriginario: cnae,
            });
          }
        }
      });

      // Remover duplicatas
      result.resultados = result.resultados.filter(
        (v, i, a) =>
          a.findIndex(
            (t) =>
              getVal(t.item, ["Código", "Codigo", "codigo"]) ===
              getVal(v.item, ["Código", "Codigo", "codigo"]),
          ) === i,
      );

      if (result.resultados.length > 0) return result;
    }
  }

  // 3. Buscar por texto na descrição dos usos (Apenas para modo Atividade)
  if (modo === "atividade") {
    result.tipoBusca = "TEXTO";
    const termoCodigoClean = termoCodigo.replace(/[^a-z0-9]/g, "");

    const usosEncontrados = usosData.filter((u) => {
      const desc = getVal(u, ["Descrição", "Descricao", "descricao"]);
      const cod = getVal(u, ["Código", "Codigo", "codigo"])
        .toLowerCase()
        .trim();
      const div = getVal(u, ["Divisão", "Divisao", "divisao"])
        .toLowerCase()
        .trim();

      // Skip categories/subcategories except R1 which is a selectable leaf node
      if (
        (div === "categoria de uso" || div === "subcategoria de uso") &&
        cod !== "r1"
      ) {
        return false;
      }

      const compactedSearchIndex = `${cod} ${div} ${desc}`.toLowerCase();
      const compactedSearchIndexClean = compactedSearchIndex.replace(
        /[^a-z0-9]/g,
        "",
      );

      return (
        normalizeString(desc).includes(termoNormalizado) ||
        compactedSearchIndex.includes(termoCodigo) ||
        compactedSearchIndexClean.includes(termoCodigoClean)
      );
    });

    usosEncontrados.forEach((uso) => {
      result.resultados.push({
        item: uso,
        arvore: buildUsoHierarchy(
          getVal(uso, ["Código", "Codigo", "codigo"]),
          usosData,
        ),
      });
    });
  }

  return result;
};

/**
 * Obtém regras de zonas e notas para uma Tipologia / Grupo de Atividade
 */
export const getRegrasZonamento = (
  codigoTipologiaOuGrupo: string,
  usosPorZonaData: UsoPermitidoPorZona[],
): RegraZonamento | null => {
  if (!usosPorZonaData || !usosPorZonaData.length) return null;

  const possibleKeys = [
    "categoriaUsoTipologia",
    "categoriausotipologia",
    "categoria de uso / tipologia",
  ];
  const keyIdentifier =
    Object.keys(usosPorZonaData[0]).find(
      (k) =>
        possibleKeys.includes(k.toLowerCase().trim()) ||
        k.toLowerCase().includes("tipologia") ||
        k.toLowerCase().includes("grupo"),
    ) || Object.keys(usosPorZonaData[0])[0];

  // Safe string compare to ensure we match codes like "R1" to "R1" safely
  const regra = usosPorZonaData.find(
    (r) =>
      r[keyIdentifier] &&
      String(r[keyIdentifier]).trim().toLowerCase() ===
        String(codigoTipologiaOuGrupo).trim().toLowerCase(),
  );
  if (!regra) return null;

  const resultadoFormatado: RegraZonamento = {
    simSemNota: [],
    simComNota: {},
    naoComNota: {},
    naoSemNota: [],
    zoeZep: [],
  };

  Object.keys(regra).forEach((zona) => {
    if (zona === keyIdentifier || !zona) return;

    // Tratamento de zonas ZOE e ZEP (Uso regrado por regime especial)
    if (zona.toUpperCase() === "ZOE" || zona.toUpperCase() === "ZEP") {
      resultadoFormatado.zoeZep.push(zona);
      return;
    }

    const valorRaw = regra[zona];
    if (!valorRaw) return;

    const valor = String(valorRaw).trim().toUpperCase();

    const notas = extractNotas(valorRaw);
    const hasNota = notas.length > 0;
    const isSim = valor.startsWith("S") || valor.startsWith("SIM");
    const isNao =
      valor.startsWith("N") ||
      valor.startsWith("NAO") ||
      valor.startsWith("NÃO");

    if (isSim && !hasNota) resultadoFormatado.simSemNota.push(zona);
    else if (isNao && !hasNota) resultadoFormatado.naoSemNota.push(zona);
    else if (isSim && hasNota) {
      notas.forEach((n) => {
        if (!resultadoFormatado.simComNota[n])
          resultadoFormatado.simComNota[n] = [];
        resultadoFormatado.simComNota[n].push(zona);
      });
    } else if (isNao && hasNota) {
      notas.forEach((n) => {
        if (!resultadoFormatado.naoComNota[n])
          resultadoFormatado.naoComNota[n] = [];
        resultadoFormatado.naoComNota[n].push(zona);
      });
    }
  });

  return resultadoFormatado;
};

/**
 * Obtém as Condições de Instalação (Parâmetros urbanísticos por Uso) para um Uso específico
 */
export const getCondicoesInstalacao = (
  codigoTipologiaOuGrupo: string,
  parametrosUsoData: ParametrosUrbanisticosPorUso[],
): CondicaoInstalacao[] => {
  if (!parametrosUsoData || !parametrosUsoData.length) return [];

  const possibleKeys = [
    "subcategoriaUsoGruposAtividadeUsosEspecificos",
    "subcategoria de uso, grupos de atividade e usos específicos",
  ];
  const keyIdentifier =
    Object.keys(parametrosUsoData[0]).find(
      (k) =>
        possibleKeys.includes(k.toLowerCase().trim()) ||
        k.toLowerCase().includes("tipologia") ||
        k.toLowerCase().includes("grupo"),
    ) || Object.keys(parametrosUsoData[0])[0];

  const regra = parametrosUsoData.find(
    (r) =>
      r[keyIdentifier] &&
      String(r[keyIdentifier]).trim().toLowerCase() ===
        String(codigoTipologiaOuGrupo).trim().toLowerCase(),
  );
  if (!regra) return [];

  const condicoes: CondicaoInstalacao[] = [];

  Object.keys(regra).forEach((parametro) => {
    if (parametro === keyIdentifier || !parametro) return;

    const valorRaw = String(regra[parametro] || "");
    if (!valorRaw) return;

    const notas = extractNotas(valorRaw);

    // Remove as notas do valor para exibição mais limpa
    let valorLimpo = valorRaw;
    notas.forEach((n) => {
      valorLimpo = valorLimpo.replace(n, "");
    });
    valorLimpo = valorLimpo.trim();

    condicoes.push({
      parametro,
      valor: valorLimpo,
      notas,
    });
  });

  return condicoes;
};
