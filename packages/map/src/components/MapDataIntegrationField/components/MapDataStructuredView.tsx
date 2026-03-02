import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Map, Building2, Trees, ParkingSquare, Calculator, Search, AlertTriangle, Route } from 'lucide-react';
import { cn } from '@open-urbis/map-ui';

interface MapDataStructuredViewProps {
  data: any;
}

export function MapDataStructuredView({ data }: MapDataStructuredViewProps) {
  if (!data) return null;

  return (
    <div className="flex flex-col gap-4 text-sm w-full h-full overflow-y-auto p-4 custom-scrollbar bg-transparent">
      <FundiarioSection fundiario={data.fundiário} />
      <CalcadasSection calcadas={data.calcadas} />
      <BlocosSection blocos={data.blocos} />
      <OutrosSection data={data} />
    </div>
  );
}

// --- SECTIONS ---

function FundiarioSection({ fundiario }: { fundiario: any }) {
  if (!fundiario) return null;

  const real = fundiario['imóvel real'];
  const escritura = fundiario['imóvel escritura'];
  const diferenca = fundiario['diferença entre real e matrícula']?.differenceArea;
  const analise = fundiario['imóvel de análise (espacial)'];

  const formatNumber = (val: any, decimals: number) => 
    typeof val === 'number' ? val.toFixed(decimals) : '-';

  const formatDiferenca = (val: any) => {
    if (typeof val !== 'number') return '-';
    if (Math.abs(val) < 0.0001) return '0 m²';
    return `${val.toFixed(4)} m²`;
  };

  return (
    <Card title="1. Fundiário" icon={<Map size={18} />}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <DataBox label="Área Real" value={`${formatNumber(real?.area, 2)} m²`} highlight />
        <DataBox label="Área Escritura" value={`${formatNumber(escritura?.area, 2)} m²`} />
      </div>
      <div className="space-y-3 text-xs">
        <div className="flex justify-between items-center py-2 border-b border-slate-100">
          <span className="text-slate-500 font-medium">Diferença Real vs Matrícula</span>
          <span className={cn("font-bold", Math.abs(diferenca) > 1 ? "text-red-500" : "text-emerald-600")}>
            {formatDiferenca(diferenca)}
          </span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-slate-100">
          <span className="text-slate-500 font-medium">Imóvel de Análise (Área)</span>
          <span className="font-semibold text-slate-700">{formatNumber(analise?.area, 2)} m²</span>
        </div>
      </div>
    </Card>
  );
}

