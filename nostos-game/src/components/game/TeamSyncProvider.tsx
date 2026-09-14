"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { sessionHeartbeat } from "@/app/actions/auth";

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
  memberNames: string[];
  deviceAlias: string;
  markReady: (ready: boolean) => void;
  markDone: (done: boolean) => void;
  broadcastSystemMessage: (text: string) => void;
  broadcastAidProposal: () => void;
  broadcastChatMessage: (text: string, customSender?: string) => void;
  channelRef: any;
}

const TeamSyncContext = createContext<TeamSyncContextType | null>(null);

export const useTeamSync = () => {
  const ctx = useContext(TeamSyncContext);
  if (!ctx) throw new Error("useTeamSync must be used within TeamSyncProvider");
  return ctx;
};

export function TeamSyncProvider({ teamId, username, memberNames = [], levelNumber, children }: { teamId: string, username: string, memberNames?: string[], levelNumber?: number, children: React.ReactNode }) {
  const [members, setMembers] = useState<SyncMember[]>([]);
  const [deviceToken, setDeviceToken] = useState<string>("");
  const [deviceAlias, setDeviceAlias] = useState<string>("");
  const [myState, setMyState] = useState({ isReady: true, isDone: false });
  const channelRef = useRef<any>(null);
  const router = useRouter();

  // Periodic heartbeat to keep session active and detect single-device displacement
  useEffect(() => {
    const runHeartbeat = async () => {
      try {
        const res = await sessionHeartbeat();
        if (res && res.active === false) {
          router.push("/login?error=session_displaced");
        }
      } catch (err) {
        // Ignore network errors in heartbeat
      }
    };

    // Run initial heartbeat
    runHeartbeat();

    // Repeat every 15 seconds
    const interval = setInterval(runHeartbeat, 15000);
    return () => clearInterval(interval);
  }, [router]);

  useEffect(() => {
    let token = localStorage.getItem("nostos_device_token");
    if (!token) {
      token = crypto.randomUUID();
      localStorage.setItem("nostos_device_token", token);
    }
    setDeviceToken(token);
    const alias = username;
    setDeviceAlias(alias);

    // Reset local state for fresh level mount
    setMyState({ isReady: true, isDone: false });

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
              isReady: presence.isReady ?? true,
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
            isReady: true,
            isDone: false
          });
        }
      });

    // Listen to database changes for progress sync
    const progressChannel = supabase.channel(`progress_sync_${teamId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'progress',
          filter: `team_id=eq.${teamId}`
        },
        () => {
          // Whenever the database updates (e.g. pending_advance toggled, or level changed)
          // we force Next.js to re-fetch the server component for all clients.
          router.refresh();
        }
      )
      .subscribe();

    // Offline fallback: if no members appear after 1.5 seconds, assume offline
    const fallbackTimer = setTimeout(() => {
      setMembers(prev => {
        if (prev.length === 0) {
          return [{
            device_token: token,
            alias,
            isReady: true,
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
      supabase.removeChannel(progressChannel);
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
    const msg: ChatMessage = {
      id: crypto.randomUUID(),
      sender: "SYSTEM",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isSystem: true
    };
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'new_message',
        payload: msg
      });
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('nostos_chat_message', { detail: msg }));
    }
  };

  const broadcastAidProposal = () => {
    const msg: ChatMessage = {
      id: crypto.randomUUID(),
      sender: deviceAlias,
      text: "I propose we use an Aid Token for a hint!",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isAidProposal: true
    };
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'new_message',
        payload: msg
      });
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('nostos_chat_message', { detail: msg }));
    }
  };

  const broadcastChatMessage = (text: string, customSender?: string) => {
    const msg: ChatMessage = {
      id: crypto.randomUUID(),
      sender: customSender || deviceAlias || "Sailor",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'new_message',
        payload: msg
      });
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('nostos_chat_message', { detail: msg }));
    }
  };

  const readyMembers = members.filter(m => m.isReady);
  const doneMembers = members.filter(m => m.isDone);

  return (
    <TeamSyncContext.Provider value={{
      connectedMembers: members,
      readyMembers,
      doneMembers,
      memberNames,
      deviceAlias,
      markReady,
      markDone,
      broadcastSystemMessage,
      broadcastAidProposal,
      broadcastChatMessage,
      channelRef: channelRef.current
    }}>
      {children}
    </TeamSyncContext.Provider>
  );
}
