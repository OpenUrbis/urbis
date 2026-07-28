import { useState } from "react";
import { ITemplate } from "../../types/templates-type";
import { useBuilder } from "../BuilderContext";

const GRID_COLS = 12;

export const ResizeOverlay = ({
  template,
  nodeRef,
}: {
  template: ITemplate;
  nodeRef: HTMLElement | null;
}) => {
  const { updateItem } = useBuilder();
  const [isResizing, setIsResizing] = useState(false);
  const properties = (template.properties || {}) as any;
  const columns: number[] = properties.columns || [GRID_COLS];

  // Only render handles if we have multiple columns
  if (!nodeRef || columns.length <= 1) return null;

  const handleMouseDown = (index: number) => (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(true);

    const startX = e.clientX;
    const gridRect = nodeRef.getBoundingClientRect();
    const totalWidth = gridRect.width;
    const pxPerSpan = totalWidth / GRID_COLS;

    const initialLeftSpan = columns[index];
    const initialRightSpan = columns[index + 1];

    const doDrag = (moveEvent: MouseEvent) => {
        const deltaPx = moveEvent.clientX - startX;
        const deltaSpan = Math.round(deltaPx / pxPerSpan);
        
        if (deltaSpan === 0) return; // No change in grid units

        let newLeftSpan = initialLeftSpan + deltaSpan;
        let newRightSpan = initialRightSpan - deltaSpan;

        // Constraint: Minimum 1 span
        if (newLeftSpan < 1) {
            newLeftSpan = 1;
            newRightSpan = initialLeftSpan + initialRightSpan - 1;
        } else if (newRightSpan < 1) {
            newRightSpan = 1;
            newLeftSpan = initialLeftSpan + initialRightSpan - 1;
        }

        if (newLeftSpan === columns[index] && newRightSpan === columns[index+1]) return;

        const newColumns = [...columns];
        newColumns[index] = newLeftSpan;
        newColumns[index + 1] = newRightSpan;
        
        updateItem(template.id!, {
            properties: {
                ...properties,
                columns: newColumns
            }
        });
    };

    const stopDrag = () => {
        document.removeEventListener("mousemove", doDrag);
        document.removeEventListener("mouseup", stopDrag);
        document.body.style.cursor = "";
        setIsResizing(false);
    };

    document.addEventListener("mousemove", doDrag);
    document.addEventListener("mouseup", stopDrag);
    document.body.style.cursor = "col-resize";
  };

  // Helper to calculate handle positions
  let accumulatedSpan = 0;
  
  return (
    <div className="absolute inset-0 pointer-events-none z-10">
        {columns.map((span: number, i: number) => {
            accumulatedSpan += span;
            if (i === columns.length - 1) return null; // Last column doesn't have right handle
            
            const leftPercent = (accumulatedSpan / GRID_COLS) * 100;
            
            return (
                <div 
                    key={i} 
                    className="absolute top-0 h-full w-4 -ml-2 cursor-col-resize hover:bg-primary/20 group flex justify-center pointer-events-auto"
                    style={{ left: `${leftPercent}%`, pointerEvents: "auto" }}
                    onMouseDown={handleMouseDown(i)}
                >
                    <div className="w-0.5 h-full bg-primary/0 group-hover:bg-primary/50 transition-colors" />
                </div>
            );
        })}
    </div>
  );
};
