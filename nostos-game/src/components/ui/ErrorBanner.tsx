import * as React from "react";
import { cn } from "@/lib/utils";
import { AlertTriangle, XCircle } from "lucide-react";

export interface ErrorBannerProps {
  title?: string;
  message: string;
  className?: string;
  variant?: "default" | "destructive";
}

export const ErrorBanner = ({ 
  title = "Something went wrong", 
  message, 
  className,
  variant = "default" 
}: ErrorBannerProps) => {
  return (
    <div className={cn(
      "flex flex-col gap-4 border-[3px] border-double p-6 text-lg font-serif",
      variant === "default" ? "border-ink bg-parchment text-ink" : "border-danger bg-danger/10 text-danger",
      className
    )}>
      <div className="flex items-center gap-3 font-bold uppercase tracking-wider text-xl border-b border-current/20 pb-2">
        {variant === "default" ? (
          <AlertTriangle className="h-6 w-6 text-ink" />
        ) : (
          <XCircle className="h-6 w-6 text-danger" />
        )}
        {title}
      </div>
      <div className="italic opacity-90">{message}</div>
    </div>
  );
};
