"use client";

import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export function PageThumbnails() {
  const { pages, currentPageIndex, setCurrentPageIndex, isProcessing } = useStore();

  if (!pages.length && !isProcessing) {
    return null;
  }

  return (
    <aside className="w-48 border-r bg-card p-2 shrink-0">
      <ScrollArea className="h-full">
        <div className="space-y-2">
          {pages.length > 0
            ? pages.map((page, index) => (
                <button
                  key={page.pageNumber}
                  onClick={() => setCurrentPageIndex(index)}
                  className={cn(
                    "block w-full rounded-md border-2 p-1 transition-colors",
                    currentPageIndex === index
                      ? "border-primary"
                      : "border-transparent hover:border-primary/50"
                  )}
                >
                  <div className="relative">
                    <Image
                      src={page.imageUrl}
                      width={page.width}
                      height={page.height}
                      alt={`Page ${page.pageNumber}`}
                      className="rounded-sm"
                    />
                    <Badge variant="secondary" className="absolute bottom-1 right-1">
                      {page.pageNumber}
                    </Badge>
                     {isProcessing && !page.panels.length && (
                        <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
                            <svg className="animate-spin h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        </div>
                    )}
                  </div>
                </button>
              ))
            : Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="w-full aspect-[2/3] rounded-md" />
              ))}
        </div>
      </ScrollArea>
    </aside>
  );
}
