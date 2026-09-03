import { UsoLPUOS, CnaePorAtividade, UsoPermitidoPorZona, PesquisaUsoResult, RegraZonamento, UsoHierarchy, CondicaoInstalacao, ParametrosUrbanisticosPorUso } from "./types";
/**
 * Normaliza string removendo acentos e deixando minúscula
 */
export declare const normalizeString: (str: string) => string;
/**
 * Extrai o texto da nota da tabela de metadados.
 * Nas tabelas da Urbis, as notas (ex: (4 - d)) geralmente podem ser cruzadas com a base de dados em algum lugar,
 * ou são explícitas nos cabeçalhos.
 */
export declare const extractNotas: (valorRaw: string) => string[];
/**
 * Busca a árvore completa de hierarquia de um uso a partir das planilhas
 */
export declare const buildUsoHierarchy: (codigo: string, todosUsos: UsoLPUOS[]) => UsoHierarchy;
/**
 * Realiza a pesquisa de usos no sistema
 */
export declare const pesquisarUsos: (termo: string, usosData: UsoLPUOS[], cnaeData: CnaePorAtividade[], modo?: "atividade" | "cnae") => PesquisaUsoResult;
/**
 * Obtém regras de zonas e notas para uma Tipologia / Grupo de Atividade
 */
export declare const getRegrasZonamento: (codigoTipologiaOuGrupo: string, usosPorZonaData: UsoPermitidoPorZona[]) => RegraZonamento | null;
/**
 * Obtém as Condições de Instalação (Parâmetros urbanísticos por Uso) para um Uso específico
 */
export declare const getCondicoesInstalacao: (codigoTipologiaOuGrupo: string, parametrosUsoData: ParametrosUrbanisticosPorUso[]) => CondicaoInstalacao[];
//# sourceMappingURL=use-logic.d.ts.map