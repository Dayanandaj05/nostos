import * as React from "react";
import { cn } from "@/lib/utils";
import { Compass } from "lucide-react";

export interface LoadingSpinnerProps {
  message?: string;
  className?: string;
  fullScreen?: boolean;
}

export const LoadingSpinner = ({ message = "Navigating...", className, fullScreen }: LoadingSpinnerProps) => {
  const content = (
    <div className={cn("flex flex-col items-center justify-center space-y-6", className)}>
      <Compass className="h-16 w-16 animate-[spin_4s_linear_infinite] text-ink opacity-80" />
      {message && <p className="text-xl font-serif font-bold tracking-widest uppercase text-ink animate-pulse">{message}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-parchment/90 backdrop-blur-sm border-[6px] border-double border-ink m-4">
        {content}
      </div>
    );
  }

  return content;
};
