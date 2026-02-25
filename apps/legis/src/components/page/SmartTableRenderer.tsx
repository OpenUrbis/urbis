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

    // Auto-merge logic based on content identity
    const processedCells = React.useMemo(() => {
        // 1. Create Grid
        const grid: any[][] = [];
        const cellMap = new Map<string, any>(); // key: rowId-colId

        sortedRows.forEach((row, rIdx) => {
            grid[rIdx] = [];
            sortedCols.forEach((col, cIdx) => {
                const originalCell = cells.find(c => c.rowId === row.id && c.colId === col.id);
                const cell = {
                    ...originalCell,
                    rowId: row.id,
                    colId: col.id,
                    // Clean text for comparison (strip HTML tags and whitespace)
                    cleanContent: (originalCell?.text || '').replace(/<[^>]*>/g, '').trim(),
                    // Keep original HTML for display
                    displayText: (originalCell?.text || '').replace(/\.\.\./g, '').trim(),
                    rowSpan: 1,
                    colSpan: 1,
                    hidden: false
                };
                grid[rIdx][cIdx] = cell;
                cellMap.set(`${row.id}-${col.id}`, cell);
            });
        });

        // 2. Horizontal Merge
        for (let r = 0; r < sortedRows.length; r++) {
            for (let c = 0; c < sortedCols.length - 1; c++) {
                const current = grid[r][c];
                const next = grid[r][c + 1];

                if (current.hidden) continue;

                if (current.cleanContent === next.cleanContent && current.cleanContent !== '') {
                    current.colSpan += 1;
                    next.hidden = true;
                    // Update the grid reference for the merged cells so subsequent checks see the merge
                    // Actually, since we iterate linearly, next iteration checks c+1 (which is hidden)
                    // We need to propagate the merge.
                    // The 'next' is now part of 'current'.
                    // If we have A | A | A
                    // c=0: A(1) == A(2). A(1).colSpan = 2. A(2).hidden = true.
                    // c=1: A(2) == A(3). A(2) is hidden.
                    // This naive loop doesn't chain merges properly if we check `current`.
                    // We should check against the *active* cell for this block.
                    // Better approach: Inner loop for merging.
                }
            }
        }
        
        // Revised Horizontal Merge
        for (let r = 0; r < sortedRows.length; r++) {
            let c = 0;
            while (c < sortedCols.length) {
                const current = grid[r][c];
                let span = 1;
                while (c + span < sortedCols.length) {
                    const next = grid[r][c + span];
                    if (current.cleanContent === next.cleanContent && current.cleanContent !== '') {
                        next.hidden = true;
                        span++;
                    } else {
                        break;
                    }
                }
                current.colSpan = span;
                c += span;
            }
        }

        // 3. Vertical Merge
        for (let c = 0; c < sortedCols.length; c++) {
            let r = 0;
            while (r < sortedRows.length) {
                const current = grid[r][c];
                if (current.hidden) {
                    r++;
                    continue;
                }

                let span = 1;
                while (r + span < sortedRows.length) {
                    const next = grid[r + span][c];
                    // Check if next is hidden (must be hidden by same logic? No, must NOT be hidden by horizontal merge unless consistent)
                    // Wait, if next is hidden horizontally, it belongs to a cell to its left.
                    // Vertical merge should only merge if the whole ROW structure is identical?
                    // Or simply: merge if `next` is identical AND `next` has same colSpan?
                    
                    if (next.hidden) {
                        break; // Cannot merge with a hidden cell (it belongs to another merge)
                    }

                    if (
                        current.cleanContent === next.cleanContent && 
                        current.cleanContent !== '' &&
                        current.colSpan === next.colSpan
                    ) {
                        next.hidden = true;
                        // Also hide cells covered by next's colSpan?
                        // They were already hidden by horizontal merge on next row.
                        // But we need to ensure we don't double count?
                        // `next.hidden = true` is enough for the renderer to skip `next`.
                        span++;
                    } else {
                        break;
                    }
                }
                current.rowSpan = span;
                r += span;
            }
        }

        return cellMap;
    }, [rows, cols, cells]);

    return (
        <div className="overflow-x-auto my-6 border rounded-lg shadow-sm bg-card">
            <table className="w-full border-collapse text-sm">
                <tbody>
                    {sortedRows.map((row: TableRow) => {
                        return (
                            <tr key={row.id} className="border-b last:border-0 group">
                                {sortedCols.map((col) => {
                                    const cell = processedCells.get(`${row.id}-${col.id}`);
                                    
                                    // If cell is missing or hidden (due to merge), don't render
                                    if (!cell || cell.hidden) return null;

                                    const isHeader = row.type === 'Cabeçalho' || col.type === 'Cabeçalho';
                                    const Tag = isHeader ? 'th' : 'td';

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
                                            dangerouslySetInnerHTML={{ __html: cell.displayText }}
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
