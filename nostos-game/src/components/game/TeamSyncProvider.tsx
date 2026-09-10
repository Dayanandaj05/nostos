"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";

export interface SyncMember {
  device_token: string;
  alias: string;
  isReady: boolean;
  isDone: boolean;
}

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: string;
  isSystem?: boolean;
  isAidProposal?: boolean;
}

interface TeamSyncContextType {
  connectedMembers: SyncMember[];
  readyMembers: SyncMember[];
  doneMembers: SyncMember[];
  deviceAlias: string;
  markReady: (ready: boolean) => void;
  markDone: (done: boolean) => void;
  broadcastSystemMessage: (text: string) => void;
  broadcastAidProposal: () => void;
  channelRef: any;
}

const TeamSyncContext = createContext<TeamSyncContextType | null>(null);

export const useTeamSync = () => {
  const ctx = useContext(TeamSyncContext);
  if (!ctx) throw new Error("useTeamSync must be used within TeamSyncProvider");
  return ctx;
};

export function TeamSyncProvider({ teamId, username, children }: { teamId: string, username: string, children: React.ReactNode }) {
  const [members, setMembers] = useState<SyncMember[]>([]);
  const [deviceToken, setDeviceToken] = useState<string>("");
  const [deviceAlias, setDeviceAlias] = useState<string>("");
  const [myState, setMyState] = useState({ isReady: false, isDone: false });
  const channelRef = useRef<any>(null);

  useEffect(() => {
    let token = localStorage.getItem("nostos_device_token");
    if (!token) {
      token = crypto.randomUUID();
      localStorage.setItem("nostos_device_token", token);
    }
    setDeviceToken(token);
    const alias = username;
    setDeviceAlias(alias);

    const channel = supabase.channel(`crew_chat_${teamId}`, {
      config: {
        presence: {
          key: token,
        },
        broadcast: { self: true }
      }
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const connected: SyncMember[] = [];
        for (const key in state) {
          // Take the most recent presence state for each device
          const presence = state[key][0] as any;
          if (presence) {
            connected.push({
              device_token: key,
              alias: presence.alias || "Unknown",
              isReady: !!presence.isReady,
              isDone: !!presence.isDone
            });
          }
        }
        setMembers(connected);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            alias,
            isReady: false,
            isDone: false
          });
        }
      });

    // Offline fallback: if no members appear after 1 second, assume offline
    const fallbackTimer = setTimeout(() => {
      setMembers(prev => {
        if (prev.length === 0) {
          return [{
            device_token: token,
            alias,
            isReady: false,
            isDone: false
          }];
        }
        return prev;
      });
    }, 1500);

    channelRef.current = channel;

    return () => {
      clearTimeout(fallbackTimer);
      supabase.removeChannel(channel);
    };
  }, [teamId]);

  // Sync my state to presence when it changes
  useEffect(() => {
    if (channelRef.current && deviceToken && deviceAlias) {
      channelRef.current.track({
        alias: deviceAlias,
        isReady: myState.isReady,
        isDone: myState.isDone
      });
    }
  }, [myState, deviceAlias, deviceToken]);

  const markReady = (ready: boolean) => {
    setMyState(prev => ({ ...prev, isReady: ready }));
    setMembers(prev => prev.map(m => m.device_token === deviceToken ? { ...m, isReady: ready } : m));
  };
  const markDone = (done: boolean) => {
    setMyState(prev => ({ ...prev, isDone: done }));
    setMembers(prev => prev.map(m => m.device_token === deviceToken ? { ...m, isDone: done } : m));
  };

  const broadcastSystemMessage = (text: string) => {
    if (channelRef.current) {
      const msg: ChatMessage = {
        id: crypto.randomUUID(),
        sender: "SYSTEM",
        text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isSystem: true
      };
      channelRef.current.send({
        type: 'broadcast',
        event: 'new_message',
        payload: msg
      });
    }
  };

  const broadcastAidProposal = () => {
    if (channelRef.current) {
      const msg: ChatMessage = {
        id: crypto.randomUUID(),
        sender: deviceAlias,
        text: "I propose we use an Aid Token for a hint!",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isAidProposal: true
      };
      channelRef.current.send({
        type: 'broadcast',
        event: 'new_message',
        payload: msg
      });
    }
  };

  const readyMembers = members.filter(m => m.isReady);
  const doneMembers = members.filter(m => m.isDone);

  return (
    <TeamSyncContext.Provider value={{
      connectedMembers: members,
      readyMembers,
      doneMembers,
      deviceAlias,
      markReady,
      markDone,
      broadcastSystemMessage,
      broadcastAidProposal,
      channelRef: channelRef.current
    }}>
      {children}
    </TeamSyncContext.Provider>
  );
}
