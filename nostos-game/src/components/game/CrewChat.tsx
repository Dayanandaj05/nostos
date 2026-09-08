"use client";

import React, { useState, useEffect, useRef } from "react";
import { getTeamId } from "@/app/actions/getTeamId";
import { supabase } from "@/lib/supabase";
import { MessageSquare, X, Send, Scroll, Sparkles } from "lucide-react";

interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: string;
}

export function CrewChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [deviceAlias, setDeviceAlias] = useState<string>("Sailor");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  
  const channelRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function initChat() {
      // 1. Get or generate device token alias
      let token = localStorage.getItem("nostos_device_token");
      if (!token) {
        token = crypto.randomUUID();
        localStorage.setItem("nostos_device_token", token);
      }
      const shortId = token.slice(0, 4).toUpperCase();
      setDeviceAlias(`Sailor #${shortId}`);

      // 2. Fetch Team ID and setup Realtime
      const tid = await getTeamId();
      if (tid) {
        setTeamId(tid);
        const channel = supabase.channel(`crew_chat_${tid}`, {
          config: { broadcast: { self: true } }
        });

        channel.on('broadcast', { event: 'new_message' }, (payload) => {
          const newMsg: ChatMessage = payload.payload;
          setMessages(prev => [...prev, newMsg]);
          
          if (!isOpen) {
            setUnreadCount(prev => prev + 1);
          }
        }).subscribe();

        channelRef.current = channel;
      }
    }

    initChat();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  // Auto scroll to bottom when messages update
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const toggleOpen = () => {
    if (!isOpen) {
      setUnreadCount(0);
    }
    setIsOpen(!isOpen);
  };

  // Load saved messages from sessionStorage on mount
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("nostos_crew_chat_msgs");
      if (saved) {
        setMessages(JSON.parse(saved));
      }
    } catch (e) {}
  }, []);

  // Save messages to sessionStorage whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      try {
        sessionStorage.setItem("nostos_crew_chat_msgs", JSON.stringify(messages));
      } catch (e) {}
    }
  }, [messages]);

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    const newMsg: ChatMessage = {
      id: crypto.randomUUID(),
      sender: deviceAlias,
      text: inputText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // 1. Immediately append to local state so sender sees their own message
    setMessages(prev => [...prev, newMsg]);

    // 2. Broadcast to crew via WebSockets
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'new_message',
        payload: newMsg
      });
    }

    setInputText("");
  };

  const sendPresetMessage = (presetText: string) => {
    const newMsg: ChatMessage = {
      id: crypto.randomUUID(),
      sender: deviceAlias,
      text: presetText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // 1. Immediately append to local state
    setMessages(prev => [...prev, newMsg]);

    // 2. Broadcast
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'new_message',
        payload: newMsg
      });
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 select-none">
      
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={toggleOpen}
          className="relative flex items-center space-x-3 px-5 py-3 bg-[#0B121E]/95 border-2 border-gold/60 text-gold rounded-full shadow-[0_0_25px_rgba(201,162,75,0.3)] hover:bg-gold/15 hover:scale-105 transition-all duration-300 backdrop-blur-md group"
        >
          <Scroll className="w-5 h-5 group-hover:rotate-12 transition-transform" />
          <span className="font-serif text-sm tracking-widest uppercase font-bold">
            Crew Telepathy
          </span>
          {unreadCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-gold text-ink font-bold text-xs w-6 h-6 rounded-full flex items-center justify-center animate-bounce shadow-md">
              {unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Expanded Chat Window */}
      {isOpen && (
        <div className="w-[340px] sm:w-[380px] h-[460px] bg-[#0A0E17]/95 border-2 border-gold/50 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] backdrop-blur-xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
          
          {/* Header */}
          <div className="bg-[#0f172a] border-b border-gold/30 px-5 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-gold/15 border border-gold/40 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-gold" />
              </div>
              <div>
                <h4 className="text-gold font-serif text-sm tracking-widest uppercase font-bold">Crew Telepathy</h4>
                <p className="text-parchment/50 font-serif text-xs">Shared Telepathic Parchment</p>
              </div>
            </div>
            <button 
              onClick={toggleOpen}
              className="text-parchment/60 hover:text-gold p-1 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Actions Presets */}
          <div className="bg-ink/40 border-b border-gold/10 px-4 py-2 flex space-x-2 overflow-x-auto text-xs font-serif">
            <button 
              onClick={() => sendPresetMessage("I solved my riddle!")}
              className="px-3 py-1 bg-gold/10 hover:bg-gold/20 text-gold border border-gold/30 rounded-full whitespace-nowrap transition-colors"
            >
              💡 "I solved my riddle!"
            </button>
            <button 
              onClick={() => sendPresetMessage("What clue do you see?")}
              className="px-3 py-1 bg-gold/10 hover:bg-gold/20 text-gold border border-gold/30 rounded-full whitespace-nowrap transition-colors"
            >
              ❓ "What do you see?"
            </button>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 scrollbar-thin scrollbar-thumb-gold/20">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
                <Scroll className="w-8 h-8 text-gold/30" />
                <p className="text-parchment/40 font-serif italic text-sm">
                  No telepathic messages yet. Transmit discovered clues, words, or coordinates to your crew!
                </p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.sender === deviceAlias;
                return (
                  <div 
                    key={msg.id} 
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-[10px] font-serif uppercase tracking-widest text-gold/70 font-bold">
                        {msg.sender}
                      </span>
                      <span className="text-[9px] text-parchment/40 font-mono">
                        {msg.timestamp}
                      </span>
                    </div>
                    <div className={`px-4 py-2.5 rounded-xl max-w-[85%] font-serif text-sm leading-relaxed ${
                      isMe 
                        ? 'bg-gold/20 text-parchment border border-gold/40 rounded-tr-none' 
                        : 'bg-ink/80 text-parchment/90 border border-wave/20 rounded-tl-none shadow-md'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <form onSubmit={handleSendMessage} className="p-3 bg-[#0B121E] border-t border-gold/20 flex items-center space-x-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Transmit clue to crew..."
              className="flex-1 bg-ink/90 border border-gold/30 focus:border-gold px-4 py-2 rounded-xl text-parchment font-serif text-sm outline-none placeholder:text-parchment/30"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="p-2.5 bg-gold text-ink rounded-xl font-bold hover:bg-gold/80 disabled:opacity-30 disabled:hover:bg-gold transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>
      )}

    </div>
  );
}