function CalcadasSection({ calcadas }: { calcadas: any[] }) {
  if (!calcadas || !Array.isArray(calcadas) || calcadas.length === 0) return null;

  return (
    <Card title={`2. Calçadas (${calcadas.length})`} icon={<Route size={18} />}>
      <div className="space-y-4">
        {calcadas.map((calcada, idx) => {
          const acessos = calcada.AcessosVeiculos || [];
          return (
            <div key={idx} className="bg-slate-100/50 p-3 rounded border border-slate-200">
              <h5 className="font-semibold text-slate-700 mb-2">Calçada {idx + 1}</h5>
              <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                <div className="flex flex-col">
                  <span className="text-slate-500">Rampa em Faixa de Passeio</span>
                  <span className={calcada.ExisteRampaInCalcadaFaixaPasseio ? "text-red-500 font-medium" : "text-emerald-600"}>
                    {calcada.ExisteRampaInCalcadaFaixaPasseio ? 'Sim' : 'Não'}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-slate-500">Poste em Acesso Veículo</span>
                  <span className={calcada.ExistePosteInAcessoVeiculo ? "text-red-500 font-medium" : "text-emerald-600"}>
                    {calcada.ExistePosteInAcessoVeiculo ? 'Sim' : 'Não'}
                  </span>
                </div>
              </div>
              
              {acessos.length > 0 && (
                <div className="mt-3">
                  <span className="text-xs font-semibold text-slate-600 mb-1 block">Acessos de Veículos ({acessos.length})</span>
                  <div className="max-h-32 overflow-y-auto border rounded bg-white">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 sticky top-0">
                        <tr>
                          <th className="px-2 py-1 font-medium text-slate-500 border-b">Num</th>
                          <th className="px-2 py-1 font-medium text-slate-500 border-b">Coords (Aprox)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {acessos.map((acesso: any, aidx: number) => {
                          let firstCoord = acesso.geometry?.coordinates?.[0];
                          // handle malformed MultiPolygon/Polygon arrays
                          while (Array.isArray(firstCoord) && Array.isArray(firstCoord[0])) {
                            firstCoord = firstCoord[0];
                          }
                          return (
                            <tr key={aidx} className="hover:bg-slate-50">
                              <td className="px-2 py-1.5 font-medium">{acesso.numeracao || aidx + 1}</td>
                              <td className="px-2 py-1.5 text-slate-500 truncate max-w-[150px]">
                                {Array.isArray(firstCoord) && typeof firstCoord[0] === 'number' && typeof firstCoord[1] === 'number' 
                                  ? `${firstCoord[0].toFixed(2)}, ${firstCoord[1].toFixed(2)}` 
                                  : '-'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function BlocosSection({ blocos }: { blocos: any[] }) {
  if (!blocos || !Array.isArray(blocos) || blocos.length === 0) return null;

  return (
    <Card title={`3. Blocos e Edificações (${blocos.length})`} icon={<Building2 size={18} />}>
      <div className="space-y-4">
        {blocos.map((bloco, idx) => {
          const pavimentos = bloco.pavimentos || [];
          const terreo = pavimentos.find((p: any) => p.identificacao?.valor === 'T' || p.nome === 'pavimento');
          const areasIndividuais = terreo?.areas_individuais?.valor || [];
          
          return (
            <div key={idx} className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="bg-slate-100 px-4 py-3 flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-slate-800 flex items-center gap-2">
                    {bloco.nome_do_bloco?.valor || `Bloco ${idx + 1}`}
                    <span className="bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded font-bold">
                      {bloco.identificacao?.valor}
                    </span>
                  </h4>
                  <span className="text-xs text-slate-500">
                    Usos: {bloco.usos?.valor?.map((u: any) => u.nome).join(', ')}
                  </span>
                </div>
              </div>
              
              <div className="p-4 space-y-4 bg-white">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <DataBox small label="Altitude Térreo" value={`${typeof bloco.altitude_do_pavimento_terreo?.valor === 'number' ? (bloco.altitude_do_pavimento_terreo.valor / 100).toFixed(2) : '-'} m`} />
                  <DataBox small label="Altitude Máxima" value={`${typeof bloco.altitude_maxima?.valor === 'number' ? (bloco.altitude_maxima.valor / 100).toFixed(2) : '-'} m`} />
                  <DataBox small label="Gabarito Máx" value={`${typeof bloco.gabarito_altura_maxima?.valor === 'number' ? (bloco.gabarito_altura_maxima.valor / 100).toFixed(2) : '-'} m`} />
                  <DataBox small label="Área Ocupada" value={`${typeof bloco.area_ocupada?.area?.valor === 'number' ? bloco.area_ocupada.area.valor.toFixed(2) : '-'} m²`} />
                </div>

                {areasIndividuais.length > 0 && (
                  <div className="mt-4">
                    <h5 className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">Áreas Individuais ({areasIndividuais.length})</h5>
                    <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-md">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50 sticky top-0 shadow-sm">
                          <tr>
                            <th className="px-3 py-2 font-semibold text-slate-600 border-b">Cód</th>
                            <th className="px-3 py-2 font-semibold text-slate-600 border-b text-right">Área (m²)</th>
                            <th className="px-3 py-2 font-semibold text-slate-600 border-b">Uso</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {areasIndividuais.map((ai: any, aiIdx: number) => (
                            <tr key={aiIdx} className="hover:bg-blue-50/50 transition-colors">
                              <td className="px-3 py-1.5 font-medium text-slate-700">{ai.identificação || '-'}</td>
                              <td className="px-3 py-1.5 text-right font-mono">
                                {typeof ai.area?.valor === 'number' ? ai.area.valor.toFixed(2) : '-'}
                              </td>
                              <td className="px-3 py-1.5 text-slate-500">{ai.uso || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function OutrosSection({ data }: { data: any }) {
  const formatNumber = (val: any, decimals: number) => 
    typeof val === 'number' ? val.toFixed(decimals) : '-';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {data.computabilidade && (
        <Card title="4. Computabilidade" icon={<Calculator size={18} />}>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Áreas Computáveis Totais</span>
              <span className="font-semibold">{formatNumber(data.computabilidade.areas_edificadas_computaveis_totais?.valor, 4)}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-500 font-medium">Coef. de Aproveitamento</span>
              <span className="font-semibold">{formatNumber(data.computabilidade.coeficiente_de_aproveitamento?.valor, 4)}</span>
            </div>
          </div>
        </Card>
      )}

      {data.estacionamento && (
        <Card title="5. Estacionamento" icon={<ParkingSquare size={18} />}>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Circulação</span>
              <span className="font-semibold">{formatNumber(data.estacionamento.circulação?.valor, 2)} m²</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-500 font-medium">Vagas de Automóvel</span>
              <span className="font-semibold">{data.estacionamento['vagas de automóvel']?.valor || 0}</span>
            </div>
          </div>
        </Card>
      )}

      {data['macicos arboreos'] && (
        <Card title="6. Maciços Arbóreos" icon={<Trees size={18} />}>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Área do Maciço</span>
              <span className="font-semibold text-amber-600">{formatNumber(data['macicos arboreos'].area_do_macico?.valor, 2)} m²</span>
            </div>
          </div>
        </Card>
      )}

      <Card title="7. Sobreposições" icon={<AlertTriangle size={18} />}>
        <div className="space-y-3 text-xs">
          <div className="flex justify-between items-center py-1 border-b border-slate-100">
            <span className="text-slate-500 font-medium">Áreas fora das ocupações</span>
            <span className={cn("font-bold", data['há sobreposição de áreas fora das ocupações absolutas dos blocos']?.ha_sobreposicao_de_areas_fora_das_ocupacoes_absolutas_dos_blocos?.valor ? "text-red-500" : "text-emerald-600")}>
              {data['há sobreposição de áreas fora das ocupações absolutas dos blocos']?.ha_sobreposicao_de_areas_fora_das_ocupacoes_absolutas_dos_blocos?.valor ? 'Sim' : 'Não'}
            </span>
          </div>
          <div className="flex justify-between items-center py-1">
            <span className="text-slate-500 font-medium">Cobertura sem uso fora</span>
            <span className={cn("font-bold", data['há cobertura sem uso fora das ocupações absolutas dos blocos']?.ha_cobertura_sem_uso_fora_das_ocupacoes_absolutas_dos_blocos?.valor ? "text-red-500" : "text-emerald-600")}>
              {data['há cobertura sem uso fora das ocupações absolutas dos blocos']?.ha_cobertura_sem_uso_fora_das_ocupacoes_absolutas_dos_blocos?.valor ? 'Sim' : 'Não'}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}

// --- UI HELPERS ---

function Card({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(true);
  
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden transition-all">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-slate-50/50 hover:bg-slate-100 flex items-center justify-between border-b border-slate-100 transition-colors"
      >
        <h4 className="font-bold text-slate-700 flex items-center gap-2">
          {icon && <span className="text-blue-500">{icon}</span>}
          {title}
        </h4>
        {isOpen ? <ChevronDown size={18} className="text-slate-400" /> : <ChevronRight size={18} className="text-slate-400" />}
      </button>
      {isOpen && (
        <div className="p-4 animate-in fade-in slide-in-from-top-2 duration-200">
          {children}
        </div>
      )}
    </div>
  );
}

function DataBox({ label, value, highlight = false, small = false }: { label: string; value: string; highlight?: boolean; small?: boolean }) {
  return (
    <div className={cn(
      "flex flex-col rounded-lg border",
      highlight ? "bg-blue-50/50 border-blue-100" : "bg-slate-50/50 border-slate-100",
      small ? "p-2" : "p-3"
    )}>
      <span className={cn("text-slate-500 font-medium mb-1", small ? "text-[10px] uppercase tracking-wider" : "text-xs")}>{label}</span>
      <span className={cn("font-bold text-slate-800", small ? "text-sm" : "text-lg")}>{value}</span>
    </div>
  );
}
