import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, Separator, Badge } from '@open-urbis/map-ui';
import { NormativeElement } from '../../domain/types';
import { JSONContent } from '@tiptap/core';
import { Code, Info, Calendar } from 'lucide-react';

interface PropertiesPanelProps {
    element: NormativeElement | null;
    rawNode?: JSONContent | null;
}

export function PropertiesPanel({ element, rawNode }: PropertiesPanelProps) {
    if (!element) {
        return (
            <div className="w-80 border-l bg-muted/10 p-4 h-full flex flex-col gap-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Info className="h-4 w-4" />
                    <span className="text-sm font-medium">Nenhum elemento normativo selecionado</span>
                </div>
                <p className="text-xs text-muted-foreground">
                    Selecione um parágrafo, artigo ou seção no editor para ver suas propriedades estruturadas.
                </p>
            </div>
        );
    }

    return (
        <div className="w-80 border-l bg-background h-full overflow-y-auto flex flex-col">
            <div className="p-4 border-b">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                    Propriedades
                    <Badge variant="outline" className="ml-auto font-mono text-[10px]">{element.type}</Badge>
                </h3>
            </div>

            <div className="p-4 space-y-6">
                {/* Identification */}
                <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Identificação</label>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="bg-muted/30 p-2 rounded border">
                            <span className="block text-[10px] text-muted-foreground">Tipo</span>
                            <span className="font-medium">{element.type}</span>
                        </div>
                        <div className="bg-muted/30 p-2 rounded border">
                            <span className="block text-[10px] text-muted-foreground">Índice</span>
                            <span className="font-medium">{element.index || '-'}</span>
                        </div>
                    </div>
                </div>

                {/* Content Preview */}
                <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Conteúdo Extraído</label>
                    <div className="bg-muted/30 p-2 rounded border text-xs font-mono break-words whitespace-pre-wrap max-h-32 overflow-y-auto">
                        {element.text}
                    </div>
                </div>

                {/* Validity */}
                <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Vigência
                    </label>
                    <div className="text-sm border rounded p-2 space-y-1">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground text-xs">Início</span>
                            <span>{element.originalStartValidity?.date || '-'}</span>
                        </div>
                        {element.originalEndValidity && (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground text-xs">Fim</span>
                                <span>{element.originalEndValidity.date}</span>
                            </div>
                        )}
                    </div>
                </div>

                <Separator />

                {/* JSON View */}
                <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                        <Code className="h-3 w-3" />
                        Estrutura JSON
                    </label>
                    <div className="bg-slate-950 text-slate-50 p-3 rounded-md text-[10px] font-mono">
                        <pre className="whitespace-pre-wrap break-all">{JSON.stringify(element, null, 2)}</pre>
                    </div>
                </div>
            </div>
        </div>
    );
}
