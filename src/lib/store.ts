
"use client";

import { create, type StoreApi } from "zustand";
import { temporal, type TemporalState } from "zundo";
import JSZip from "jszip";
import * as pdfjsLib from "pdfjs-dist";
import type { Page, Panel } from "@/types";
import { useStore as useZustandStore } from 'zustand';

if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
}

const DPI = 300;

export type DetectionMethod = 'gemini' | 'opencv';
export type DetectPanelsFn = (pageDataUri: string) => Promise<Omit<Panel, "id">[]>;

export interface AppState {
  file: File | null;
  pages: Page[];
  currentPageIndex: number;
  selectedPanelId: string | null;
  isProcessing: boolean;
  isCreatingPanel: boolean;
  detectionMethod: DetectionMethod;

  setFile: (file: File, detectPanels: DetectPanelsFn) => Promise<void>;
  setCurrentPageIndex: (index: number) => void;
  setSelectedPanelId: (id: string | null) => void;
  updatePanel: (panelId: string, newProps: Partial<Panel>) => void;
  deletePanel: (panelId: string) => void;
  addPanel: (panel: Panel) => void;
  toggleCreatePanel: () => void;
  exportToCbz: () => Promise<void>;
  setDetectionMethod: (method: DetectionMethod) => void;
}

const store = (
  set: StoreApi<AppState>['setState'],
  get: StoreApi<AppState>['getState'],
): AppState => ({
    file: null,
    pages: [],
    currentPageIndex: 0,
    selectedPanelId: null,
    isProcessing: false,
    isCreatingPanel: false,
    detectionMethod: 'opencv',

    setDetectionMethod: (method: DetectionMethod) => set({ detectionMethod: method }),

    setFile: async (file: File, detectPanels: DetectPanelsFn) => {
      set({ isProcessing: true, file, pages: [], currentPageIndex: 0 });
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;

      const newPages: Omit<Page, "panels">[] = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: DPI / 72 });
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        if (context) {
          await page.render({ canvasContext: context, viewport }).promise;
          newPages.push({
            pageNumber: i,
            imageUrl: canvas.toDataURL(),
            width: viewport.width,
            height: viewport.height,
          });
        }
      }
      set({ pages: newPages.map(p => ({...p, panels: []})) });

      const pagesWithPanels = await Promise.all(
        newPages.map(async (page, index) => {
          try {
            const detected = await detectPanels(page.imageUrl);
            const filtered = filterNestedPanels(detected);

            const panelsWithIds: Panel[] = filtered.map((p) => ({
              ...p,
              id: `${page.pageNumber}-${Math.random().toString(36).substr(2, 9)}`,
            }));
            return { ...page, panels: panelsWithIds };
          } catch (error) {
            console.error(`Error detecting panels for page ${index + 1}:`, error);
            return { ...page, panels: [] }; // Return page without panels on error
          }
        })
      );
      
      set({ pages: pagesWithPanels, isProcessing: false });
    },

    setCurrentPageIndex: (index: number) => {
      set({ currentPageIndex: index, selectedPanelId: null });
    },

    setSelectedPanelId: (id: string | null) => {
      set({ selectedPanelId: id });
    },

    updatePanel: (panelId, newProps) => {
      set((state) => {
        const newPages = state.pages.map((page, index) => {
          if (index !== state.currentPageIndex) return page;
          return {
            ...page,
            panels: page.panels.map((panel) =>
              panel.id === panelId ? { ...panel, ...newProps } : panel
            ),
          };
        });
        return { pages: newPages };
      });
    },

    deletePanel: (panelId: string) => {
      set((state) => ({
        pages: state.pages.map((page, index) => {
          if (index !== state.currentPageIndex) return page;
          return {
            ...page,
            panels: page.panels.filter((panel) => panel.id !== panelId),
          };
        }),
        selectedPanelId: null,
      }));
    },

    addPanel: (panel: Panel) => {
      set((state) => ({
        pages: state.pages.map((page, index) => {
          if (index !== state.currentPageIndex) return page;
          return { ...page, panels: [...page.panels, panel] };
        }),
      }));
    },
    
    toggleCreatePanel: () => {
      set((state) => ({ isCreatingPanel: !state.isCreatingPanel, selectedPanelId: null }));
    },

    exportToCbz: async () => {
      const { pages, file } = get();
      if (!pages.length || !file) return;

      set({ isProcessing: true });
      const zip = new JSZip();

      for (const page of pages) {
        const image = new Image();
        image.src = page.imageUrl;
        await new Promise(resolve => image.onload = resolve);
        
        const sortedPanels = [...page.panels].sort((a, b) => a.y - b.y || a.x - b.x);

        for (let i = 0; i < sortedPanels.length; i++) {
          const panel = sortedPanels[i];
          const tempCanvas = document.createElement("canvas");
          tempCanvas.width = panel.width;
          tempCanvas.height = panel.height;
          const ctx = tempCanvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(
              image,
              panel.x,
              panel.y,
              panel.width,
              panel.height,
              0,
              0,
              panel.width,
              panel.height
            );
            const blob = await new Promise<Blob | null>(resolve => tempCanvas.toBlob(resolve, 'image/png'));
            if(blob) {
              const fileName = `p${String(page.pageNumber).padStart(3, '0')}_${String(i + 1).padStart(2, '0')}.png`;
              zip.file(fileName, blob);
            }
          }
        }
      }
      
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(zipBlob);
      const originalFileName = file.name.substring(0, file.name.lastIndexOf('.'));
      link.download = `${originalFileName}.cbz`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      set({ isProcessing: false });
    },
});

function filterNestedPanels(panels: Omit<Panel, "id">[]): Omit<Panel, "id">[] {
  let filteredPanels = [...panels];
  
  for (let i = 0; i < filteredPanels.length; i++) {
    for (let j = 0; j < filteredPanels.length; j++) {
      if (i === j) continue;

      const panelA = filteredPanels[i];
      const panelB = filteredPanels[j];
      
      if(!panelA || !panelB) continue;

      const isContained =
        panelA.x >= panelB.x &&
        panelA.y >= panelB.y &&
        panelA.x + panelA.width <= panelB.x + panelB.width &&
        panelA.y + panelA.height <= panelB.y + panelB.height;

      if (isContained) {
        delete filteredPanels[i];
      }
    }
  }
  
  return filteredPanels.filter(p => p);
}


export const useStore = create<AppState>()(
  temporal(store, {
    partialize: (state) => {
      const { pages, currentPageIndex, selectedPanelId } = state;
      return { pages, currentPageIndex, selectedPanelId };
    },
  })
);

export const useTemporalStore = <T,>(
  selector: (state: TemporalState<Pick<AppState, 'pages' | 'currentPageIndex' | 'selectedPanelId'>>) => T,
  equality?: (a: T, b: T) => boolean,
) => {
  return useZustandStore(useStore.temporal, selector, equality);
};

