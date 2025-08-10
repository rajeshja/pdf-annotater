"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { Panel } from "@/types";
import { Button } from "./ui/button";
import { Trash2 } from "lucide-react";

interface AnnotationProps {
  panel: Panel;
}

type DragState = {
  type: "move" | "resize-br" | "resize-bl" | "resize-tr" | "resize-tl" | "resize-t" | "resize-b" | "resize-l" | "resize-r";
  startX: number;
  startY: number;
  initialPanel: Panel;
};

export function Annotation({ panel }: AnnotationProps) {
  const { selectedPanelId, setSelectedPanelId, updatePanel, deletePanel } = useStore();
  const [dragState, setDragState] = useState<DragState | null>(null);

  const isSelected = selectedPanelId === panel.id;

  const handleMouseDown = (
    e: React.MouseEvent<HTMLDivElement>,
    type: DragState["type"]
  ) => {
    e.stopPropagation();
    setSelectedPanelId(panel.id);
    setDragState({
      type,
      startX: e.clientX,
      startY: e.clientY,
      initialPanel: panel,
    });

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - e.clientX;
      const dy = moveEvent.clientY - e.clientY;
      
      let newProps: Partial<Panel> = {};

      switch (type) {
        case "move":
          newProps = { x: panel.x + dx, y: panel.y + dy };
          break;
        case "resize-br":
          newProps = { width: panel.width + dx, height: panel.height + dy };
          break;
        case "resize-bl":
          newProps = { x: panel.x + dx, width: panel.width - dx, height: panel.height + dy };
          break;
        case "resize-tr":
            newProps = { y: panel.y + dy, width: panel.width + dx, height: panel.height - dy };
            break;
        case "resize-tl":
            newProps = { x: panel.x + dx, y: panel.y + dy, width: panel.width - dx, height: panel.height - dy };
            break;
        case "resize-t":
            newProps = { y: panel.y + dy, height: panel.height - dy };
            break;
        case "resize-b":
            newProps = { height: panel.height + dy };
            break;
        case "resize-l":
            newProps = { x: panel.x + dx, width: panel.width - dx };
            break;
        case "resize-r":
            newProps = { width: panel.width + dx };
            break;
      }
      
      // Basic validation
      if(newProps.width && newProps.width < 10) newProps.width = 10;
      if(newProps.height && newProps.height < 10) newProps.height = 10;
      
      updatePanel(panel.id, newProps);
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      setDragState(null);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleResizeHandle = (cursor: string, type: DragState["type"]) => (
    <div
      className="absolute w-3 h-3 bg-background border border-primary rounded-full"
      style={{ cursor: `${cursor}-resize` }}
      onMouseDown={(e) => handleMouseDown(e, type)}
    />
  );
  
  return (
    <div
      className={cn(
        "absolute border-2 transition-all box-border",
        isSelected
          ? "border-primary bg-primary/20"
          : "border-accent/70 bg-accent/10",
      )}
      style={{
        left: panel.x,
        top: panel.y,
        width: panel.width,
        height: panel.height,
        cursor: "move",
      }}
      onMouseDown={(e) => handleMouseDown(e, "move")}
    >
      {isSelected && (
        <>
          {/* Resize handles */}
          <div className="absolute -top-1.5 -left-1.5">{handleResizeHandle('nwse', 'resize-tl')}</div>
          <div className="absolute -top-1.5 -right-1.5">{handleResizeHandle('nesw', 'resize-tr')}</div>
          <div className="absolute -bottom-1.5 -left-1.5">{handleResizeHandle('nesw', 'resize-bl')}</div>
          <div className="absolute -bottom-1.5 -right-1.5">{handleResizeHandle('nwse', 'resize-br')}</div>
          <div className="absolute -top-1.5 left-1/2 -translate-x-1/2">{handleResizeHandle('ns', 'resize-t')}</div>
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2">{handleResizeHandle('ns', 'resize-b')}</div>
          <div className="absolute -left-1.5 top-1/2 -translate-y-1/2">{handleResizeHandle('ew', 'resize-l')}</div>
          <div className="absolute -right-1.5 top-1/2 -translate-y-1/2">{handleResizeHandle('ew', 'resize-r')}</div>

          {/* Delete button */}
          <Button
            size="icon"
            variant="destructive"
            className="absolute -top-3 -right-3 h-7 w-7 rounded-full shadow-md"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={() => deletePanel(panel.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </>
      )}
    </div>
  );
}
