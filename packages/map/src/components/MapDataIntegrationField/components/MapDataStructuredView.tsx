import React from 'react';
import * as Accordion from '@radix-ui/react-accordion';
import { 
  ChevronRight, 
  X as Cross2Icon, 
  Check as CheckIcon, 
  Globe as GlobeIcon,
  MinusCircle as ValueNoneIcon,
  Database,
  Hash,
  Copy,
  Info,
  Terminal
} from 'lucide-react';
import { cn, ScrollArea, Badge, Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@open-urbis/map-ui';
import { unwrapDwgData } from '../utils/dwg-unwrap';

interface MapDataStructuredViewProps {
  data: any;
}

/**
 * MapDataStructuredView - VERSÃO FINAL ESTÁVEL.
 * Foco total em extração de nomes amigáveis e eliminação de redundâncias.
 */
export function MapDataStructuredView({ data }: MapDataStructuredViewProps) {
  if (!data) return <div className="p-10 text-center text-gray-400 dark:text-zinc-500 italic text-xs">Aguardando processamento...</div>;

  const rawData = React.useMemo(() => unwrapDwgData(data), [data]);
  const principal = rawData.dados?.[0]?.value || rawData.value || rawData;

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-0 text-sm w-full h-full overflow-hidden bg-white dark:bg-zinc-950 font-sans border-l border-gray-200 dark:border-zinc-800 transition-colors">
        <div className="p-4 border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex justify-between items-center shrink-0 transition-colors">
          <div className="flex items-center gap-2">
            <Database size={14} className="text-blue-600 dark:text-blue-500" />
            <h3 className="font-bold text-xs text-gray-900 dark:text-zinc-100 transition-colors">Ficha de parâmetros do Projeto</h3>
          </div>
        </div>
        <ScrollArea className="flex-1 bg-white dark:bg-zinc-950 transition-colors">
          <div className="p-0 pb-10 bg-white dark:bg-zinc-950 transition-colors">
            <Accordion.Root type="multiple" className="w-full bg-white dark:bg-zinc-950 transition-colors">
              <JsonNode label="Diagnóstico" value={principal} path="root" isRoot depth={0} />
            </Accordion.Root>
          </div>
        </ScrollArea>
      </div>
    </TooltipProvider>
  );
}

export function FeatureModalView({ data, title }: { data: any, title?: string }) {
  if (!data) return null;

  const principal = unwrapDwgData(data);

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-0 text-sm w-full h-full overflow-hidden bg-white dark:bg-zinc-950 font-sans transition-colors">
        <ScrollArea className="flex-1 bg-white dark:bg-zinc-950 max-h-[60vh] transition-colors">
          <div className="p-0 pb-6 bg-white dark:bg-zinc-950 transition-colors">
            <Accordion.Root type="multiple" className="w-full bg-white dark:bg-zinc-950 transition-colors" defaultValue={['root']}>
              <JsonNode label={title || "Detalhes"} value={principal} path="root" isRoot depth={0} />
            </Accordion.Root>
          </div>
        </ScrollArea>
      </div>
    </TooltipProvider>
  );
}

interface JsonNodeProps {
  label: string;
  value: any;
  path?: string;
  isRoot?: boolean;
  depth: number;
}

