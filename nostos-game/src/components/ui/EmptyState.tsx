import * as React from "react";
import { cn } from "@/lib/utils";
import { Ship } from "lucide-react";

export interface EmptyStateProps {
  title?: string;
  message?: string;
  className?: string;
  icon?: React.ReactNode;
}

export const EmptyState = ({ 
  title = "No voyage found", 
  message = "The waters are empty here. Nothing to see.", 
  className,
  icon = <Ship className="h-16 w-16 text-ink/40" />
}: EmptyStateProps) => {
  return (
    <div className={cn("flex flex-col items-center justify-center p-12 border-2 border-dashed border-ink/30 bg-parchment/50 text-center", className)}>
      <div className="mb-6">
        {icon}
      </div>
      <h3 className="mb-4 text-2xl font-serif font-bold uppercase tracking-widest text-ink">{title}</h3>
      <p className="text-lg font-serif italic text-ink/70 max-w-md">{message}</p>
    </div>
  );
};
