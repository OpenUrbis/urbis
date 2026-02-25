import React from 'react';
import { TableData, TableCell, TableRow } from '../../domain/types';
import { cn } from '@open-urbis/map-ui';

interface SmartTableRendererProps {
    data: TableData;
    onSelect?: () => void;
}

/**
 * Simplified Smart Table Renderer.
 * Renders a standard HTML table based on the rows and cells data.
 * Merging is supported via colSpan and rowSpan in cell data.
 */
export function SmartTableRenderer({ data, onSelect }: SmartTableRendererProps) {
    const { rows, cols, cells, footer } = data;

    if (!rows || rows.length === 0) return null;

    // Sort rows by index
    const sortedRows = [...rows].sort((a, b) => (a.index || 0) - (b.index || 0));
    // Sort cols by index
    const sortedCols = [...cols].sort((a, b) => (a.index || 0) - (b.index || 0));

    return (
        <div className="overflow-x-auto my-6 border rounded-lg shadow-sm bg-card">
            <table className="w-full border-collapse text-sm">
                <tbody>
                    {sortedRows.map((row: TableRow) => {
                        return (
                            <tr key={row.id} className="border-b last:border-0 group">
                                {sortedCols.map((col) => {
                                    const cell = cells.find((c: TableCell) => c.rowId === row.id && c.colId === col.id);
                                    
                                    // If cell is missing or hidden (due to merge), don't render
                                    if (!cell || (cell as any).hidden) return null;

                                    const isHeader = row.type === 'Cabeçalho' || col.type === 'Cabeçalho';
                                    const Tag = isHeader ? 'th' : 'td';

                                    const cleanText = (cell.text || '').replace(/\.\.\./g, '').trim();

                                    return (
                                        <Tag
                                            key={col.id}
                                            rowSpan={cell.rowSpan}
                                            colSpan={cell.colSpan}
                                            className={cn(
                                                "border-r last:border-0 p-3 text-justify align-middle transition-colors",
                                                isHeader ? "bg-muted/50 font-bold text-center" : "bg-card",
                                                "hover:bg-primary/5",
                                                onSelect && "cursor-pointer"
                                            )}
                                            onClick={onSelect}
                                            dangerouslySetInnerHTML={{ __html: cleanText }}
                                        />
                                    );
                                })}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            {footer && (
                <div className="p-3 bg-muted/5 text-xs text-muted-foreground italic border-t">
                    {footer}
                </div>
            )}
        </div>
    );
}
