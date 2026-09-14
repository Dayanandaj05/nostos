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
  broadcastLevelAdvance: (targetLevel?: number) => void;
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

  // Periodic heartbeat to keep session active, detect displacement, and auto-sync level
  useEffect(() => {
    const runHeartbeat = async () => {
      try {
        const res = await sessionHeartbeat();
        if (res && res.active === false) {
          router.push("/login?error=session_displaced");
          return;
        }

        if (res && res.active && levelNumber !== undefined && res.currentLevel !== undefined) {
          if (res.currentLevel !== levelNumber) {
            router.refresh();
          }
        }
      } catch (err) {
        // Ignore network errors in heartbeat
      }
    };

    // Run initial heartbeat
    runHeartbeat();

    // Repeat every 4 seconds for fast multi-device level synchronization
    const interval = setInterval(runHeartbeat, 4000);
    return () => clearInterval(interval);
  }, [router, levelNumber]);

  useEffect(() => {
    let token = sessionStorage.getItem("nostos_device_token");
    if (!token) {
      token = crypto.randomUUID();
      sessionStorage.setItem("nostos_device_token", token);
    }
    setDeviceToken(token);
    const alias = username;
    setDeviceAlias(alias);

    // Reset local state for fresh level mount
    setMyState({ isReady: false, isDone: false });

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
              isReady: presence.isReady ?? false,
              isDone: !!presence.isDone
            });
          }
        }
        setMembers(connected);
      })
      .on('broadcast', { event: 'level_advanced' }, () => {
        if (document.body.classList.contains('transitioning-level')) return;
        document.body.classList.add('transitioning-level');
        router.refresh();
        setTimeout(() => document.body.classList.remove('transitioning-level'), 4000);
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
          if (document.body.classList.contains('transitioning-level')) return;
          document.body.classList.add('transitioning-level');
          router.refresh();
          setTimeout(() => document.body.classList.remove('transitioning-level'), 4000);
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

  const broadcastLevelAdvance = (targetLevel?: number) => {
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'level_advanced',
        payload: { targetLevel }
      });
    }
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
      broadcastLevelAdvance,
      channelRef: channelRef.current
    }}>
      {children}
    </TeamSyncContext.Provider>
  );
}
