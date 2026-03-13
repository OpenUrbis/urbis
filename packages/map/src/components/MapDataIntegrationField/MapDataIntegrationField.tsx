import React, { useState, useEffect } from 'react';
import { UploadCloud, CheckCircle2, Loader2 } from 'lucide-react';
import { Button, cn } from '@open-urbis/map-ui';
import axios from 'axios';
import { useAuth } from '@open-urbis/map-auth';
import { MapDataStructuredView } from './components/MapDataStructuredView';
import { MapPreview } from './components/MapPreview';
import { parseDataToFeatureCollection } from './utils/parseDataToFeatureCollection';

export interface MapDataIntegrationFieldProps {
  mode: 'view' | 'edit';
  initialData?: any;
  onChange?: (data: any) => void;
}

/**
 * MapDataIntegrationField - VERSÃO FINAL ESTÁVEL.
 * Ajustada para Dark Mode e Layout Industrial.
 */
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@open-urbis/map-ui';
import { FeatureModalView } from './components/MapDataStructuredView';

export function MapDataIntegrationField({
  mode,
  initialData,
  onChange,
}: MapDataIntegrationFieldProps) {
  const auth = useAuth();
  const [data, setData] = useState<any>(initialData || null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressText, setProgressText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // State for feature properties modal
  const [selectedFeature, setSelectedFeature] = useState<any | null>(null);

  useEffect(() => {
    if (initialData) setData(initialData);
  }, [initialData]);

  useEffect(() => {
    const handleOpenFeatureModal = (event: any) => {
      if (event.detail) {
        setSelectedFeature(event.detail);
      }
    };
    
    window.addEventListener('openFeatureModal', handleOpenFeatureModal);
    return () => window.removeEventListener('openFeatureModal', handleOpenFeatureModal);
  }, []);

  const handleFileSelection = async (selectedFile: File) => {
    if (!selectedFile.name.toLowerCase().endsWith('.dwg')) {
      setError('Por favor, envie apenas arquivos .dwg');
      return;
    }
    setIsProcessing(true);
    setProgressText('Processando arquivo...');
    
    try {
      const environment = import.meta.env.VITE_API_URL || "https://api.mapa.urbis.sampa.br";
      const { data: { uploadURL, key } } = await axios.post(`${environment}/files/upload-url`, {
        contentType: "image/vnd.dwg",
        folderPath: ""
      }, { headers: { Authorization: auth.user?.access_token ? `Bearer ${auth.user.access_token}` : undefined } });

      await fetch(uploadURL, { method: 'PUT', body: selectedFile, headers: { 'Content-Type': "image/vnd.dwg" } });
      await axios.post(`${environment}/maps/mapdata/file/${encodeURIComponent(key)}`, {}, { headers: { Authorization: auth.user?.access_token ? `Bearer ${auth.user.access_token}` : undefined } });
      
      const poll = setInterval(async () => {
        try {
          const { data: mapData } = await axios.get(`${environment}/maps/mapdata/file/${encodeURIComponent(key)}`, { headers: { Authorization: auth.user?.access_token ? `Bearer ${auth.user.access_token}` : undefined } });
          if (mapData.status === 'Concluido' || mapData.data) {
            clearInterval(poll);
            const final = { ...(mapData.data || mapData), s3_metadata: { key } };
            setData(final);
            setIsProcessing(false);
            if (onChange) onChange(final);
          }
        } catch (e) { clearInterval(poll); setIsProcessing(false); }
      }, 5000);
    } catch (err) { setIsProcessing(false); setError('Erro no envio.'); }
  };

  if (isProcessing) {
    return (
      <div className="w-full h-[400px] py-4 border-2 border-dashed border-blue-500/20 dark:border-blue-500/20 rounded-2xl bg-blue-500/5 dark:bg-blue-500/5 flex flex-col items-center justify-center gap-4 transition-colors">
        <Loader2 className="w-10 h-10 text-blue-600 dark:text-blue-500 animate-spin" />
        <p className="text-sm font-normal text-blue-600 dark:text-blue-500">{progressText}</p>
      </div>
    );
  }

  if (data) {
    const featureCollection = parseDataToFeatureCollection(data);
    const mainGeometry = featureCollection?.features?.[0]?.geometry;

    return (
      <div className="w-full flex flex-col gap-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-500 font-bold text-xs uppercase tracking-tighter transition-colors">
            <CheckCircle2 size={16} /> Leitura inteligente de dados projetuais
          </div>
          {mode === 'edit' && <Button variant="ghost" size="sm" className="text-xs uppercase font-black" onClick={() => setData(null)}>Novo Projeto</Button>}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 h-[600px] w-full border rounded-2xl overflow-hidden bg-white dark:bg-zinc-950 shadow-sm dark:shadow-zinc-950/40 border-gray-200 dark:border-zinc-800 transition-colors">
          {/* Lado Esquerdo: MAPA */}
          <div className="relative border-r border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900 min-h-[300px] md:min-h-0 transition-colors">
            {featureCollection ? (
              <MapPreview featureCollection={featureCollection} mainGeometry={mainGeometry} />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400 dark:text-zinc-500 italic text-xs bg-gray-50 dark:bg-zinc-900 transition-colors">Sem geometria</div>
            )}
          </div>

          {/* Lado Direito: DADOS */}
          <div className="h-full flex flex-col overflow-hidden min-h-[300px] md:min-h-0 bg-white dark:bg-zinc-950 transition-colors">
            <MapDataStructuredView data={data} />
          </div>
        </div>

        {/* Modal for feature properties */}
        <Dialog open={!!selectedFeature} onOpenChange={(open) => !open && setSelectedFeature(null)}>
          <DialogContent className="max-w-2xl bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 p-0 overflow-hidden transition-colors">
            <DialogHeader className="p-4 border-b border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900 m-0 transition-colors">
              <DialogTitle className="text-gray-900 dark:text-zinc-100 uppercase tracking-tighter text-sm transition-colors">
                Detalhes: {selectedFeature?.name || selectedFeature?.type || 'Elemento'}
              </DialogTitle>
            </DialogHeader>
            <div className="max-h-[70vh] overflow-y-auto">
              {selectedFeature && (
                <FeatureModalView 
                  data={selectedFeature.rawMetadata ? JSON.parse(selectedFeature.rawMetadata) : selectedFeature} 
                  title={selectedFeature.type === 'bloco' ? 'Bloco - visão geral' : (selectedFeature.type === 'pavimento' ? 'Pavimento - visão detalhada' : (selectedFeature.type === 'area_individual' ? 'Área individual ou comum - visão detalhada' : (selectedFeature.name || selectedFeature.type || 'Propriedades')))} 
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "w-full h-[400px] px-4 py-4 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-colors cursor-pointer",
        isDragging ? "border-blue-500 dark:border-blue-500 bg-blue-50 dark:bg-blue-500/10" : "border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-950 hover:bg-gray-100 dark:hover:bg-zinc-900"
      )}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files?.[0]) handleFileSelection(e.dataTransfer.files[0]); }}
      onClick={() => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.dwg';
        input.onchange = (e: any) => { if (e.target.files?.[0]) handleFileSelection(e.target.files[0]); };
        input.click();
      }}
    >
      <div className="p-6 bg-white dark:bg-zinc-900 rounded-full shadow-sm dark:shadow-zinc-950/40 mb-4 border border-gray-200 dark:border-zinc-800 transition-colors">
        <UploadCloud size={40} className="text-blue-600 dark:text-blue-500" />
      </div>
      <h4 className="text-sm font-bold text-gray-900 dark:text-zinc-100 transition-colors">Arraste seu projeto .DWG</h4>
      <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1 transition-colors">ou clique para selecionar</p>
      {error && <p className="mt-4 text-xs text-rose-600 dark:text-rose-500 font-bold bg-rose-50 dark:bg-rose-500/10 px-3 py-2 rounded-full border border-rose-200 dark:border-rose-500/20 transition-colors">{error}</p>}
    </div>
  );
}
