import * as React from "react";
import { cn } from "@/lib/utils";
import { Loader2, AlertCircle } from "lucide-react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, isLoading, isError, errorMessage, disabled, ...props }, ref) => {
    return (
      <div className="relative w-full">
        <input
          type={type}
          className={cn(
            "flex h-12 w-full bg-transparent border-b border-parchment/30 px-4 py-2 font-serif text-xl text-parchment placeholder:text-parchment/30 focus-visible:outline-none focus-visible:border-gold disabled:cursor-not-allowed disabled:opacity-50 transition-colors duration-500",
            isError && "border-danger text-danger",
            (isLoading || isError) && "pr-10",
            className
          )}
          ref={ref}
          disabled={isLoading || disabled}
          {...props}
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-wave" />
          </div>
        )}
        {isError && !isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <AlertCircle className="h-4 w-4 text-danger" />
          </div>
        )}
        {isError && errorMessage && (
          <p className="mt-1 text-xs text-danger">{errorMessage}</p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";