function JsonNode({ label, value, path = '', isRoot = false, depth }: JsonNodeProps) {
  const [copied, setCopied] = React.useState(false);
  
  // 1. Lógica de Consolidação de Nome e Valor
  let effectiveLabel = formatLabel(label);
  let effectiveValue = value;

  const hasNome = value && typeof value === 'object' && !Array.isArray(value) && (value.nome || value.name);
  const hasValor = value && typeof value === 'object' && !Array.isArray(value) && (value.valor !== undefined || value.value !== undefined);

  if (hasNome && hasValor && Object.keys(value).length <= 3) {
    effectiveLabel = formatLabel(String(value.nome || value.name));
    effectiveValue = value.valor !== undefined ? value.valor : value.value;
  } else if (hasNome && !isRoot) {
    effectiveLabel = formatLabel(String(value.nome || value.name));
  }

  const nodeId = path || label;

  // 2. Geometrias
  if (effectiveValue && typeof effectiveValue === 'object' && !Array.isArray(effectiveValue) && effectiveValue.type && (effectiveValue.type === 'Polygon' || effectiveValue.type === 'Point' || effectiveValue.type === 'MultiPolygon')) {
    const handleCopy = (e: React.MouseEvent) => {
      e.stopPropagation();
      navigator.clipboard.writeText(JSON.stringify(effectiveValue, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    return (
      <div 
        className="flex items-center justify-between gap-2 py-2 px-4 bg-blue-50 dark:bg-blue-500/10 border-b border-gray-200 dark:border-zinc-800 transition-colors"
        style={{ paddingLeft: `${(depth + 1) * 12}px` }}
      >
        <div className="flex items-center gap-2">
          <GlobeIcon size={12} className="text-blue-600 dark:text-blue-500" />
          <span className="text-xs font-medium text-gray-700 dark:text-zinc-300">{effectiveLabel}</span>
          <Badge variant="outline" className="text-[10px] h-4 lowercase font-normal border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400">{effectiveValue.type}</Badge>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <ParamInfo path={path} />
          <button onClick={handleCopy} className="text-gray-400 dark:text-zinc-500 hover:text-blue-600 dark:hover:text-blue-500 px-1 transition-colors">
            {copied ? <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-500 lowercase">copiado</span> : <Copy size={12} />}
          </button>
        </div>
      </div>
    );
  }

  // 3. Valores Primitivos (Linha da Tabela)
  if (
    typeof effectiveValue === 'string' ||
    typeof effectiveValue === 'number' ||
    typeof effectiveValue === 'boolean' ||
    effectiveValue === null ||
    effectiveValue === undefined
  ) {
    let displayValue = effectiveValue;
    let colorClass = 'text-gray-900 dark:text-zinc-100';

    if (typeof effectiveValue === 'number') {
      displayValue = effectiveValue.toLocaleString('pt-BR', { minimumFractionDigits: effectiveValue % 1 !== 0 ? 2 : 0 });
      colorClass = 'text-blue-600 dark:text-blue-500 font-mono';
    } else if (typeof effectiveValue === 'boolean') {
      displayValue = effectiveValue ? 'sim' : 'não';
      colorClass = effectiveValue ? 'text-emerald-600 dark:text-emerald-500 font-bold' : 'text-rose-600 dark:text-rose-500 font-bold';
    } else {
      displayValue = effectiveValue || 'n/d';
      if (!effectiveValue) colorClass = 'text-gray-400 dark:text-zinc-500 italic';
    }

    return (
      <div 
        className="grid grid-cols-[1fr_auto] gap-4 py-3 px-4 border-b border-gray-200 dark:border-zinc-800 last:border-b-0 odd:bg-gray-50 dark:odd:bg-zinc-900/50 transition-colors hover:bg-gray-100 dark:hover:bg-zinc-800"
        style={{ paddingLeft: `${(depth + 1) * 12}px` }}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="text-xs font-medium text-gray-600 dark:text-zinc-400 truncate">{effectiveLabel}</span>
          <ParamInfo path={path} />
        </div>
        <span className={cn('text-xs text-right font-medium', colorClass)}>{String(displayValue)}</span>
      </div>
    );
  }

  // 4. Arrays ou Objetos Complexos
  const keys = Object.keys(effectiveValue).filter(k => 
    k !== 'geometria' && k !== 'geometry' && k !== 'coordinates' && 
    k !== 'nome' && k !== 'name' && k !== 'valor' && k !== 'value'
  );

  const isArray = Array.isArray(effectiveValue);
  
  if (keys.length === 0 && !isArray) {
    return (
      <div 
        className="grid grid-cols-[1fr_auto] gap-4 py-3 px-4 border-b border-gray-200 dark:border-zinc-800 last:border-b-0 odd:bg-gray-50 dark:odd:bg-zinc-900/50 transition-colors hover:bg-gray-100 dark:hover:bg-zinc-800"
        style={{ paddingLeft: `${(depth + 1) * 12}px` }}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="text-xs font-medium text-gray-600 dark:text-zinc-400 truncate">{effectiveLabel}</span>
          <ParamInfo path={path} />
        </div>
        <span className="text-xs text-right font-medium text-gray-400 dark:text-zinc-500 italic">n/d</span>
      </div>
    );
  }

  // Se for array vazio, também mostramos que não há itens de forma amigável
  if (isArray && effectiveValue.length === 0) {
    return (
      <div 
        className="flex py-3 px-4 border-b border-gray-200 dark:border-zinc-800 last:border-b-0 odd:bg-gray-50 dark:odd:bg-zinc-900/50 transition-colors hover:bg-gray-100 dark:hover:bg-zinc-800"
        style={{ paddingLeft: `${(depth + 1) * 12}px` }}
      >
        <div className="flex items-center gap-2 overflow-hidden w-full">
          <ValueNoneIcon size={12} className="text-gray-400 dark:text-zinc-500 shrink-0" />
          <span className="text-xs font-medium text-gray-500 dark:text-zinc-400 break-words whitespace-normal">{effectiveLabel} <span className="text-[10px] italic font-normal">(vazio)</span></span>
          <ParamInfo path={path} />
        </div>
      </div>
    );
  }

  const children = isArray
    ? effectiveValue.map((item: any, idx: number) => {
        let itemLabel = item.nome || item.name || item.identificacao?.valor || `item ${idx + 1}`;
        
        // Se houver múltiplos itens e eles tiverem nome/name (provavelmente repetido ou genérico), adicionamos o índice para facilitar identificação
        if ((item.nome || item.name) && effectiveValue.length > 1) {
           itemLabel = `${itemLabel} (${idx + 1})`;
        }

        return <JsonNode key={idx} label={itemLabel} value={item} path={`${path}[${idx}]`} depth={depth + 1} />;
      })
    : keys.map((key) => {
        const itemValue = effectiveValue[key];
        const subLabel = (itemValue?.nome && typeof itemValue.nome === 'string') ? itemValue.nome : key;
        return <JsonNode key={key} label={subLabel} value={itemValue} path={`${path}.${key}`} depth={depth + 1} />;
      });

  return (
    <Accordion.Item value={nodeId} className="border-none bg-transparent">
      <Accordion.Header className="flex bg-transparent">
        <Accordion.Trigger 
          className={cn(
            "group flex flex-1 items-center justify-between py-3 px-4 text-left transition-all border-b border-gray-200 dark:border-zinc-800",
            isRoot ? "bg-white dark:bg-zinc-950" : "bg-gray-50 dark:bg-zinc-900"
          )}
          style={{ paddingLeft: `${depth * 12 + 16}px` }}
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <ChevronRight size={14} className="text-gray-400 dark:text-zinc-500 transition-transform duration-300 group-data-[state=open]:rotate-90 shrink-0" />
            <span className={cn(
              "font-bold tracking-tight truncate",
              isRoot ? "text-xs text-blue-600 dark:text-blue-500" : "text-xs text-gray-700 dark:text-zinc-300"
            )}>
              {effectiveLabel}
            </span>
            <ParamInfo path={path} />
          </div>
          {Array.isArray(effectiveValue) && effectiveValue.length > 0 && (
            <span className="text-[10px] text-gray-500 dark:text-zinc-400 italic shrink-0">{effectiveValue.length} itens</span>
          )}
        </Accordion.Trigger>
      </Accordion.Header>
      <Accordion.Content className="overflow-hidden animate-in fade-in slide-in-from-left-1 duration-200 bg-transparent">
        <div className="border-l-2 border-gray-200 dark:border-zinc-800 bg-transparent transition-colors">
          <TooltipProvider>
            {children}
          </TooltipProvider>
        </div>
      </Accordion.Content>
    </Accordion.Item>
  );
}

function ParamInfo({ path }: { path: string }) {
  if (!path || path === 'root') return null;
  return (
    <Tooltip delayDuration={0}>
      <TooltipTrigger asChild>
        <button className="text-gray-400 hover:text-blue-600 dark:text-zinc-500 dark:hover:text-blue-500 shrink-0 px-1 transition-colors">
          <Terminal size={10} />
        </button>
      </TooltipTrigger>
      <TooltipContent side="right" className="bg-gray-900 dark:bg-zinc-800 text-white border-none text-[10px] font-mono p-2 rounded-lg shadow-md max-w-[250px] break-all z-[100] transition-colors">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-black uppercase text-gray-400 dark:text-zinc-500">Caminho da propriedade:</span>
          <span className="text-yellow-400 dark:text-yellow-500">{path.replace('root.', '')}</span>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

function formatLabel(label: string): string {
  if (!label) return '';
  if (label === 'root' || label === 'Projeto') return label;

  // Don't format if it already has spaces (it's already readable)
  if (label.includes(' ')) {
     return label.charAt(0).toUpperCase() + label.slice(1);
  }

  // Convert CamelCase and snake_case to Space Case
  // We only add spaces before uppercase letters if they are preceded by lowercase letters
  const clean = label
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .trim();

  return clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
}
