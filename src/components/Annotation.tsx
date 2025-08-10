
"use client";

import { useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { Panel } from "@/types";
import { Button } from "./ui/button";
import { Trash2 } from "lucide-react";

interface AnnotationProps {
  panel: Panel;
  onUpdate: (panelId: string, finalPanel: Panel) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
}

type DragState = {
  type: "move" | "resize-br" | "resize-bl" | "resize-tr" | "resize-tl" | "resize-t" | "resize-b" | "resize-l" | "resize-r";
  startX: number;
  startY: number;
  initialPanel: Panel;
};

export function Annotation({ panel, onUpdate, onDragStart, onDragEnd }: AnnotationProps) {
  const { selectedPanelId, setSelectedPanelId, deletePanel } = useStore();
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [localPanel, setLocalPanel] = useState<Panel>(panel);

  const isSelected = selectedPanelId === panel.id;
  
  // Sync local panel state if the prop changes from outside, but only when not actively dragging.
  useEffect(() => {
    if (!dragState) {
      setLocalPanel(panel);
    }
  }, [panel, dragState]);


  const handleMouseDown = (
    e: React.MouseEvent<HTMLDivElement>,
    type: DragState["type"]
  ) => {
    e.stopPropagation();
    setSelectedPanelId(panel.id);
    onDragStart(); // Pause temporal store

    // Start drag state with the most recent panel state
    const currentPanel = localPanel;
    setDragState({
      type,
      startX: e.clientX,
      startY: e.clientY,
      initialPanel: currentPanel,
    });
    

    const handleMouseMove = (moveEvent: MouseEvent) => {
      // Use a new reference to the initial panel state for each move calculation
      const initialPanelForMove = { ...currentPanel };
      
      const dx = moveEvent.clientX - e.clientX;
      const dy = moveEvent.clientY - e.clientY;
      
      let newProps: Partial<Panel> = {};

      switch (type) {
        case "move":
          newProps = { x: initialPanelForMove.x + dx, y: initialPanelForMove.y + dy };
          break;
        case "resize-br":
          newProps = { width: initialPanelForMove.width + dx, height: initialPanelForMove.height + dy };
          break;
        case "resize-bl":
          newProps = { x: initialPanelForMove.x + dx, width: initialPanelForMove.width - dx, height: initialPanelForMove.height + dy };
          break;
        case "resize-tr":
            newProps = { y: initialPanelForMove.y + dy, width: initialPanelForMove.width + dx, height: initialPanelForMove.height - dy };
            break;
        case "resize-tl":
            newProps = { x: initialPanelForMove.x + dx, y: initialPanelForMove.y + dy, width: initialPanelForMove.width - dx, height: initialPanelForMove.height - dy };
            break;
        case "resize-t":
            newProps = { y: initialPanelForMove.y + dy, height: initialPanelForMove.height - dy };
            break;
        case "resize-b":
            newProps = { height: initialPanelForMove.height + dy };
            break;
        case "resize-l":
            newProps = { x: initialPanelForMove.x + dx, width: initialPanelForMove.width - dx };
            break;
        case "resize-r":
            newProps = { width: initialPanelForMove.width + dx };
            break;
      }
      
      // Basic validation
      if(newProps.width && newProps.width < 10) newProps.width = 10;
      if(newProps.height && newProps.height < 10) newProps.height = 10;
      
      setLocalPanel(prev => ({...prev, ...newProps }));
    };

    const handleMouseUp = (upEvent: MouseEvent) => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        
        // Final calculation needs to be done here to get the correct end state of localPanel
        const dx = upEvent.clientX - e.clientX;
        const dy = upEvent.clientY - e.clientY;
        
        let finalProps: Partial<Panel> = {};

        switch (type) {
            case "move": finalProps = { x: currentPanel.x + dx, y: currentPanel.y + dy }; break;
            case "resize-br": finalProps = { width: currentPanel.width + dx, height: currentPanel.height + dy }; break;
            case "resize-bl": finalProps = { x: currentPanel.x + dx, width: currentPanel.width - dx, height: currentPanel.height + dy }; break;
            case "resize-tr": finalProps = { y: currentPanel.y + dy, width: currentPanel.width + dx, height: currentPanel.height - dy }; break;
            case "resize-tl": finalProps = { x: currentPanel.x + dx, y: currentPanel.y + dy, width: currentPanel.width - dx, height: currentPanel.height - dy }; break;
            case "resize-t": finalProps = { y: currentPanel.y + dy, height: currentPanel.height - dy }; break;
            case "resize-b": finalProps = { height: currentPanel.height + dy }; break;
            case "resize-l": finalProps = { x: currentPanel.x + dx, width: currentPanel.width - dx }; break;
            case "resize-r": finalProps = { width: currentPanel.width + dx }; break;
        }

        const finalPanel = { ...currentPanel, ...finalProps };
        if(finalPanel.width < 10) finalPanel.width = 10;
        if(finalPanel.height < 10) finalPanel.height = 10;
        
        onUpdate(panel.id, finalPanel);
        setDragState(null);
        onDragEnd(); // Resume temporal store
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
  
  const displayPanel = dragState ? localPanel : panel;

  return (
    <div
      className={cn(
        "absolute border-2 transition-all box-border",
        isSelected
          ? "border-primary bg-primary/20"
          : "border-accent bg-accent/10",
      )}
      style={{
        left: displayPanel.x,
        top: displayPanel.y,
        width: displayPanel.width,
        height: displayPanel.height,
        cursor: "move",
      }}
      onMouseDown={(e) => {
        // Prevent triggering the editor's deselect logic
        e.stopPropagation();
        handleMouseDown(e, "move");
      }}
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
