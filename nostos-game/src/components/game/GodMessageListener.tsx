"use client";

import React, { useEffect, useState } from "react";
import { checkGodMessages, markGodMessageRead } from "@/app/actions/godMessageActions";
import { Info } from "lucide-react";

export function GodMessageListener() {
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    // Poll for new messages every 10 seconds
    const interval = setInterval(async () => {
      try {
        const res = await checkGodMessages();
        if (res.success && res.messages && res.messages.length > 0) {
          setMessages(prev => {
            const newMessages = res.messages.filter(
              (m: any) => !prev.some(pm => pm.id === m.id)
            );
            return [...prev, ...newMessages];
          });
        }
      } catch (e) {
        console.error("Failed to check god messages", e);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const handleDismiss = async (id: string) => {
    // Remove from UI immediately for responsiveness
    setMessages(prev => prev.filter(m => m.id !== id));
    // Mark as read in DB
    await markGodMessageRead(id);
  };

  if (messages.length === 0) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col space-y-4 w-full max-w-lg px-4 pointer-events-none">
      {messages.map((msg) => (
        <div 
          key={msg.id} 
          className="pointer-events-auto bg-blue-900/90 border-2 border-blue-400 rounded-lg p-5 shadow-2xl backdrop-blur-md animate-in slide-in-from-top-4 fade-in"
        >
          <div className="flex items-start space-x-3">
            <Info className="w-6 h-6 text-blue-300 mt-1 flex-shrink-0 animate-pulse" />
            <div className="flex-1">
              <h3 className="text-xl font-serif text-blue-200 uppercase tracking-widest mb-2">Message from the Gods</h3>
              <p className="text-parchment font-serif leading-relaxed text-lg mb-4">
                {msg.message}
              </p>
              <button
                onClick={() => handleDismiss(msg.id)}
                className="w-full py-2 bg-blue-500/20 hover:bg-blue-500/40 border border-blue-400/50 text-blue-200 rounded font-bold tracking-widest uppercase transition-colors"
              >
                Acknowledge
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
