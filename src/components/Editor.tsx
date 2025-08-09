"use client";

import { useState, useRef, useEffect } from "react";
import { useStore } from "@/lib/store";
import { Annotation } from "@/components/Annotation";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Panel } from "@/types";

export function Editor() {
  const {
    pages,
    currentPageIndex,
    selectedPanelId,
    setSelectedPanelId,
    isCreatingPanel,
    addPanel,
    toggleCreatePanel,
  } = useStore();
  
  const [newPanel, setNewPanel] = useState<Panel | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  const currentPage = pages[currentPageIndex];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if(isCreatingPanel) {
          toggleCreatePanel();
        }
        setSelectedPanelId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCreatingPanel, setSelectedPanelId, toggleCreatePanel]);


  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isCreatingPanel || !editorRef.current) return;
    
    const rect = editorRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setNewPanel({ id: "new", x, y, width: 0, height: 0 });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!newPanel || !editorRef.current) return;

    const rect = editorRef.current.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    setNewPanel(prev => prev && {
      ...prev,
      width: Math.abs(currentX - prev.x),
      height: Math.abs(currentY - prev.y),
      x: Math.min(currentX, prev.x),
      y: Math.min(currentY, prev.y),
    });
  };

  const handleMouseUp = () => {
    if (newPanel && newPanel.width > 10 && newPanel.height > 10) {
      addPanel({ ...newPanel, id: `${currentPage.pageNumber}-${Math.random().toString(36).substr(2, 9)}` });
    }
    setNewPanel(null);
    if (isCreatingPanel) {
      toggleCreatePanel();
    }
  };

  if (!currentPage) {
    return (
      <Card className="w-full h-full flex items-center justify-center bg-muted/30">
        <p className="text-muted-foreground">No page selected</p>
      </Card>
    );
  }

  return (
    <Card className="w-full h-full overflow-auto relative flex items-start justify-center p-4 bg-muted/30">
      <div
        ref={editorRef}
        className={cn(
          "relative shadow-lg",
          isCreatingPanel && "cursor-crosshair"
        )}
        style={{
          width: currentPage.width,
          height: currentPage.height,
        }}
        onClick={() => setSelectedPanelId(null)}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={currentPage.imageUrl}
          alt={`Page ${currentPage.pageNumber}`}
          width={currentPage.width}
          height={currentPage.height}
          className="pointer-events-none select-none"
        />
        {currentPage.panels.map((panel) => (
          <Annotation key={panel.id} panel={panel} />
        ))}
        {newPanel && (
          <div
            className="absolute border-2 border-dashed border-accent"
            style={{
              left: newPanel.x,
              top: newPanel.y,
              width: newPanel.width,
              height: newPanel.height,
            }}
          />
        )}
      </div>
    </Card>
  );
}
