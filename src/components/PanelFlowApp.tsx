"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import { useStore } from "@/lib/store";
import { Header } from "@/components/Header";
import { PageThumbnails } from "@/components/PageThumbnails";
import { Editor } from "@/components/Editor";
import { Card } from "@/components/ui/card";
import { UploadCloud, FileText } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export function PanelFlowApp() {
  const { file, setFile, isProcessing, pages } = useStore();
  const [isMounted, setIsMounted] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleFileChange = (files: FileList | null) => {
    if (files && files[0] && files[0].type === "application/pdf") {
      setFile(files[0]);
    }
  };

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragOver(false);
      handleFileChange(e.dataTransfer.files);
    },
    []
  );
  
  const onBrowseClick = () => {
    fileInputRef.current?.click();
  }

  if (!isMounted) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen flex-col bg-background font-body text-foreground">
      <Header onBrowseClick={onBrowseClick} />
      <div className="flex flex-1 overflow-hidden">
        {file ? (
          <>
            <PageThumbnails />
            <main className="flex-1 overflow-auto p-4">
              <Editor />
            </main>
          </>
        ) : (
          <div className="flex-1 p-4 flex items-center justify-center">
            <Card
              className={`flex w-full max-w-2xl h-96 items-center justify-center border-2 border-dashed transition-colors ${dragOver ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
            >
              <div className="text-center space-y-4 text-muted-foreground">
                <UploadCloud className="mx-auto h-12 w-12" />
                <h3 className="text-2xl font-semibold text-foreground">Drop your PDF here</h3>
                <p>or <button onClick={onBrowseClick} className="text-primary font-medium hover:underline">browse files</button> on your computer</p>
                <p className="text-xs">All processing is done in your browser. No data ever leaves your device.</p>
              </div>
            </Card>
          </div>
        )}
      </div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => handleFileChange(e.target.files)}
        className="hidden"
        accept="application/pdf"
      />
      {isProcessing && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center z-50">
          {file && !pages.length ? (
            <p className="text-lg font-medium">Processing PDF...</p>
          ) : (
            <p className="text-lg font-medium">Detecting panels...</p>
          )}
           <div className="w-1/4 mt-4">
             <Progress value={isProcessing ? undefined : 100} className="w-full" />
           </div>
        </div>
      )}
    </div>
  );
}
