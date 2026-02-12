import React from 'react';
import { editorStore } from '../store';
import { Button } from '@open-urbis/map-ui';
import { X, FileText, Link as LinkIcon, Eye, EyeOff, CheckCircle2, AlertTriangle } from 'lucide-react';
import { NormativeElement } from '../../../domain/types';

export function EditorSidebar() {
    const isOpen = editorStore.sidebarOpen.value;
    const selectedBlock = editorStore.selectedBlock.value;
    const page = editorStore.page.value;

    if (!isOpen || !selectedBlock) return null;

    const normativeData = selectedBlock.type === 'normative' ? selectedBlock.content as NormativeElement : null;

    return (
        <div className="w-80 border-l bg-background h-full flex flex-col shadow-xl z-20">
            <div className="flex items-center justify-between p-4 border-b">
                <h3 className="font-semibold">Propriedades do Bloco</h3>
                <Button variant="ghost" size="icon" onClick={() => editorStore.sidebarOpen.value = false}>
                    <X size={16} />
                </Button>
            </div>

            <div className="flex-1 overflow-auto p-4 space-y-6">
                
                {/* Block Info */}
                <div className="space-y-3">
                    <h4 className="text-sm font-medium text-muted-foreground">Detecção Automática</h4>
                    
                    <div className="p-3 bg-muted/50 rounded space-y-2 border">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground uppercase font-bold">Tipo Identificado</span>
                            {normativeData ? (
                                <CheckCircle2 className="text-green-600 w-4 h-4" />
                            ) : (
                                <AlertTriangle className="text-amber-600 w-4 h-4" />
                            )}
                        </div>
                        
                        <div className="font-mono text-sm font-medium">
                            {normativeData ? normativeData.type : selectedBlock.type}
                        </div>

                        {normativeData && (
                            <>
                                <div className="text-xs text-muted-foreground uppercase font-bold mt-2">Índice</div>
                                <div className="font-mono text-sm">{normativeData.index || '-'}</div>
                            </>
                        )}
                    </div>
                </div>

                {/* Linking Section */}
                <div>
                    <h4 className="text-sm font-medium mb-2 text-muted-foreground flex items-center gap-2">
                        <LinkIcon size={14} /> Vínculos
                    </h4>
                    
                    {selectedBlock.linkedDocumentId ? (
                         <div className="p-3 border rounded bg-primary/5 space-y-2">
                            <div className="text-sm font-medium">Vinculado a:</div>
                            <div className="text-xs text-muted-foreground font-mono truncate">
                                {selectedBlock.linkedDocumentId}
                            </div>
                            <Button variant="outline" size="sm" className="w-full text-xs h-7">
                                Desvincular
                            </Button>
                        </div>
                    ) : (
                        <div className="p-4 border border-dashed rounded text-center space-y-2">
                            <p className="text-xs text-muted-foreground">Nenhum documento vinculado</p>
                            <Button variant="outline" size="sm" className="w-full text-xs">
                                Vincular Documento
                            </Button>
                        </div>
                    )}
                </div>

                {/* Page Level Settings (Only show if no block selected or special block) */}
                {/* For now showing always at bottom */}
                <div className="pt-4 border-t mt-8">
                     <h4 className="text-sm font-medium mb-2 text-muted-foreground flex items-center gap-2">
                        <FileText size={14} /> Página
                    </h4>
                    
                    <div className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
                        <span className="text-sm">Visibilidade</span>
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => editorStore.togglePublic()}
                            className={page?.isPublic ? "text-green-600" : "text-amber-600"}
                        >
                            {page?.isPublic ? (
                                <><Eye size={14} className="mr-2"/> Pública</>
                            ) : (
                                <><EyeOff size={14} className="mr-2"/> Privada</>
                            )}
                        </Button>
                    </div>
                </div>

            </div>
        </div>
    );
}
