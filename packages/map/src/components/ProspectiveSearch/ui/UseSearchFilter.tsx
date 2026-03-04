import React, { useState } from 'react';
import { UsoSearchResultItem } from '../utils/types';
import { Search, X, HelpCircle, Loader2 } from 'lucide-react';
import { Input, Tabs, TabsList, TabsTrigger } from '@open-urbis/map-ui';
import axios from 'axios';
import { getAuthHeaders } from '../../../utils/auth-headers';

interface UseSearchFilterProps {
  useSearchTerm: string;
  setUseSearchTerm: (term: string) => void;
  searchMode: 'atividade' | 'cnae' | 'cnpj';
  setSearchMode: (mode: 'atividade' | 'cnae' | 'cnpj') => void;
  searchResults: any;
  onSelectUse: (use: UsoSearchResultItem) => void;
  selectedUse: UsoSearchResultItem | null;
  clearSelection: () => void;
  cnaeData: any[];
}

export function UseSearchFilter({
  useSearchTerm,
  setUseSearchTerm,
  searchMode,
  setSearchMode,
  searchResults,
  onSelectUse,
  selectedUse,
  clearSelection,
  cnaeData
}: UseSearchFilterProps) {

  const [cnpjData, setCnpjData] = useState<any>(null);
  const [activeCnpj, setActiveCnpj] = useState<any>(null);
  const [isCnpjLoading, setIsCnpjLoading] = useState(false);
  const [cnpjError, setCnpjError] = useState<string | null>(null);
  const [selectedCnaeIndex, setSelectedCnaeIndex] = useState<number | null>(null);

  const formatCnaeString = (rawCode: string) => {
    // rawCode usually comes as 7 digits without punctuation from API: 6201501
    // We want to map it to our internal cnaeData which has "Subclasses (CNAE 2.2)" like "6201-5/01"
    if (!rawCode) return '';
    const normalizedRaw = String(rawCode).replace(/\D/g, '');
    const cnaeMatch = cnaeData?.find(c => {
      const subclassesField = c['subclassesCnae2.2'] || c['Subclasses (CNAE 2.2)'];
      if (!subclassesField) return false;
      return String(subclassesField).replace(/\D/g, '') === normalizedRaw;
    });

    if (cnaeMatch) {
      const code = cnaeMatch['subclassesCnae2.2'] || cnaeMatch['Subclasses (CNAE 2.2)'];
      const desc = cnaeMatch['denominacaoCnae2.2'] || cnaeMatch['Denominação (CNAE 2.2)'];
      return `${code} – ${desc}`;
    }

    // Fallback format if not found in data: XXXX-X/XX
    if (normalizedRaw.length === 7) {
      return `${normalizedRaw.substring(0,4)}-${normalizedRaw.substring(4,5)}/${normalizedRaw.substring(5,7)}`;
    }
    return rawCode;
  };

  const fetchCnpjData = async (cnpj: string) => {
    if (!cnpj || cnpj.replace(/\D/g, '').length < 14) return;
    setIsCnpjLoading(true);
    setCnpjError(null);
    setCnpjData(null);
    setSelectedCnaeIndex(null);
    try {
      const headers = await getAuthHeaders();
      const environment = (import.meta.env.VITE_API_URL || "/api") + "/maps";
      const cleanCnpj = cnpj.replace(/\D/g, '');
      const response = await axios.get(`${environment}/open-cnpj/${cleanCnpj}`, { headers });
      
      const rawData = response.data;
      
      // Transform raw CNAEs into formatted strings using cnaeData
      const formattedData = {
        ...rawData,
        cnae_principal_formatted: rawData.cnae_principal ? formatCnaeString(rawData.cnae_principal) : null,
        cnaes_secundarios_formatted: (rawData.cnaes_secundarios || []).map((code: string) => formatCnaeString(code))
      };

      setCnpjData(formattedData);
    } catch (error: any) {
      console.error(error);
      setCnpjError(error.response?.data?.message || 'Erro ao buscar o CNPJ.');
    } finally {
      setIsCnpjLoading(false);
    }
  };

  const handleCnpjSelect = (cnaeCode: string, index: number) => {
    setSelectedCnaeIndex(index);
    setActiveCnpj(cnpjData);
    // Extrai os números do CNAE e usa na pesquisa CNAE
    const cleanCnae = cnaeCode.split(' ')[0].trim();
    setSearchMode('cnae');
    setUseSearchTerm(cleanCnae);
  };

  const getVal = (obj: any, keys: string[]) => {
    if (!obj) return '';
    const foundKey = Object.keys(obj).find(k =>
      keys.some(key => key.toLowerCase() === k.trim().toLowerCase())
    );
    return foundKey ? obj[foundKey] : '';
  };

  const DIVISAO_COLORS: Record<string, string> = {
    'Categoria de uso': 'bg-purple-500',
    'Subcategoria de uso': 'bg-blue-500',
    'Tipologia': 'bg-emerald-500',
    'Grupo de atividades': 'bg-emerald-500',
    'Atividade': 'bg-amber-500',
    'Subtipologia': 'bg-amber-500',
  };

  if (selectedUse) {
    const { item, arvore } = selectedUse;
    const codigo = getVal(item, ['Código', 'Codigo', 'codigo']);
    const divisao = getVal(item, ['Divisão', 'Divisao', 'divisao']);
    const descricao = getVal(item, ['Descrição', 'descricao']);

    const hierarchy = [
      { label: 'Categoria', code: getVal(arvore.categoria, ['Código', 'Codigo']), text: getVal(arvore.categoria, ['Descrição', 'descricao']) },
      { label: 'Subcategoria', code: getVal(arvore.subcategoria, ['Código', 'Codigo']), text: getVal(arvore.subcategoria, ['Descrição', 'descricao']) },
      { label: 'Grupo / Tipologia', code: getVal(arvore.tipologiaOuGrupo, ['Código', 'Codigo']), text: getVal(arvore.tipologiaOuGrupo, ['Descrição', 'descricao']) },
    ].filter(h => h.text || h.code);

    return (
      <div className="bg-background rounded-2xl border border-border p-4 shadow-sm animate-in fade-in zoom-in-95 duration-300 relative overflow-hidden">
        <div className={`absolute top-0 left-0 w-1 h-full ${DIVISAO_COLORS[divisao] || 'bg-muted'}`} />

        <div className="flex items-start justify-between mb-4">
          <div className="flex flex-col gap-3 w-full">
            {activeCnpj && (
              <div className="flex flex-col gap-1 p-2.5 bg-primary/5 border border-primary/20 rounded-xl mr-6">
                <span className="text-[9px] font-bold text-primary uppercase tracking-tight">Empresa selecionada (CNPJ)</span>
                <span className="text-[11px] font-semibold text-foreground leading-tight line-clamp-2">
                  {activeCnpj.cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5")} - {activeCnpj.razao_social || activeCnpj.nome_fantasia}
                </span>
              </div>
            )}
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center text-[10px] font-medium bg-foreground text-background px-2 py-1 rounded-md">
                  {codigo}
                </span>
                <span className="text-[11px] font-medium text-foreground">{divisao}</span>
              </div>
              <h3 className="text-[14px] font-medium text-foreground leading-tight pr-6">
                {descricao}
              </h3>
            </div>
          </div>
          <button
            onClick={() => {
              clearSelection();
              setActiveCnpj(null);
            }}
            className="absolute top-4 right-4 p-1 hover:bg-accent rounded-md text-muted-foreground transition-all active:scale-95 shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-medium text-muted-foreground">Linhagem e contexto</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <div className="grid grid-cols-1 gap-2">
            {hierarchy.map((h, i) => (
              <div key={i} className="flex flex-col gap-1 p-3 bg-muted/30 border border-border rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-medium text-foreground">{h.label}</span>
                  {h.code && (
                    <span className="text-[10px] font-medium text-foreground bg-background px-2 py-0 rounded border border-border">
                      {h.code}
                    </span>
                  )}
                </div>
                <span className="text-[11px] font-normal text-muted-foreground leading-normal">{h.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const highlightTerm = (text: string, term: string) => {
    if (!term) return text;
    const parts = text.split(new RegExp(`(${term})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === term.toLowerCase()
        ? <span key={i} className="text-foreground font-medium underline underline-offset-2">{part}</span>
        : part
    );
  };

  return (
    <div className="flex flex-col gap-3 relative w-full z-50">
      <Tabs
        value={searchMode}
        onValueChange={(v) => setSearchMode(v as 'atividade' | 'cnae' | 'cnpj')}
        className="w-full"
      >
        <TabsList className="w-full bg-muted h-10 p-1 rounded-xl">
          <TabsTrigger
            value="atividade"
            className="flex-1 text-xs font-medium rounded-lg transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
          >
            Atividade
          </TabsTrigger>
          <TabsTrigger
            value="cnae"
            className="flex-1 text-xs font-medium rounded-lg transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
          >
            CNAE
          </TabsTrigger>
          <TabsTrigger
            value="cnpj"
            className="flex-1 text-xs font-medium rounded-lg transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
          >
            Exemplo CNPJ
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {searchMode !== 'cnpj' && (
        <button
          onClick={() => setSearchMode('cnpj')}
          className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground hover:text-primary transition-colors ml-1"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          Não sei atividade ou CNPJ
        </button>
      )}

      {searchMode === 'cnpj' && (
        <div className="bg-primary/5 border border-primary/20 p-3 rounded-xl mb-1">
          <p className="text-xs font-medium text-foreground leading-relaxed">
            Pesquise pelos CNAEs da sua empresa através do CNPJ.
          </p>
          <a href="https://opencnpj.org" target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline mt-1 inline-block">
            Clique aqui e saiba mais sobre como encontrar sua atividade ou CNAE
          </a>
        </div>
      )}

      <div className="relative w-full flex items-center group">
        <Input
          placeholder={
            searchMode === 'atividade' ? "Pesquise por código ou descrição..." : 
            searchMode === 'cnae' ? "Digite o código CNAE (ex: 8531-7/00)..." :
            "Digite o CNPJ da empresa..."
          }
          value={useSearchTerm}
          onChange={(e) => setUseSearchTerm(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && searchMode === 'cnpj') {
              fetchCnpjData(useSearchTerm);
            }
          }}
          className="h-10 w-full rounded-2xl bg-background border-border focus:ring-primary/20 transition-all font-medium text-sm shadow-sm pr-10 pl-4 text-foreground placeholder:text-muted-foreground"
        />
        {searchMode === 'cnpj' ? (
          <button 
            onClick={() => fetchCnpjData(useSearchTerm)}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-primary text-primary-foreground rounded-lg flex items-center justify-center hover:bg-primary/90 transition-colors"
          >
            {isCnpjLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
          </button>
        ) : (
          <div className="absolute right-4 text-muted-foreground group-focus-within:text-foreground transition-colors pointer-events-none">
            <Search className="h-4 w-4" />
          </div>
        )}
      </div>

      {searchMode === 'cnpj' && cnpjError && (
        <div className="text-rose-500 text-xs font-medium px-2">{cnpjError}</div>
      )}

      {searchMode === 'cnpj' && cnpjData && (
        <div className="self-stretch pr-1 inline-flex flex-col justify-start items-start gap-3 mt-2 bg-background border border-border p-4 rounded-2xl shadow-sm">
          <div className="self-stretch flex flex-col justify-start items-start">
            <div className="self-stretch text-muted-foreground text-[10px] font-bold uppercase leading-4 line-clamp-1 mb-1">
              Empresa encontrada
            </div>
            <div className="self-stretch p-1.5 inline-flex items-center gap-2 bg-muted/30 rounded-lg">
              <div className="flex-1 opacity-90 text-foreground text-xs font-semibold leading-4 line-clamp-2">
                {cnpjData.razao_social || cnpjData.nome_fantasia || "Sem nome"}
              </div>
            </div>
          </div>

          {cnpjData.cnae_principal_formatted && (
            <div className="self-stretch flex flex-col justify-start items-start">
              <div className="self-stretch text-muted-foreground text-[10px] font-bold uppercase leading-4 line-clamp-1 mb-1">
                CNAE Principal
              </div>
              <button 
                onClick={() => handleCnpjSelect(cnpjData.cnae_principal_formatted, -1)}
                className={`self-stretch p-2 inline-flex items-center gap-2 rounded-lg text-left transition-colors border ${selectedCnaeIndex === -1 ? 'border-primary bg-primary/5' : 'border-transparent hover:bg-muted'}`}
              >
                <div className={`w-4 h-4 rounded-xl flex justify-center items-center shrink-0 border ${selectedCnaeIndex === -1 ? 'bg-primary border-primary' : 'border-slate-300 dark:border-slate-600'}`}>
                  {selectedCnaeIndex === -1 && <div className="w-2 h-2 bg-primary-foreground rounded-full" />}
                </div>
                <div className="flex-1 text-foreground text-xs font-normal leading-tight">
                  {cnpjData.cnae_principal_formatted}
                </div>
              </button>
            </div>
          )}

          {cnpjData.cnaes_secundarios_formatted && cnpjData.cnaes_secundarios_formatted.length > 0 && (
            <div className="self-stretch flex flex-col justify-start items-start">
              <div className="self-stretch text-muted-foreground text-[10px] font-bold uppercase leading-4 line-clamp-1 mb-1">
                CNAEs Secundários
              </div>
              <div className="flex flex-col w-full gap-1">
                {cnpjData.cnaes_secundarios_formatted.map((cnae: string, idx: number) => (
                  <button 
                    key={idx}
                    onClick={() => handleCnpjSelect(cnae, idx)}
                    className={`self-stretch p-2 inline-flex items-center gap-2 rounded-lg text-left transition-colors border ${selectedCnaeIndex === idx ? 'border-primary bg-primary/5' : 'border-transparent hover:bg-muted'}`}
                  >
                    <div className={`w-4 h-4 rounded-xl flex justify-center items-center shrink-0 border ${selectedCnaeIndex === idx ? 'bg-primary border-primary' : 'border-slate-300 dark:border-slate-600'}`}>
                      {selectedCnaeIndex === idx && <div className="w-2 h-2 bg-primary-foreground rounded-full" />}
                    </div>
                    <div className="flex-1 text-foreground text-xs font-normal leading-tight">
                      {cnae}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {searchResults && searchResults.resultados.length === 0 && searchMode === 'cnae' && useSearchTerm.length >= 2 && (
        <div className="absolute top-full mt-2 left-0 right-0 z-1000 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 p-4 rounded-xl shadow-lg animate-in fade-in slide-in-from-top-2 duration-300" style={{ zIndex: 1000, position: 'relative' }}>
          <p className="text-[12px] text-amber-800 dark:text-amber-200 font-medium leading-relaxed italic">
            Não há correspondência entre o CNAE pesquisado e as Atividades ou Grupos de Atividades do Decreto nº 57.398/2016.
            <span className="block mt-1 font-normal opacity-80">Pesquise diretamente pela Atividade ou Grupo de Atividades pretendido.</span>
          </p>
        </div>
      )}

      {searchResults && searchResults.resultados.length > 0 && (
        <div className="absolute top-full mt-1 left-0 right-0 z-[100] bg-background border border-border rounded-2xl shadow-xl overflow-hidden max-h-[400px] overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="divide-y divide-border">
            {searchResults.resultados.map((resultado: any, idx: number) => {
              const { item, arvore, cnaeOriginario } = resultado;
              const codigo = getVal(item, ['Código', 'Codigo', 'codigo']);
              const descricao = getVal(item, ['Descrição', 'Descricao', 'descricao']);
              const divisao = getVal(item, ['Divisão', 'Divisao', 'divisao']);

              const breadcrumbs = [
                { label: 'Categoria', text: getVal(arvore?.categoria, ['Descrição', 'descricao']) },
                { label: 'Subcategoria', text: getVal(arvore?.subcategoria, ['Descrição', 'descricao']) },
                { label: 'Grupo', text: getVal(arvore?.tipologiaOuGrupo, ['Descrição', 'descricao']) }
              ].filter(b => b.text);

              return (
                <button
                  key={idx}
                  className="w-full text-left px-4 py-2 hover:bg-muted focus:bg-muted focus:outline-none transition-all flex flex-col gap-1"
                  onClick={() => onSelectUse(resultado)}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-medium text-foreground bg-muted px-2 py-0 rounded border border-border leading-none">{codigo}</span>
                    <span className="text-[10px] font-medium text-foreground leading-none">{divisao}</span>
                    {searchMode === 'cnae' && cnaeOriginario && (
                      <span className="text-[9px] font-medium text-primary bg-primary/5 px-1.5 py-0.5 rounded ml-auto">CNAE: {getVal(cnaeOriginario, ['subclassesCnae2.2', 'Subclasses (CNAE 2.2)'])}</span>
                    )}
                  </div>

                  <p className="text-[12px] text-foreground font-medium leading-snug">
                    {highlightTerm(descricao, useSearchTerm)}
                    {searchMode === 'cnae' && cnaeOriginario && (
                      <span className="block text-[11px] text-muted-foreground mt-0.5 italic">
                        {getVal(cnaeOriginario, ['denominacaoCnae2.2', 'Denominação (CNAE 2.2)'])}
                      </span>
                    )}
                  </p>

                  {searchMode === 'atividade' && breadcrumbs.length > 0 && (
                    <div className="flex flex-wrap gap-x-2 mt-1 overflow-hidden">
                      {breadcrumbs.map((b, i) => (
                        <div key={i} className="flex items-center gap-1 shrink-0">
                          <span className="text-[10px] text-foreground font-medium">{b.label}:</span>
                          <span className="text-[11px] text-muted-foreground font-normal italic leading-none">{b.text}</span>
                          {i < breadcrumbs.length - 1 && <span className="text-border ml-1">/</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
