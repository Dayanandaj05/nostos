import * as React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { EmptyState } from "./EmptyState";
import { ErrorBanner } from "./ErrorBanner";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  isLoading?: boolean;
  isError?: boolean;
  isEmpty?: boolean;
  errorMessage?: string;
  emptyMessage?: string;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, isLoading, isError, isEmpty, errorMessage, emptyMessage, children, ...props }, ref) => {
    const cardStyles = cn("border border-wave/20 bg-ink/50 backdrop-blur-sm text-parchment relative overflow-hidden transition-all duration-1000", className);
    
    if (isLoading) {
      return (
        <div ref={ref} className={cn(cardStyles, "flex min-h-[200px] items-center justify-center")} {...props}>
          <Loader2 className="h-8 w-8 animate-spin text-wave" />
        </div>
      );
    }

    if (isError) {
      return (
        <div ref={ref} className={cardStyles} {...props}>
          <div className="p-6">
            <ErrorBanner message={errorMessage || "Failed to load card content."} />
          </div>
        </div>
      );
    }

    if (isEmpty) {
      return (
        <div ref={ref} className={cardStyles} {...props}>
          <div className="p-6">
            <EmptyState message={emptyMessage || "No data available."} />
          </div>
        </div>
      );
    }

    return (
      <div ref={ref} className={cardStyles} {...props}>
        {children}
      </div>
    );
  }
);
Card.displayName = "Card";

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
  )
);
CardHeader.displayName = "CardHeader";

export const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn("font-serif font-bold text-2xl tracking-widest text-gold", className)} {...props} />
  )
);
CardTitle.displayName = "CardTitle";

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
  )
);
CardContent.displayName = "CardContent";
