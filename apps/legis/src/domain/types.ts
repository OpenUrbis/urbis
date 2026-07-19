// Existing types are mostly good, but we need to expand for the Editor requirements
// Specifically about text extraction and synchronization

export type NormativeType =
  | 'ACAUT' | 'ACO' | 'ACIV' | 'ACP' | 'ADC' | 'ADI' | 'ADO' | 'AP' | 'ARE' | 'AGINT'
  | 'APCIV' | 'ADPF' | 'A' | 'ADINTERPRET' | 'CIRC' | 'CN' | 'COMPIL' | 'COM' | 'COMCONJ'
  | 'C' | 'D' | 'DLEG' | 'DL' | 'DELIB' | 'DESPADM' | 'DESPADMINTLOC' | 'DESPNOR' | 'INDIC'
  | 'INFOR' | 'INSTR' | 'INSTRSERV' | 'IN' | 'INCONJ' | 'L' | 'LC' | 'LO' | 'MI' | 'MS'
  | 'MAN' | 'MEMO' | 'MEMOCIRC' | 'MENVET' | 'MD' | 'MNT' | 'MPORT' | 'MPL' | 'MRES' | 'NT'
  | 'NOTTEC' | 'NOTTECCONJ' | 'OF' | 'OFCIRC' | 'OS' | 'OI' | 'OICONJ' | 'OICONJINTER'
  | 'OJ' | 'ON' | 'PAR' | 'PARNOR' | 'PORT' | 'PORTCONJ' | 'PORTINTER' | 'POP' | 'PEC'
  | 'PELO' | 'PL' | 'PLC' | 'PROMULGVET' | 'PRON' | 'PSV' | 'PUBL' | 'RAZVET' | 'REC'
  | 'RESP' | 'RE' | 'REGINT' | 'RES' | 'RESCONJ' | 'RESINTER' | 'SUMADM' | 'SUMJUD'
  | 'SUMVIN' | 'TUTPROV';

export type ElementType =
  | 'Anexo' | 'Parte' | 'Livro' | 'Título' | 'Capítulo' | 'Seção' | 'Subseção'
  | 'Divisão desconforme' | 'Artigo' | 'Parágrafo' | 'Inciso' | 'Alínea'
  | 'Item' | 'Elemento desconforme' | 'Tabela' | 'Figura' | 'Mapa' | 'Nota'
  | 'Introdução de decisão judicial' | 'Ementa de decisão judicial'
  | 'Decisão judicial completa' | 'Texto';

export interface Authority {
  id: string;
  complementFull?: string;
  complementAbbr?: string;
  commonRefFull: string; // (*)
  commonRefAbbr: string; // (*)
  startDate: string; // (*)
  endDate?: string;
  pageId?: string;
}

export interface Validity {
  date: string; // Format: DD.MM.YYYY or "vigência condicionada"
  deviceId: string;
  trechos?: { start: number; end: number }[];
  normativeElementId?: string;
}

export interface TableCell {
  rowId: string;
  colId: string;
  text: string;
  rowSpan?: number;
  colSpan?: number;
}

export interface TableRow {
  id: string;
  type: 'Cabeçalho' | 'Corpo';
  index: number;
}

export interface TableCol {
  id: string;
  type: 'Cabeçalho' | 'Corpo';
  index: number;
}

export interface TableData {
  rows: TableRow[];
  cols: TableCol[];
  cells: TableCell[];
  footer?: string; // Optional footer/source
}

export interface FigureData {
  url: string;
  resolution?: { width: number; height: number };
}

export interface MapFile {
  name: string;
  url: string;
}

export interface MapData {
  files?: MapFile[]; // Arquivos para download (PDF, KML)
  screen?: { url: string; resolution?: { width: number; height: number } }; // Imagem para tela
  minimap?: { // Configuração do minimapa (Mapa.Urbis)
    lat: number;
    lng: number;
    zoom: number;
    layers: string[];
  };
}

export interface NoteData {
  targetElementId: string; // Can be rowId:colId for table cells
}

