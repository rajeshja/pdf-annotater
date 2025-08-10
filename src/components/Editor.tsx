
"use client";

import { useState, useRef, useEffect } from "react";
import { useStore, temporalStore } from "@/lib/store";
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
    updatePanel,
  } = useStore();
  const temporal = temporalStore;
  
  const [newPanel, setNewPanel] = useState<Panel | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [scaleFactor, setScaleFactor] = useState(1);

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
  
  useEffect(() => {
    const calculateScale = () => {
        if (imageRef.current && currentPage) {
            const newScale = imageRef.current.offsetWidth / currentPage.width;
            setScaleFactor(newScale);
        }
    }
    
    // Calculate scale on mount and on window resize
    calculateScale();
    window.addEventListener('resize', calculateScale);

    // Also recalculate when the image source changes
    const observer = new MutationObserver(calculateScale);
    if(imageRef.current) {
        observer.observe(imageRef.current, { attributes: true, attributeFilter: ['src']});
    }

    return () => {
        window.removeEventListener('resize', calculateScale);
        observer.disconnect();
    }
  }, [currentPage]);


  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isCreatingPanel || !editorRef.current) {
      if(selectedPanelId) setSelectedPanelId(null);
      return;
    };
    
    temporal.pause();
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
    temporal.resume();
    if (newPanel && newPanel.width > 10 && newPanel.height > 10) {
      const scaledPanel: Panel = {
        id: `${currentPage.pageNumber}-${Math.random().toString(36).substr(2, 9)}`,
        x: newPanel.x / scaleFactor,
        y: newPanel.y / scaleFactor,
        width: newPanel.width / scaleFactor,
        height: newPanel.height / scaleFactor,
      };
      addPanel(scaledPanel);
    }
    setNewPanel(null);
    if (isCreatingPanel) {
      toggleCreatePanel();
    }
  };
  
  const handlePanelUpdate = (panelId: string, finalPanel: Panel) => {
    const scaledProps: Partial<Omit<Panel, "id">> = {};
    if (finalPanel.x !== undefined) scaledProps.x = finalPanel.x / scaleFactor;
    if (finalPanel.y !== undefined) scaledProps.y = finalPanel.y / scaleFactor;
    if (finalPanel.width !== undefined) scaledProps.width = finalPanel.width / scaleFactor;
    if (finalPanel.height !== undefined) scaledProps.height = finalPanel.height / scaleFactor;

    updatePanel(panelId, scaledProps);
  }
  
  const handleDragStart = () => {
    temporal.pause();
  }

  const handleDragEnd = () => {
    temporal.resume();
  }

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
          width: currentPage.width * scaleFactor,
          height: currentPage.height * scaleFactor,
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imageRef}
          src={currentPage.imageUrl}
          alt={`Page ${currentPage.pageNumber}`}
          className="pointer-events-none select-none w-full h-full"
        />
        {currentPage.panels.map((panel) => {
          const scaledPanel: Panel = {
            ...panel,
            x: panel.x * scaleFactor,
            y: panel.y * scaleFactor,
            width: panel.width * scaleFactor,
            height: panel.height * scaleFactor,
          };
          return (
            <Annotation 
              key={panel.id} 
              panel={scaledPanel} 
              onUpdate={handlePanelUpdate}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            />
          );
        })}
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
