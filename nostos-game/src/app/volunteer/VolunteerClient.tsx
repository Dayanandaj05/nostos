"use client";

import React, { useState } from "react";
import { addIncidentLog } from "@/app/actions/adminActions";
import { Flag, ShieldCheck } from "lucide-react";

export function VolunteerClient({ teams, currentUsername }: any) {
  const [flaggingTeamId, setFlaggingTeamId] = useState<string | null>(null);

  const handleFlag = async (teamId: string, shipName: string) => {
    if (flaggingTeamId) return;
    setFlaggingTeamId(teamId);
    await addIncidentLog(`Volunteer flagged this team for attention.`, teamId);
    setFlaggingTeamId(null);
  };

  return (
    <div className="min-h-screen bg-ink text-parchment p-8">
      <header className="flex justify-between items-end mb-8 border-b border-gold/20 pb-4">
        <div>
          <h1 className="text-4xl font-serif text-gold uppercase tracking-widest flex items-center gap-3">
            <ShieldCheck className="w-8 h-8" />
            Volunteer Watch
          </h1>
          <p className="text-parchment/60 font-mono text-sm mt-2">Logged in as {currentUsername}</p>
        </div>
      </header>

      <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6 max-w-5xl mx-auto">
        <h2 className="text-xl font-serif text-gold mb-4 uppercase tracking-widest">Active Fleet</h2>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm font-mono">
            <thead className="text-parchment/50 border-b border-zinc-800">
              <tr>
                <th className="pb-2">Ship Name</th>
                <th className="pb-2">Current Level</th>
                <th className="pb-2">Last Activity</th>
                <th className="pb-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {teams.map((t: any) => {
                const isFinished = t.current_level > 10;
                
                // Calculate time since last activity
                let timeSince = "N/A";
                let isStuck = false;
                if (t.last_updated_at && !isFinished) {
                  const diffMs = new Date().getTime() - new Date(t.last_updated_at).getTime();
                  const diffMins = Math.floor(diffMs / 60000);
                  timeSince = `${diffMins} min ago`;
                  if (diffMins > 15) isStuck = true; // Highlight teams stuck for >15 mins
                }

                return (
                  <tr key={t.team_id} className="hover:bg-zinc-800/20">
                    <td className={`py-4 font-serif text-lg ${isFinished ? 'text-gold' : 'text-parchment'}`}>
                      {t.teams.ship_name}
                    </td>
                    <td className="py-4">
                      {isFinished ? (
                        <span className="text-gold border border-gold/50 px-2 py-1 rounded text-xs">COMPLETED</span>
                      ) : (
                        `Level ${t.current_level}`
                      )}
                    </td>
                    <td className={`py-4 ${isStuck ? 'text-danger' : 'text-parchment/60'}`}>
                      {isFinished ? 'Done' : timeSince}
                    </td>
                    <td className="py-4 text-right">
                      <button
                        onClick={() => handleFlag(t.team_id, t.teams.ship_name)}
                        disabled={flaggingTeamId === t.team_id || isFinished}
                        className={`flex items-center space-x-2 px-3 py-1 rounded ml-auto text-xs uppercase tracking-widest transition-colors ${
                          isFinished 
                            ? 'opacity-30 cursor-not-allowed' 
                            : flaggingTeamId === t.team_id
                              ? 'bg-danger/20 text-danger border border-danger/50'
                              : 'bg-danger/5 text-danger border border-danger/20 hover:bg-danger/10 hover:border-danger/50'
                        }`}
                      >
                        <Flag className="w-3 h-3" />
                        <span>{flaggingTeamId === t.team_id ? 'Flagging...' : 'Flag Admin'}</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {teams.length === 0 && (
          <p className="text-center text-parchment/40 italic py-12 font-serif">No teams have set sail yet.</p>
        )}
      </div>

    </div>
  );
}