export interface SpecialSituation {
  type: 
    | 'Vigência inicial alterada' 
    | 'Vigência final alterada' 
    | 'Veto' 
    | 'Derrubada de veto'
    | 'Renumeração' 
    | 'Nova redação' 
    | 'Perda definitiva de vigor/eficácia' 
    | 'Suspensão de vigor/eficácia'
    | 'Revogação'
    | 'Anulação'
    | 'Cassação'
    | 'Restauração de vigor/eficácia'
    | 'Interpretação conforme à Constituição'
    | 'Declaração de inconstitucionalidade sem redução de texto'
    | 'Acréscimo'
    | 'Repristinação'
    | 'Alteração de ementa'; 
  
  date?: string; 
  dispositivo?: string; // Device text string, e.g. "Art. 1º da Lei X"
  relatedDeviceId?: string; // ID of the normative element causing the situation (ID de Elemento normativo)
  
    // Affected segments in the target element
    trechos?: { start: number; end: number }[]; 

    // Used for "Alterações de ementa" and "Derrubada de veto" where we need to point to specific parts of the source text
    sourceTrechos?: { start: number; end: number }[]; 
    
    // Specific Fields (Legacy Support)
    sourceSegments?: { start: number; end: number; changedText?: string }[];
    targetSegments?: { start: number; end: number; changedText?: string }[];
    device?: string;
    normativeElementId?: string;
  
  // Alteração de ementa, Nova redação, Interpretações constitucionais, Acréscimos, Repristinação (se parcial)
  newText?: string; // Texto alterado / Texto acrescido / Texto com interpretação / Texto com vigor restaurado
  newTextTrechos?: { start: number; end: number }[]; // Trechos do novo texto (fonte)

  // Veto
  vetoText?: string; // Texto vetado (if partial)
  
  // Derrubada de veto
  vetoOverturnedText?: string; // Texto com veto derrubado

  // Renumeração
  newIndex?: string;
  newType?: ElementType;

  // Extinções / Retiradas de vigor (if partial)
  revokedText?: string; // Texto sem vigor/eficácia
}

export interface NormativeElement {
  id: string;
  type: ElementType;
  index?: string; // e.g. "1º", "I", "a"
  text: string;
  parentId?: string;
  
  // Validity
  originalStartValidity: Validity;
  originalEndValidity?: Validity; // Optional end date
  
  // Special Situations (Veto, Renumbering, Redaction, etc.)
  specialSituations: SpecialSituation[];
  
  // Linguagem Simples Support
  simplifiedText?: string; // Explicação em linguagem cidadã
  technicalTerms?: { term: string; explanation: string }[]; // Glossário local
  
  // Specific data for complex types
  tableData?: TableData;
  figureData?: FigureData;
  mapData?: MapData;
  noteData?: NoteData[]; // Linked notes/footnotes
  
  // Attachments (Anexos) - Link to external files or internal structure
  attachmentId?: string; 
  content?: any;
}

export interface OriginalNormativo {
  id: string;
  type: 'original_normativo';
  normativeType: NormativeType;
  number?: string;
  actDate?: string;
  publicationDate?: string;
  authorityId: string;
  ementa: string;
  name?: string;
  preamble?: string;
  signature?: string;
  sources?: { url: string; name?: string }[];
  elements: NormativeElement[];
  originalEndValidity?: Validity; // Optional end date for the whole document
  alteracoesEmenta?: SpecialSituation[];
  ementaAlterations?: SpecialSituation[]; // Alias for legacy code
  editorContent?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CollectionLink {
    resourceId: string;
    resourceType: 'original_normativo' | 'page';
    linkedElements?: { elementId: string; segments?: any[] }[];
}

export interface ColetaneaTematica {
    id: string;
    type: 'coletanea_tematica';
    title: string;
    collectionType: 'Exigências' | 'Competências' | 'Definições' | 'Fontes de Informação';
    category: string;
    theme: string;
    shortDescription?: string;
    fullDescription?: string; // JSON content string
    links: CollectionLink[];
    createdAt: string;
    updatedAt: string;
}

// Utility type for "Keys" display logic
export interface ElementKey {
  prefix: string;
  suffix: string;
  text: string;
}
