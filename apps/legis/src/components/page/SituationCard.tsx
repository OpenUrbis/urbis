import React, { useState } from 'react';
import { Button } from '@open-urbis/map-ui';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { SituationGroup, GROUP_TITLES, getIconForType } from './SituationLogic';

interface SituationCardProps {
    group: SituationGroup;
    defaultExpanded?: boolean;
    onToggle?: (expanded: boolean) => void;
}

export function SituationCard({ group, defaultExpanded = false, onToggle }: SituationCardProps) {
    const [expanded, setExpanded] = useState(defaultExpanded);
    const toggleExpand = () => {
        const newState = !expanded;
        setExpanded(newState);
        if (onToggle) {
            // Allow time for DOM to update
            setTimeout(() => onToggle(newState), 50);
        }
    };

    // Always enable toggling to allow compacting layout
    const showToggle = true; 

    return (
        <div 
            id={`card-${group.id}`} // crucial for xarrow
            className="bg-card border-0 rounded-xl shadow-sm overflow-hidden transition-all hover:shadow-md mb-4 text-left ring-1 ring-border/50"
        >
            {/* Header */}
            <div 
                className="bg-muted/30 p-2 border-b-0 flex justify-between items-center cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={toggleExpand}
            >
                <div>
                    <div className="font-medium text-xs text-primary flex items-center gap-1.5">
                        {getIconForType(group.type)}
                        {GROUP_TITLES[group.type]}
                        {!expanded && group.situations.length > 0 && (
                            <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full ml-1">
                                {group.situations.length}
                            </span>
                        )}
                    </div>
                </div>
                {showToggle && (
                    <Button variant="ghost" size="icon" className="h-5 w-5 -mr-1">
                        {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    </Button>
                )}
            </div>

            {/* Content - Fully hidden when collapsed */}
            {expanded && (
                <div className="p-2 space-y-2">
                    {group.situations.map((sit, idx) => (
                        <div key={idx} className="relative pl-2 border-l-2 border-muted">
                            <div className="flex justify-between items-baseline mb-1">
                                <span className="text-[10px] font-semibold">{sit.type}</span>
                                <span className="text-[9px] text-muted-foreground whitespace-nowrap ml-2">
                                    {sit.date}
                                </span>
                            </div>
                            
                            {sit.dispositivo && (
                                <div className="text-[9px] text-muted-foreground mb-1 italic">
                                    {sit.dispositivo}
                                </div>
                            )}

                            {sit.type === 'Veto' && (
                                <div className="text-[10px] bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-2 rounded-lg mt-1 border border-red-100 dark:border-red-900/30">
                                    <span className="font-bold text-[8px] uppercase block mb-0.5 opacity-70">VETO:</span>
                                    <div className="font-bold mb-1">Texto vetado:</div>
                                    <div className="italic mb-2 opacity-80">{sit.vetoText || 'Texto integral'}</div>
                                    <div className="font-bold mb-1">Dispositivo:</div>
                                    <div className="opacity-80">"{sit.dispositivo}"</div>
                                </div>
                            )}

                            {sit.type === 'Derrubada de veto' && (
                                <div className="text-[10px] bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 p-2 rounded-lg mt-1 border border-orange-100 dark:border-orange-900/30">
                                    <span className="font-bold text-[8px] uppercase block mb-0.5 opacity-70">DERRUBADA DE VETO:</span>
                                    <div className="font-bold mb-1">Dispositivo:</div>
                                    <div className="opacity-80">"{sit.dispositivo}"</div>
                                </div>
                            )}

                            {(sit.type === 'Nova redação' || sit.type === 'Alteração de ementa') && (
                                <div className="text-[10px] bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 p-2 rounded-lg mt-1 border border-blue-100 dark:border-blue-900/30">
                                    <span className="font-bold text-[8px] uppercase block mb-0.5 opacity-70">
                                        {sit.type === 'Alteração de ementa' ? 'EMENTA ALTERADA' : 'NOVA REDAÇÃO'}
                                    </span>
                                    <div className="font-bold mb-1">Dispositivo:</div>
                                    <div className="opacity-80">"{sit.dispositivo}"</div>
                                </div>
                            )}

                            {sit.type === 'Repristinação' && (
                                <div className="text-[10px] bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 p-2 rounded-lg mt-1 border border-orange-100 dark:border-orange-900/30">
                                    <span className="font-bold text-[8px] uppercase block mb-0.5 opacity-70">REPRISTINADO</span>
                                    <div className="font-bold mb-1">Dispositivo:</div>
                                    <div className="opacity-80">"{sit.dispositivo}"</div>
                                </div>
                            )}

                            {(sit.type === 'Perda definitiva de vigor/eficácia' || sit.type === 'Suspensão de vigor/eficácia') && (
                                <div className="text-[10px] bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 p-2 rounded-lg mt-1 border border-zinc-200 dark:border-zinc-800">
                                    <span className="font-bold text-[8px] uppercase block mb-0.5 opacity-70">
                                        {sit.type.toUpperCase()}
                                    </span>
                                    <div className="font-bold mb-1">Texto sem vigor/eficácia:</div>
                                    <div className="italic mb-2 opacity-80 line-through">{sit.revokedText || 'Texto integral'}</div>
                                    <div className="font-bold mb-1">Dispositivo:</div>
                                    <div className="opacity-80">"{sit.dispositivo}"</div>
                                </div>
                            )}

                            {(sit.type === 'Vigência inicial alterada' || sit.type === 'Vigência final alterada') && (
                                <div className="text-[10px] bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-2 rounded-lg mt-1 border border-red-100 dark:border-red-900/30">
                                    <span className="font-bold text-[8px] uppercase block mb-0.5 opacity-70">VIGÊNCIA NÃO INICIADA</span>
                                    <div className="font-bold mb-1">Início da vigência:</div>
                                    <div className="opacity-80 mb-2">{sit.date === 'vigência condicionada' ? 'Vigência condicionada' : sit.date}</div>
                                    <div className="font-bold mb-1">Dispositivo:</div>
                                    <div className="opacity-80">"{sit.dispositivo}"</div>
                                </div>
                            )}
                            {sit.newIndex && (
                                <div className="text-[10px] mt-1">
                                    <span className="text-muted-foreground">Novo Índice: </span>
                                    <span className="font-mono bg-muted px-1 rounded">{sit.newIndex}</span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
