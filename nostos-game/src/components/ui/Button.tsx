import * as React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  isError?: boolean;
  variant?: "primary" | "secondary" | "danger" | "outline";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", isLoading, isError, children, disabled, ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center font-serif text-lg tracking-widest transition-all duration-500 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-30 px-8 py-3 border-y border-transparent";
    
    const variants = {
      primary: "border-y-gold/40 text-gold hover:border-y-gold hover:text-parchment hover:bg-gold/5",
      secondary: "border-y-wave/30 text-parchment hover:border-y-wave hover:bg-wave/10",
      danger: "border-y-danger/50 text-danger hover:border-y-danger hover:bg-danger/10",
      outline: "border-y-parchment/20 text-parchment/70 hover:border-y-parchment/80 hover:text-parchment",
    };

    if (isError) {
      return (
        <button
          ref={ref}
          disabled
          className={cn(baseStyles, "bg-danger text-parchment", className)}
          {...props}
        >
          Failed
        </button>
      );
    }

    return (
      <button
        ref={ref}
        disabled={isLoading || disabled}
        className={cn(baseStyles, variants[variant], className)}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
