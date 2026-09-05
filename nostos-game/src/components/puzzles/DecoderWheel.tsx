"use client";

import React, { useState, useRef, useEffect, MouseEvent, TouchEvent } from "react";

interface DecoderWheelProps {
  data: { scrolls: string[] };
  incorrectCount: number;
}

export function DecoderWheel({ data, incorrectCount }: DecoderWheelProps) {
  const [shift, setShift] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const wheelRef = useRef<HTMLDivElement>(null);
  
  // Decodes a single character using Caesar shift, forced to uppercase
  const decodeChar = (char: string, s: number) => {
    if (!char.match(/[a-z]/i)) return char;
    const code = char.toUpperCase().charCodeAt(0);
    const base = 65;
    // We apply a negative shift because usually ciphertext is shifted forward to encode
    return String.fromCharCode(((code - base - s + 26) % 26) + base);
  };

  const decodeText = (text: string, s: number) => {
    return text.split('').map(c => decodeChar(c, s)).join('');
  };

  const handlePointerDown = () => {
    setIsDragging(true);
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const calculateShift = (clientX: number, clientY: number) => {
    if (!wheelRef.current) return;
    const rect = wheelRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const deltaX = clientX - centerX;
    const deltaY = clientY - centerY;
    
    // Calculate angle in degrees
    let angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
    // Normalize to 0-360
    if (angle < 0) angle += 360;
    
    // 360 degrees / 26 letters = ~13.84 degrees per shift
    const newShift = Math.floor(angle / (360 / 26)) % 26;
    setShift(newShift);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      calculateShift(e.clientX, e.clientY);
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (isDragging && e.touches[0]) {
      calculateShift(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mouseup", handlePointerUp);
      window.addEventListener("touchend", handlePointerUp);
    } else {
      window.removeEventListener("mouseup", handlePointerUp);
      window.removeEventListener("touchend", handlePointerUp);
    }
    return () => {
      window.removeEventListener("mouseup", handlePointerUp);
      window.removeEventListener("touchend", handlePointerUp);
    };
  }, [isDragging]);

  const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  return (
    <div className="flex flex-col items-center space-y-12 w-full select-none relative pb-16">
      
      {/* Explicit In-Fiction Instruction */}
      <div className="w-full text-center max-w-xl mx-auto px-4 pb-4">
        <p className="text-parchment/80 font-serif italic text-lg leading-relaxed">
          Only one scroll speaks a true, specific path forward. The rest are hollow comforts, urging you to stay.
        </p>
      </div>
      
      {/* The Draggable Wheel UI */}
      <div className="flex flex-col items-center space-y-6">
        <p className="text-parchment/50 tracking-widest text-xs uppercase text-center w-full">
          Drag to align the stars
        </p>
        
        <div className="relative w-[340px] h-[340px] md:w-[420px] md:h-[420px] flex justify-center items-center mt-4 mb-8">
          {/* Outer Ring */}
          <div className="absolute inset-0 rounded-full border border-gold/20 flex items-center justify-center pointer-events-none">
             {/* Tick marks & Alphabet for Outer Ring */}
             {ALPHABET.map((letter, i) => {
               const angle = i * (360 / 26);
               return (
                 <div 
                   key={i} 
                   className="absolute inset-0 flex justify-center"
                   style={{ transform: `rotate(${angle}deg)` }}
                 >
                   <div className="flex flex-col items-center -mt-8 md:-mt-10">
                     <span 
                       className="text-gold/60 font-serif text-sm md:text-base font-bold transition-transform duration-75"
                       style={{ transform: `rotate(-${angle}deg)` }}
                     >
                       {letter}
                     </span>
                     <div className="w-[1px] h-3 bg-gold/40 mt-2"></div>
                   </div>
                 </div>
               );
             })}
          </div>

          {/* Inner Draggable Wheel */}
          <div 
            ref={wheelRef}
            onMouseDown={handlePointerDown}
            onTouchStart={handlePointerDown}
            onMouseMove={handleMouseMove}
            onTouchMove={handleTouchMove}
            className="relative w-64 h-64 md:w-80 md:h-80 rounded-full bg-ink/90 border-2 border-gold/40 shadow-[0_0_40px_rgba(201,162,75,0.15)] flex items-center justify-center cursor-grab active:cursor-grabbing z-10 transition-transform duration-75"
            style={{ transform: `rotate(${shift * (360 / 26)}deg)` }}
          >
            
            {/* Inner Ring Alphabet */}
            {ALPHABET.map((letter, i) => {
               const angle = i * (360 / 26);
               const totalAngle = angle + (shift * (360 / 26));
               // Highlight 'A' to serve as the pointer
               const isPointer = letter === 'A';
               
               return (
                 <div 
                   key={i} 
                   className="absolute inset-0 flex justify-center pointer-events-none"
                   style={{ transform: `rotate(${angle}deg)` }}
                 >
                   <div className="flex flex-col items-center mt-2 md:mt-3">
                     <div className={`w-[2px] h-3 mb-2 ${isPointer ? 'bg-gold shadow-[0_0_8px_rgba(201,162,75,0.8)]' : 'bg-gold/30'}`}></div>
                     <span 
                       className={`${isPointer ? 'text-gold font-bold drop-shadow-[0_0_8px_rgba(201,162,75,0.8)]' : 'text-gold/80'} font-serif text-xs md:text-sm transition-transform duration-75`}
                       style={{ transform: `rotate(-${totalAngle}deg)` }}
                     >
                       {letter}
                     </span>
                   </div>
                 </div>
               );
            })}

            {/* Central Hub */}
            <div className="w-16 h-16 rounded-full border-4 border-double border-gold/60 flex items-center justify-center bg-ink shadow-inner z-20">
              <span className="text-gold font-serif text-2xl" style={{ transform: `rotate(-${shift * (360 / 26)}deg)` }}>{shift}</span>
            </div>
          </div>
        </div>
      </div>

      {/* The Decoded Scrolls */}
      <div className="w-full space-y-6 max-w-lg mx-auto">
        {data.scrolls.map((scroll, idx) => (
          <div key={idx} className="relative p-6 bg-ink/30 border-l-2 border-gold/30 backdrop-blur-sm group">
            {/* Wax seal decoration */}
            <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-danger/20 border border-danger/40 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-danger/60" />
            </div>
            
            <p className="font-serif text-xl md:text-2xl text-parchment tracking-wide leading-relaxed">
              {decodeText(scroll, shift)}
            </p>
          </div>
        ))}
      </div>

      {/* Subtle Hint System */}
      {incorrectCount >= 3 && (
        <div className="absolute bottom-0 w-full text-center animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <p className="text-gold/60 font-serif italic text-lg drop-shadow-[0_0_10px_rgba(201,162,75,0.2)]">
            "The scrolls whisper of a shift, thrice removed..."
          </p>
        </div>
      )}

    </div>
  );
}
