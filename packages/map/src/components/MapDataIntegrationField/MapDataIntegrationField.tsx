import React, { useState, useCallback, useEffect } from 'react';
import { UploadCloud, CheckCircle2, Loader2, AlertCircle, FileText, Info } from 'lucide-react';
import { Button } from '@open-urbis/map-ui/ui/button';
import { uploadAndProcessDwg, checkJobStatus } from '../../services/mapDataMockService';
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

export function MapDataIntegrationField({
  mode,
  initialData,
  onChange,
}: MapDataIntegrationFieldProps) {
  const auth = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [data, setData] = useState<any>(initialData || null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressText, setProgressText] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (initialData) {
      setData(initialData);
    }
  }, [initialData]);

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (mode !== 'edit' || isProcessing) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      handleFileSelection(droppedFile);
    }
  }, [mode, isProcessing]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const handleFileSelection = async (selectedFile: File) => {
    if (!selectedFile.name.toLowerCase().endsWith('.dwg')) {
      setError('Por favor, envie apenas arquivos .dwg');
      return;
    }
    
    setFile(selectedFile);
    setError(null);
    setIsProcessing(true);
    setProgressText('Transferindo o arquivo para os servidores da Prefeitura...');
    
    try {
      console.log('1. Solicitando URL de upload para a S3...');
      // 1. Get Signed URL
      const environment = import.meta.env.VITE_API_URL || "https://api.mapa.urbis.sampa.br";
      let headers = {
        "Content-Type": "application/json",
        "x-api-key": "secret",
      };
      
      const signedUrlResponse = await axios.post(`https://api.mapa.urbis.sampa.br/files/upload-url`, {
        contentType: "image/vnd.dwg",
        folderPath: ""
      }, { headers });
      
      const { uploadURL, key } = signedUrlResponse.data;
      console.log('URL de upload gerada:', { key });

      setProgressText('Enviando arquivo para a nuvem...');
      console.log('2. Fazendo o upload do arquivo para a S3...');
      
      // 2. Upload file to S3
      await fetch(uploadURL, {
        method: 'PUT',
        body: selectedFile,
        headers: {
          'Content-Type': "image/vnd.dwg",
        }
      });
      console.log('Upload para S3 concluído com sucesso!');

      setProgressText('Analisando parâmetros urbanísticos e feições geográficas...');
      
      // 3. Solicitar processamento na API real
      console.log('3. Solicitando processamento do DWG na MapData (via proxy)...', { key });
      console.log(key.replace('/uploads', ''));
      await axios.post(`${environment}/maps/mapdata/file/${encodeURIComponent(key)}`, {}, { headers: { ...headers, Authorization: auth.user?.access_token ? `Bearer ${auth.user.access_token}` : undefined } });
      
      // 4. Polling do status do processamento a cada 10 segundos
      console.log('4. Iniciando polling de status...');
      const pollInterval = setInterval(async () => {
        try {
          const statusResponse = await axios.get(`${environment}/maps/mapdata/file/${encodeURIComponent(key)}`, { headers: { ...headers, Authorization: auth.user?.access_token ? `Bearer ${auth.user.access_token}` : undefined } });
          const mapDataResponse = statusResponse.data;
          console.log('Status MapData:', mapDataResponse);

          // Ajuste essas condições dependendo de como a API da MapData retorna o status de fato.
          // Baseado na documentação de mock, assumimos que quando está pronto, os dados do arquivo vêm na resposta.
          // Se "status" === "Processado" / "Finalizado" (Ajustar de acordo com a doc real)
          if (mapDataResponse.status === 'Concluido' || mapDataResponse.status === 'Sucesso' || (mapDataResponse.data && mapDataResponse.status !== 'Solicitado')) {
            clearInterval(pollInterval);
            setIsProcessing(false);
            
            // Assume que os dados reais vêm em mapDataResponse.data ou mapDataResponse
            const extractedData = mapDataResponse.data || mapDataResponse;

            // Add the S3 key to the response data to show in JSON
            const finalData = {
              ...extractedData,
              s3_metadata: { key, uploaded_at: new Date().toISOString() }
            };
            
            setData(finalData);
            if (onChange) {
              onChange(finalData);
            }
            console.log('Processamento concluído. JSON final:', finalData);
          } else if (mapDataResponse.status === 'Erro' || mapDataResponse.status === 'Falha') {
            clearInterval(pollInterval);
            setIsProcessing(false);
            setError(`Falha no processamento do arquivo: ${mapDataResponse.description || 'Erro desconhecido'}`);
            console.error('Falha no processamento do arquivo.', mapDataResponse);
          }
        } catch (err) {
          clearInterval(pollInterval);
          setIsProcessing(false);
          setError('Erro de conexão ao verificar o status no proxy.');
          console.error('Erro de conexão ao verificar o status.', err);
        }
      }, 10000);
    } catch (err) {
      setIsProcessing(false);
      setError('Erro ao enviar o arquivo.');
      console.error('Erro geral no fluxo de upload:', err);
    }
  };

  const resetState = () => {
    setFile(null);
    setData(null);
    setError(null);
    setIsProcessing(false);
    if (onChange) {
      onChange(null);
    }
  };

  // View Mode or when Data is present
  if (mode === 'view' || (data && !isProcessing)) {
    
    // Extract geometry to display on MapPreview
    const featureCollection = parseDataToFeatureCollection(data);
    const mainGeometryRaw = data?.fundiário?.['imóvel de análise (espacial)']?.geometria || data?.fundiário?.['imóvel real']?.geometria;
    const mainGeometry = featureCollection?.features?.[0]?.geometry || mainGeometryRaw;

    return (
      <div className="w-full flex flex-col gap-2 h-full">
        <div className="flex items-center justify-between mb-2 shrink-0">
          <div className="flex items-center gap-2 text-emerald-600 font-medium text-sm">
            <CheckCircle2 size={16} />
            <span>Análise validada pelo <strong>Urbis Verifica</strong></span>
          </div>
          {mode === 'edit' && (
            <Button variant="outline" size="sm" onClick={resetState}>
              Submeter novo projeto
            </Button>
          )}
        </div>
        
        <div className="flex flex-col lg:flex-row gap-4 w-full">
          {/* Structured View */}
          <div className="w-full lg:w-[420px] flex-shrink-0 flex flex-col overflow-hidden">
            <MapDataStructuredView data={data} />
          </div>
          
          {/* Map View */}
          <div className="flex-1 relative rounded-md overflow-hidden border border-slate-200 shadow-sm">
            {featureCollection ? (
              <MapPreview
                featureCollection={featureCollection}
                mainGeometry={mainGeometry}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 bg-slate-50">
                Geometria não encontrada
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Edit Mode - Processing State
  if (isProcessing) {
    return (
      <div className="w-full border-2 border-dashed border-blue-200 rounded-lg p-8 bg-blue-50/50 flex flex-col items-center justify-center gap-4 min-h-[250px] transition-all">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
        <div className="text-center space-y-1">
          <p className="text-blue-700 font-medium text-lg">O Urbis Verifica está processando seu projeto</p>
          <p className="text-blue-500/80 text-sm">{progressText}</p>
        </div>
        <p className="text-xs text-slate-500 mt-2 text-center max-w-[380px]">
          Nossos algoritmos estão realizando o escrutínio do arquivo DWG conforme a legislação municipal. A tela será atualizada automaticamente em instantes.
        </p>
      </div>
    );
  }

  // Edit Mode - Default Upload State
  return (
    <div className="w-full flex flex-col gap-2">
      <div
        className={`relative w-full border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center gap-4 min-h-[250px] transition-colors cursor-pointer
          ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'}
          ${error ? 'border-red-400 bg-red-50' : ''}
        `}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <input 
          type="file" 
          accept=".dwg"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onChange={handleFileChange}
        />
        
        {error ? (
          <div className="flex flex-col items-center text-red-500 gap-2">
            <AlertCircle size={40} />
            <p className="font-medium text-center">{error}</p>
            <p className="text-sm text-red-400">Clique ou arraste novamente para tentar</p>
          </div>
        ) : (
          <div className="flex flex-col items-center text-slate-500 gap-3">
            <div className="p-4 bg-white rounded-full shadow-sm border border-slate-100">
              <UploadCloud size={32} className="text-slate-400" />
            </div>
            <div className="text-center space-y-1">
              <p className="font-medium text-slate-700">Arraste seu projeto padrão Prefeitura (.dwg) para cá</p>
              <p className="text-sm">ou clique para selecionar o arquivo no seu computador</p>
            </div>
            <div className="mt-2 flex gap-3">
              <Button 
                variant="outline" 
                size="sm" 
                className="text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100 relative z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  // Aqui iria o link da documentação real de como montar o DWG
                  alert("Abrindo manual técnico do Urbis Verifica...");
                }}
              >
                <FileText size={14} className="mr-2" />
                Como formatar o .dwg
              </Button>
            </div>
            <p className="text-[11px] text-slate-400 max-w-[400px] text-center mt-2">
              <Info size={12} className="inline mr-1 mb-[2px]" />
              O <strong>Urbis Verifica</strong> extrairá as pranchas, quadros de áreas e polígonos automaticamente para o processo de licenciamento digital.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
