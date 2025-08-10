
"use client";

import { useStore, useTemporalStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FilePlus, Undo2, Redo2, Square, Download, Sparkles } from "lucide-react";

interface HeaderProps {
  onBrowseClick: () => void;
}

export function Header({ onBrowseClick }: HeaderProps) {
  const { file, exportToCbz, isCreatingPanel, toggleCreatePanel } = useStore();
  const { undo, redo, pastStates, futureStates } = useTemporalStore((state) => state);

  return (
    <header className="flex h-16 items-center border-b bg-card px-4 shrink-0">
      <div className="flex items-center gap-2">
        <Sparkles className="h-7 w-7 text-primary" />
        <h1 className="text-xl font-bold tracking-tight">PanelFlow</h1>
      </div>
      
      {file && (
        <>
          <Separator orientation="vertical" className="mx-4 h-8" />
          <TooltipProvider>
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={() => undo()} disabled={pastStates.length === 0}>
                    <Undo2 className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Undo (Ctrl+Z)</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={() => redo()} disabled={futureStates.length === 0}>
                    <Redo2 className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Redo (Ctrl+Y)</p>
                </TooltipContent>
              </Tooltip>
              <Separator orientation="vertical" className="mx-2 h-8" />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant={isCreatingPanel ? "secondary" : "ghost"} size="icon" onClick={toggleCreatePanel}>
                    <Square className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Create Panel</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </>
      )}

      <div className="ml-auto flex items-center gap-2">
        <Button variant="outline" onClick={onBrowseClick}>
          <FilePlus className="mr-2 h-4 w-4" />
          {file ? 'Change PDF' : 'Upload PDF'}
        </Button>
        {file && (
          <Button onClick={exportToCbz}>
            <Download className="mr-2 h-4 w-4" />
            Export .cbz
          </Button>
        )}
      </div>
    </header>
  );
}
