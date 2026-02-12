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
}

export interface Validity {
  date: string; // Format: DD.MM.YYYY or "vigência condicionada"
  deviceId: string;
  trechos?: { start: number; end: number }[];
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

export interface MapData {
  files: { name: string; url: string }[]; // Arquivos para download (PDF, KML)
  screen: { url: string; resolution?: { width: number; height: number } }; // Imagem para tela
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
    | 'Renumeração' 
    | 'Nova redação' 
    | 'Perda definitiva de vigor/eficácia' 
    | 'Suspensão de vigor/eficácia'
    | 'Alteração de ementa'; // Adicionado conforme doc
  
  date?: string; // Data da situação (ex: publicação da norma alteradora)
  relatedDeviceId?: string; // ID do dispositivo na norma alteradora
  
  // Trechos afetados (índice de palavras conforme doc)
  trechos?: { start: number; end: number }[]; 
  
  // Veto
  vetoText?: string; 
  
  // Renumeração
  newIndex?: string;
  newType?: ElementType;
  
  // Nova Redação / Alteração de Ementa
  newText?: string; 
  newTextTrechos?: { start: number; end: number }[]; // Trechos do novo texto (fonte)
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
  specialSituations?: SpecialSituation[];
  
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
}

export interface NormativeOriginal {
  id: string;
  type: NormativeType;
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
}

// Utility type for "Keys" display logic
export interface ElementKey {
  prefix: string;
  suffix: string;
  text: string;
}
