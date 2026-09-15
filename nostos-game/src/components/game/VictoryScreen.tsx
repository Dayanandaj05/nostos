"use client";

import React, { useEffect, useState, useTransition } from "react";
import { TeamSyncProvider, useTeamSync } from "@/components/game/TeamSyncProvider";
import { CrewChat } from "@/components/game/CrewChat";
import { OceanCanvas } from "@/components/ui/OceanCanvas";
import { Anchor, CheckCircle2, Circle, LogOut } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { logoutTeam } from "@/app/actions/auth";

interface MemberStat {
  name: string;
  voyageTime: string;
  incorrectCount: number;
}

interface VictoryScreenInnerProps {
  shipName: string;
  myTime: string;
  myIncorrectCount: number;
  memberStats: MemberStat[];
}

function VictoryScreenInner({ shipName, myTime, myIncorrectCount, memberStats }: VictoryScreenInnerProps) {
  const { connectedMembers, doneMembers, activeMemberNames, deviceAlias, markDone } = useTeamSync();
  const [isPending, startTransition] = useTransition();

  const crewList = activeMemberNames.length > 0 ? activeMemberNames : connectedMembers.map(m => m.alias);

  const isEveryoneDone = crewList.length > 0 && crewList.every(name =>
    doneMembers.some(m => m.alias.toLowerCase() === name.toLowerCase() && m.isDone)
  );

  // Mark myself done immediately on mount
  useEffect(() => {
    markDone(true);
  }, [markDone]);

  const handleExit = () => {
    startTransition(async () => {
      await logoutTeam();
    });
  };

  if (!isEveryoneDone) {
    return (
      <div className="w-full max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500 relative z-10 text-center">
        <Anchor className="w-20 h-20 text-gold mx-auto animate-pulse drop-shadow-[0_0_15px_rgba(201,162,75,0.5)]" />
        <div>
          <h1 className="text-4xl font-serif text-gold tracking-widest uppercase">Home at Last</h1>
          <p className="text-parchment/70 font-serif text-lg italic mt-2">The {shipName} has arrived</p>
        </div>

        <Card className="bg-ink/80 border border-gold/30 p-6 backdrop-blur-md">
          <h3 className="text-xs uppercase tracking-widest text-parchment/50 font-bold mb-4 border-b border-gold/10 pb-2">
            Waiting for Crew ({doneMembers.filter(m => m.isDone).length} / {crewList.length} Arrived)
          </h3>
          <ul className="space-y-4">
            {crewList.map(name => {
              const isDone = doneMembers.some(m => m.alias.toLowerCase() === name.toLowerCase() && m.isDone);
              const isYou = name.toLowerCase() === deviceAlias.toLowerCase();
              return (
                <li key={name} className="flex justify-between items-center p-3 border-b border-gold/10 last:border-0">
                  <span className={`font-serif uppercase tracking-widest ${isDone ? "text-gold font-bold" : "text-parchment/60"}`}>
                    {name} {isYou && "(You)"}
                  </span>
                  {isDone ? (
                    <span className="flex items-center text-success text-sm font-bold uppercase tracking-wider">
                      <CheckCircle2 className="w-5 h-5 mr-2" /> Arrived
                    </span>
                  ) : (
                    <span className="flex items-center text-parchment/40 text-sm font-bold uppercase tracking-wider">
                      <Circle className="w-5 h-5 mr-2" /> Sailing...
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </Card>

        <p className="text-gold/80 font-serif italic animate-pulse">
          Waiting for all sailors to reach Ithaca...
        </p>
      </div>
    );
  }

  // Everyone is done — show final stats
  return (
    <div className="w-full max-w-3xl mx-auto space-y-8 animate-in fade-in duration-700 relative z-10 text-center">
      <Anchor className="w-24 h-24 text-gold mx-auto drop-shadow-[0_0_20px_rgba(201,162,75,0.6)]" />
      <div>
        <h1 className="text-5xl md:text-7xl font-serif text-gold tracking-widest uppercase drop-shadow-[0_0_20px_rgba(201,162,75,0.8)]">
          Home at Last
        </h1>
        <h2 className="text-2xl font-serif text-parchment/90 tracking-widest uppercase mt-2">
          The {shipName} has arrived
        </h2>
      </div>

      <Card className="bg-[#0B121E]/90 border border-gold/30 p-6 backdrop-blur-md shadow-[0_0_30px_rgba(201,162,75,0.15)]">
        <h3 className="text-xs uppercase tracking-widest text-parchment/50 font-bold mb-6 border-b border-gold/10 pb-3">
          Crew Voyage Records
        </h3>
        <div className="grid grid-cols-3 gap-2 text-xs uppercase tracking-widest text-parchment/40 font-bold mb-3 px-3">
          <span className="text-left">Sailor</span>
          <span className="text-center">Voyage Time</span>
          <span className="text-right">Gods Laughed</span>
        </div>
        <ul className="space-y-2">
          {memberStats.map((stat, i) => {
            const isYou = stat.name.toLowerCase() === deviceAlias.toLowerCase();
            return (
              <li key={stat.name} className={`grid grid-cols-3 gap-2 items-center p-3 rounded-lg border ${isYou ? "border-gold/40 bg-gold/5" : "border-gold/10"}`}>
                <span className={`font-serif uppercase tracking-widest text-sm text-left ${isYou ? "text-gold font-bold" : "text-parchment"}`}>
                  {stat.name} {isYou && <span className="text-gold/60 text-xs">(You)</span>}
                </span>
                <span className="font-mono text-gold text-center">{stat.voyageTime}</span>
                <span className="font-mono text-danger text-right">{stat.incorrectCount} <span className="text-parchment/40 text-xs">faults</span></span>
              </li>
            );
          })}
        </ul>
      </Card>

      <p className="text-lg font-serif italic text-parchment/60 max-w-2xl mx-auto">
        You have navigated the trials, bested the gods, and reached the shores of Ithaca. Your legend is eternal.
      </p>

      <Button
        onClick={handleExit}
        disabled={isPending}
        className="w-full max-w-sm mx-auto py-4 text-xl flex items-center justify-center gap-3"
      >
        <LogOut className="w-5 h-5" />
        {isPending ? "Departing..." : "Leave the Ship"}
      </Button>
    </div>
  );
}

interface VictoryScreenProps {
  teamId: string;
  username: string;
  shipName: string;
  memberNames: string[];
  myTime: string;
  myIncorrectCount: number;
  memberStats: MemberStat[];
}

export function VictoryScreen({ teamId, username, shipName, memberNames, myTime, myIncorrectCount, memberStats }: VictoryScreenProps) {
  return (
    <TeamSyncProvider teamId={teamId} username={username} memberNames={memberNames} levelNumber={11}>
      <main className="min-h-screen bg-ink text-parchment flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="fixed inset-0 opacity-35 pointer-events-none z-0">
          <OceanCanvas />
        </div>
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,rgba(15,23,37,0.70)_0%,rgba(15,23,37,0.90)_70%,rgba(10,16,25,0.97)_100%)] pointer-events-none z-0" />
        <VictoryScreenInner
          shipName={shipName}
          myTime={myTime}
          myIncorrectCount={myIncorrectCount}
          memberStats={memberStats}
        />
      </main>
      <CrewChat levelId="finished" levelNumber={10} teamId={teamId} />
    </TeamSyncProvider>
  );
}
