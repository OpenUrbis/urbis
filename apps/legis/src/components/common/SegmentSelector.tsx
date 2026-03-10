import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Button, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Input } from '@open-urbis/map-ui';
import { getWordIndicesFromSelection, extractTextFromWordIndices } from '../../domain/text-utils';

export interface Segment {
    start: number; // Word Index Start
    end: number;   // Word Index End
    text: string;
    type?: 'omission' | 'supplement';
    supplementText?: string;
}

interface SegmentSelectorProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    text: string;
    onConfirm: (segments: Segment[]) => void;
    title?: string;
    mode?: 'single' | 'multiple'; // For now we implement single selection flow per dialog open as per previous UX, but return array for future proofing
}

export function SegmentSelector({ open, onOpenChange, text, onConfirm, title = "Marcar Trecho do Texto" }: SegmentSelectorProps) {
    const [selectedSegmentText, setSelectedSegmentText] = useState('');
    const [tempSegment, setTempSegment] = useState<Segment | null>(null);
    const [segmentType, setSegmentType] = useState<'omission' | 'supplement'>('omission');
    const [supplementText, setSupplementText] = useState('');
    const textRef = React.useRef<HTMLDivElement>(null);

    // Reset state when dialog opens
    useEffect(() => {
        if (open) {
            setTempSegment(null);
            setSelectedSegmentText('');
            setSegmentType('omission');
            setSupplementText('');
        }
    }, [open]);

    const handleSegmentSelection = () => {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0 || !text || !textRef.current) return;

        // Check if selection is within our text container
        if (!textRef.current.contains(selection.anchorNode)) return;

        const range = selection.getRangeAt(0);
        const preSelectionRange = range.cloneRange();
        preSelectionRange.selectNodeContents(textRef.current);
        preSelectionRange.setEnd(range.startContainer, range.startOffset);
        
        const start = preSelectionRange.toString().length;
        const selectionText = selection.toString();
        const end = start + selectionText.length;

        if (selectionText) {
            setTempSegment({
                start: start,
                end: end,
                text: selectionText,
                type: 'omission' // Default
            });
            setSelectedSegmentText(selectionText);
        }
    };

    const handleConfirm = () => {
        if (!tempSegment) return;
        
        // Pass the Supplement Text in the 'text' field if type is supplement
        // For omission, we must NOT pass text, otherwise renderer interprets it as a note.
        
        const finalSegment: Segment = {
            ...tempSegment,
            type: segmentType,
            text: segmentType === 'supplement' ? (supplementText || '') : '' 
        };
        
        onConfirm([finalSegment]);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                        Selecione com o mouse o trecho do texto abaixo que deseja omitir ou suplementar.
                    </div>
                    
                    <div 
                        ref={textRef}
                        className="p-4 border rounded-md text-sm leading-relaxed max-h-[300px] overflow-y-auto select-text whitespace-pre-wrap font-serif"
                        onMouseUp={handleSegmentSelection}
                    >
                        {text}
                    </div>

                    {tempSegment && (
                        <div className="space-y-4 border rounded p-3 bg-muted/10">
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold">Trecho Selecionado:</Label>
                                <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded text-xs italic">
                                    "{tempSegment.text}"
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-semibold">Ação:</Label>
                                <Select value={segmentType} onValueChange={(v) => setSegmentType(v as any)}>
                                    <SelectTrigger className="h-8">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="omission">Omitir Trecho (Ocultar com [...])</SelectItem>
                                        <SelectItem value="supplement">Suplementar Trecho (Substituir/Anotar)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {segmentType === 'supplement' && (
                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold">Texto da Nota (Itálico entre colchetes):</Label>
                                    <Input 
                                        value={supplementText} 
                                        onChange={e => setSupplementText(e.target.value)}
                                        placeholder="Ex: 15,4m"
                                        className="h-8"
                                    />
                                    <p className="text-[10px] text-muted-foreground">
                                        Será exibido como: <span className="italic">[{supplementText || 'texto'}]</span>
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button onClick={handleConfirm} disabled={!tempSegment}>Confirmar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
