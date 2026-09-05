import * as React from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export const Modal = ({ isOpen, onClose, title, children, className }: ModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-ink/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className={cn(
        "relative z-50 w-full max-w-xl scale-100 border-[3px] border-double border-ink bg-parchment p-12 text-ink shadow-2xl transition-transform",
        className
      )}>
        {title && (
          <div className="mb-8 text-3xl font-serif font-bold text-ink text-center uppercase tracking-widest border-b-2 border-ink/20 pb-4">
            {title}
          </div>
        )}
        <button
          onClick={onClose}
          className="absolute right-6 top-6 opacity-70 transition-opacity hover:opacity-100 focus:outline-none"
        >
          <X className="h-5 w-5 text-parchment" />
          <span className="sr-only">Close</span>
        </button>
        
        <div className="mt-2">
          {children}
        </div>
      </div>
    </div>
  );
};
