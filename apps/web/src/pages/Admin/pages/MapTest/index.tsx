import { MapPicker, FeaturesView, PolygonDetails, usePolygonEditContext, useMapContext } from "@open-urbis/map";
import { Button } from "@/components/ui/button";
import { useState, useCallback, useMemo } from "react";
import { MapActionToolbar } from "./MapActionToolbar";

const EXAMPLE_DATA = {
    editFeature: {
        type: "Feature",
        properties: {},
        geometry: {
            type: "Polygon",
            coordinates: [
                [
                    [-46.656551, -23.561573],
                    [-46.656551, -23.562573],
                    [-46.655551, -23.562573],
                    [-46.655551, -23.561573],
                    [-46.656551, -23.561573]
                ]
            ]
        }
    }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const MapResultContent = ({ value, onClose, hideActions = false }: { value: any, onClose: () => void, hideActions?: boolean }) => {
    const { editFeatureTemplate, layerWithRootEditTemplate, editFeature: startEditing } = usePolygonEditContext();
    const { layerSchemas } = useMapContext();

    const rootTemplate = useMemo(() => {
        if (!layerWithRootEditTemplate.value) return [];
        const layer = layerSchemas.value.find(l => l.id === layerWithRootEditTemplate.value);
        return layer?.viewTemplate || [];
    }, [layerSchemas.value, layerWithRootEditTemplate.value]);

    const handleEdit = () => {
        if (!value) return;
        // Logic to switch to editing mode
        // Assuming value.features[0] is the feature to edit if in selection mode
        const featureToEdit = value.type === 'selection' ? value.features?.[0]?.feature : value.editFeature;
        if (featureToEdit) {
            // Close the result view temporarily if needed, or update internal state to show editing
            // Here we trigger the edit action in context
            startEditing(featureToEdit);
            onClose(); // Close result to show map with edit controls
        }
    };

    return (
        <div className="absolute inset-0 bg-background flex flex-col animate-in fade-in duration-300 pointer-events-auto">
            <div className="w-full h-full flex flex-col p-6">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Ficha do imovel</h2>
                    <p className="text-sm text-muted-foreground mb-2">Verifique os dados abaixo para prosseguir com o protocolo.</p>
                </div>

                {!hideActions && (
                    <MapActionToolbar
                        onChangeSelection={value.type === 'edit' || value.type === 'digital' ? onClose : undefined}
                        onEdit={value.type === 'selection' ? handleEdit : undefined}
                        onPrint={() => window.print()}
                        className="mt-4"
                    />
                )}

                <div className="flex-1 overflow-y-auto bg-card border rounded-xl shadow-sm">
                    <div className="p-6">
                        {!value ? (
                            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                                <span className="material-symbols-outlined text-4xl mb-4 opacity-50">data_object</span>
                                <p className="font-medium">Nenhum dado selecionado</p>
                            </div>
                        ) : value.editFeature && value.loading ? (
                            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                                <span className="material-symbols-outlined text-4xl mb-4 animate-spin">progress_activity</span>
                                <p className="font-medium">Carregando dados do imovel...</p>
                            </div>
                        ) : value.editFeature && editFeatureTemplate.value ? (
                            <PolygonDetails
                                template={editFeatureTemplate.value}
                                rootTemplate={rootTemplate}
                            />
                        ) : value.editFeature && !editFeatureTemplate.value ? (
                             <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                                <span className="material-symbols-outlined text-4xl mb-4 animate-spin">progress_activity</span>
                                <p className="font-medium">Carregando formulário...</p>
                            </div>
                        ) : value.type === 'selection' && value.features?.[0] ? (
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold">Dados da Seleção</h3>
                                <FeaturesView feature={value.features[0]} />
                                {/* Fallback/Debug View if FeaturesView returns null/empty */}
                                <div className="mt-4 p-4 bg-muted/50 rounded-lg text-xs font-mono hidden">
                                    <p className="font-bold mb-2">Debug Data:</p>
                                    <pre className="overflow-auto max-h-40">{JSON.stringify(value.features[0], null, 2)}</pre>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                                <span className="material-symbols-outlined text-4xl mb-4 opacity-50">data_object</span>
                                <p className="font-medium">Dados brutos do perímetro</p>
                                <pre className="mt-4 p-4 bg-muted rounded-lg text-xs font-mono text-left w-full max-w-2xl overflow-auto">
                                    {JSON.stringify(value, null, 2)}
                                </pre>
                            </div>
                        )}
                    </div>
                </div>

                {!hideActions && (
                    <div className="mt-6 flex justify-end items-center gap-4">
                        <span className="text-sm text-muted-foreground">
                            Ao protocolar, este perímetro será vinculado ao seu processo.
                        </span>
                        <Button
                            onClick={() => {
                                console.log("Confirmar e Protocolar action for value:", value);
                                alert("Protocolo iniciado com sucesso!\n\nDados selecionados/editados disponíveis no console.");
                            }}
                            size="lg"
                            className="px-8 shadow-lg"
                        >
                            Confirmar e Protocolar
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};

const MapTestPage = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [value, setValue] = useState<any>(null);
    const [showResult, setShowResult] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [initialData, setInitialData] = useState<any>();
    const [pickerKey, setPickerKey] = useState(0);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [lastIntersections, setLastIntersections] = useState<any>(null);
    const [lastSelectionId, setLastSelectionId] = useState<string | null>(null);
    const [customJson, setCustomJson] = useState<string>("");

    const loadExample = () => {
        setInitialData(EXAMPLE_DATA);
        setPickerKey(k => k + 1);
        setValue(null);
        setShowResult(true); // Open immediately when loading an example
    };

    const loadCustom = () => {
        try {
            const data = JSON.parse(customJson);
            setInitialData(data);
            setPickerKey(k => k + 1);
            setValue(null);
            setShowResult(true); // Open immediately when loading custom data
        } catch (e) {
            alert("JSON inválido");
        }
    };

    const reset = () => {
        setInitialData(null);
        setPickerKey(k => k + 1);
        setValue(null);
        setShowResult(false);
    };

    const handleMapChange = useCallback((v: any) => {
        setValue(v);
        console.log("MapPicker onChange value:", v.selectedFeatures?.length);
        if(v.selectedFeatures && v.selectedFeatures?.length > 0 ) {
            setShowResult(true);
            
        }
        // Auto-open result when intersections are updated (e.g. after Save)
        if (v?.intersections && v.intersections !== lastIntersections) {
            setLastIntersections(v.intersections);
            alert('Carregou intersessoes');
            setShowResult(true);
        }
        
        // Auto-open result when loading initial data for editing
        if ((v?.type === 'edit' || v?.type === 'view') && v?.editFeature && !v.intersections && v.intersections !== lastIntersections) {
            setShowResult(true);
        }

        // Handle selection on the map
        if (v?.type === 'selection') {
            const currentSelection = v?.features?.[0];
            const currentSelectionKey = currentSelection 
                ? (currentSelection.id || JSON.stringify(currentSelection.properties) || JSON.stringify(currentSelection.geometry))
                : null;

            if (currentSelectionKey && currentSelectionKey !== lastSelectionId) {
                setLastSelectionId(currentSelectionKey);
                // Open result right away for selection unless it's just deselection
                setShowResult(true);
            }
        }
    }, [lastIntersections, lastSelectionId]);

    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-muted/20 p-4 gap-4">
            <div className="w-full max-w-[840px] h-[580px]">
                <div className="flex items-center justify-between pb-2">
                    <label className="block font-medium">Selecione o perimetro para protocolo:</label>
                    <div className="flex gap-2">
                        <Button onClick={loadExample} variant="outline" size="sm" className="h-7 text-xs">
                            Carregar Exemplo
                        </Button>
                        <Button onClick={reset} variant="outline" size="sm" className="h-7 text-xs">
                            Limpar
                        </Button>
                    </div>
                </div>
                <div className="rounded-xl w-[100%] h-full border shadow-sm bg-background relative flex flex-col overflow-hidden">
                    <div className="flex-1 relative overflow-hidden">
                        <MapPicker
                            key={pickerKey}
                            initialData={initialData}
                            onChange={handleMapChange}
                            mode={initialData !== undefined ? 'selected' : 'editable'}
                            hideMap={showResult}
                            hideLayerManager={true}
                            overlay={
                                 (showResult) && (
                                    <MapResultContent 
                                        value={value} 
                                        onClose={() => {
                                            setShowResult(false);
                                            setLastSelectionId(null);
                                        }} 
                                        hideActions={!!initialData}
                                    />
                                )
                            }
                        >
                        </MapPicker>
                    </div>
                </div>
            </div>

            {/* Debug & Custom Initial Data View */}
            <div className="mt-8 p-4 border rounded-lg bg-card shadow-sm w-full max-w-[840px] animate-in fade-in">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-bold flex items-center gap-2">
                        <span className="material-symbols-outlined text-base">bug_report</span>
                        Debug State & Initial Data
                    </h3>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-xs font-mono mb-4">
                    <div className="p-2 bg-muted/30 rounded border border-border/50">
                        <p className="font-semibold text-muted-foreground mb-1">State Flags:</p>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="flex justify-between">
                                <span>showResult:</span>
                                <span className={showResult ? "text-green-600 font-bold" : "text-muted-foreground"}>{String(showResult)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>hasValue:</span>
                                <span className={value ? "text-green-600 font-bold" : "text-muted-foreground"}>{String(!!value)}</span>
                            </div>
                             <div className="flex justify-between col-span-2 border-t pt-1 mt-1">
                                <span>Picker Mode:</span>
                                <span>{initialData ? 'selected' : 'editable'}</span>
                            </div>
                        </div>
                    </div>
                    <div className="p-2 bg-muted/30 rounded border border-border/50">
                        <p className="font-semibold text-muted-foreground mb-1">Value Type:</p>
                        <p className="text-sm font-bold text-primary">{value?.type || "null"}</p>
                    </div>
                     <div className="col-span-2">
                        <p className="font-semibold text-muted-foreground mb-1">Value Data Snapshot:</p>
                        <pre className="bg-muted p-3 rounded-md overflow-auto max-h-60 text-[10px] leading-relaxed border shadow-inner">
                            {JSON.stringify(value, null, 2)}
                        </pre>
                    </div>
                </div>

                <div className="border-t pt-4">
                    <p className="font-semibold text-sm mb-2">Set Custom Initial Data (JSON)</p>
                    <textarea 
                        className="w-full h-32 p-2 text-xs font-mono border rounded-md bg-muted/30"
                        placeholder={'{\n  "editFeature": {\n    "type": "Feature",\n    "properties": {},\n    "geometry": { ... }\n  }\n}'}
                        value={customJson}
                        onChange={(e) => setCustomJson(e.target.value)}
                    />
                    <div className="flex justify-end mt-2">
                        <Button onClick={loadCustom} size="sm">
                            Carregar Custom JSON
                        </Button>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default MapTestPage;
