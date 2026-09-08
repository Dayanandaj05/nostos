"use client";

import React, { useState, useRef, useEffect, MouseEvent, TouchEvent } from "react";
import { Card } from "@/components/ui/Card";
import { getTeamId } from "@/app/actions/getTeamId";
import { supabase } from "@/lib/supabase";
import { Scroll, Check } from "lucide-react";

interface DecoderWheelProps {
  data: { scrolls: string[] };
  incorrectCount: number;
  storyText?: string;
  children?: React.ReactNode;
}

export function DecoderWheel({ data, incorrectCount, storyText, children }: DecoderWheelProps) {
  const [shift, setShift] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [broadcasted, setBroadcasted] = useState(false);
  const wheelRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    async function initChannel() {
      const tid = await getTeamId();
      if (tid) {
        const channel = supabase.channel(`crew_chat_${tid}`, {
          config: { broadcast: { self: true } }
        });
        channel.subscribe();
        channelRef.current = channel;
      }
    }
    initChannel();

    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, []);

  const broadcastShift = () => {
    if (!channelRef.current) return;
    let token = localStorage.getItem("nostos_device_token") || "";
    const shortId = token.slice(0, 4).toUpperCase();

    channelRef.current.send({
      type: 'broadcast',
      event: 'new_message',
      payload: {
        id: crypto.randomUUID(),
        sender: `Sailor #${shortId}`,
        text: `🔮 Decoder Wheel Aligned to Shift: ${shift}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    });

    setBroadcasted(true);
    setTimeout(() => setBroadcasted(false), 3000);
  };
  
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
    <div className="w-full space-y-8 select-none relative">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: Story Text Card & Decoded Scroll Box */}
        <div className="lg:col-span-7 space-y-6">
          {storyText && (
            <Card className="bg-ink/60 border border-wave/20 p-8 md:p-10 shadow-2xl backdrop-blur-md">
              <div className="prose prose-invert prose-p:font-serif prose-p:text-xl prose-p:leading-relaxed prose-p:text-parchment/90 max-w-none">
                {storyText.split('\n\n').map((paragraph: string, i: number) => (
                  <p key={i}>
                    {i === 0 ? (
                      <span className="float-left text-7xl font-bold text-gold mr-3 mt-2 leading-none font-serif uppercase">
                        {paragraph.charAt(0)}
                      </span>
                    ) : null}
                    {i === 0 ? paragraph.slice(1) : paragraph}
                  </p>
                ))}
              </div>
            </Card>
          )}

          <div className="bg-ink/70 border border-gold/30 p-6 md:p-8 rounded-xl shadow-2xl backdrop-blur-md">
            <div className="flex flex-col sm:flex-row items-center justify-between border-b border-gold/20 pb-2 mb-4 gap-2">
              <p className="text-gold/90 font-serif italic text-xs tracking-widest uppercase font-bold">
                Decoded Scroll Text (Shift: {shift})
              </p>
              <button
                onClick={broadcastShift}
                className="px-3 py-1 bg-gold/15 hover:bg-gold/25 border border-gold/40 rounded text-gold font-serif text-[11px] uppercase tracking-widest flex items-center space-x-1.5 transition-all"
              >
                {broadcasted ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400 font-bold">Sent!</span>
                  </>
                ) : (
                  <>
                    <Scroll className="w-3 h-3 text-gold" />
                    <span>Share Shift {shift} to Crew</span>
                  </>
                )}
              </button>
            </div>
            <div className="space-y-4">
              {data.scrolls.map((scroll, idx) => (
                <div key={idx} className="relative p-4 bg-ink/60 border-l-2 border-gold/60 rounded-r shadow-lg">
                  <div className="absolute -left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-gold/20 border border-gold/60 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-gold" />
                  </div>
                  <p className="font-serif text-lg md:text-xl text-parchment tracking-wide pl-2 leading-relaxed">
                    {decodeText(scroll, shift)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {incorrectCount >= 3 && (
            <div className="w-full text-center pt-2">
              <p className="text-gold/70 font-serif italic text-sm">
                "The scrolls whisper of a shift, thrice removed..."
              </p>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Caesar Decoder Wheel */}
        <div className="lg:col-span-5 flex flex-col items-center space-y-4">
          <h3 className="text-xl text-gold/80 tracking-widest uppercase text-center">The Enigma</h3>
          <p className="text-parchment/50 tracking-widest text-xs uppercase text-center w-full">
            Drag to align the stars
          </p>
          
          <div className="relative w-[300px] h-[300px] sm:w-[340px] sm:h-[340px] flex justify-center items-center my-2">
            {/* Outer Ring */}
            <div className="absolute inset-0 rounded-full border border-gold/20 flex items-center justify-center pointer-events-none">
               {ALPHABET.map((letter, i) => {
                 const angle = i * (360 / 26);
                 return (
                   <div 
                     key={i} 
                     className="absolute inset-0 flex justify-center"
                     style={{ transform: `rotate(${angle}deg)` }}
                   >
                     <div className="flex flex-col items-center -mt-8">
                       <span 
                         className="text-gold/60 font-serif text-xs sm:text-sm font-bold transition-transform duration-75"
                         style={{ transform: `rotate(-${angle}deg)` }}
                       >
                         {letter}
                       </span>
                       <div className="w-[1px] h-3 bg-gold/40 mt-1"></div>
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
              className="relative w-56 h-56 sm:w-64 sm:h-64 rounded-full bg-ink/90 border-2 border-gold/40 shadow-[0_0_40px_rgba(201,162,75,0.15)] flex items-center justify-center cursor-grab active:cursor-grabbing z-10 transition-transform duration-75"
              style={{ transform: `rotate(${shift * (360 / 26)}deg)` }}
            >
              
              {/* Inner Ring Alphabet */}
              {ALPHABET.map((letter, i) => {
                 const angle = i * (360 / 26);
                 const totalAngle = angle + (shift * (360 / 26));
                 const isPointer = letter === 'A';
                 
                 return (
                   <div 
                     key={i} 
                     className="absolute inset-0 flex justify-center pointer-events-none"
                     style={{ transform: `rotate(${angle}deg)` }}
                   >
                     <div className="flex flex-col items-center mt-2">
                       <div className={`w-[2px] h-3 mb-1 ${isPointer ? 'bg-gold shadow-[0_0_8px_rgba(201,162,75,0.8)]' : 'bg-gold/30'}`}></div>
                       <span 
                         className={`${isPointer ? 'text-gold font-bold drop-shadow-[0_0_8px_rgba(201,162,75,0.8)]' : 'text-gold/80'} font-serif text-xs transition-transform duration-75`}
                         style={{ transform: `rotate(-${totalAngle}deg)` }}
                       >
                         {letter}
                       </span>
                     </div>
                   </div>
                 );
               })}

              {/* Central Hub */}
              <div className="w-14 h-14 rounded-full border-4 border-double border-gold/60 flex items-center justify-center bg-ink shadow-inner z-20">
                <span className="text-gold font-serif text-xl" style={{ transform: `rotate(-${shift * (360 / 26)}deg)` }}>{shift}</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* BOTTOM CENTER: Answer Form */}
      {children && (
        <div className="max-w-2xl mx-auto w-full pt-4">
          {children}
        </div>
      )}
    </div>
  );
}
