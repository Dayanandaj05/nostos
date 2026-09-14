"use client";

import React, { useState } from "react";
import { overrideTeamLevel, toggleLevelLock, addIncidentLog } from "@/app/actions/adminActions";
import { AlertCircle, Lock, Unlock, Download } from "lucide-react";
import { OceanCanvas } from "@/components/ui/OceanCanvas";

export function AdminClient({ teams, levels, logs, currentUsername }: any) {
  const [logInput, setLogInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLevelOverride = async (teamId: string, e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLevel = parseInt(e.target.value);
    await overrideTeamLevel(teamId, newLevel);
  };

  const handleToggleLock = async (levelId: string, currentLockState: boolean) => {
    await toggleLevelLock(levelId, !currentLockState);
  };

  const handleAddLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logInput.trim() || isSubmitting) return;
    setIsSubmitting(true);
    await addIncidentLog(logInput);
    setLogInput("");
    setIsSubmitting(false);
  };

  const exportCSV = () => {
    // Sort logic for export: levels cleared (desc), then time (asc), then incorrect (asc)
    const sorted = [...teams].sort((a, b) => {
      // If completed, current_level is > 10.
      if (a.current_level !== b.current_level) {
        return b.current_level - a.current_level;
      }
      const aTime = new Date(a.completed_at || a.last_updated_at || 0).getTime() - new Date(a.first_login_at || 0).getTime();
      const bTime = new Date(b.completed_at || b.last_updated_at || 0).getTime() - new Date(b.first_login_at || 0).getTime();
      
      if (aTime !== bTime) {
        // If they both haven't started, default to 0. 
        // We want shorter time first if both have times.
        if (aTime === 0) return 1;
        if (bTime === 0) return -1;
        return aTime - bTime;
      }

      return (a.incorrect_count || 0) - (b.incorrect_count || 0);
    });

    const headers = ["Rank", "Ship Name", "Current Level", "Correct Answers", "Incorrect Answers", "Completed At"];
    const rows = sorted.map((t, idx) => [
      idx + 1,
      t.teams.ship_name,
      t.current_level > 10 ? "FINISHED" : t.current_level,
      t.correct_count || 0,
      t.incorrect_count || 0,
      t.completed_at ? new Date(t.completed_at).toLocaleString() : "N/A"
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "nostos_leaderboard_rankings.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-ink text-parchment p-8 relative overflow-hidden">
      {/* Less Intense Animated Ocean Canvas Background */}
      <div className="fixed inset-0 opacity-35 pointer-events-none z-0">
        <OceanCanvas />
      </div>
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,rgba(15,23,37,0.70)_0%,rgba(15,23,37,0.90)_70%,rgba(10,16,25,0.97)_100%)] pointer-events-none z-0" />

      <div className="relative z-10">
      <header className="flex justify-between items-end mb-8 border-b border-gold/20 pb-4">
        <div>
          <h1 className="text-4xl font-serif text-gold uppercase tracking-widest">Admin Control</h1>
          <p className="text-parchment/60 font-mono text-sm mt-2">Logged in as {currentUsername}</p>
        </div>
        <button 
          onClick={exportCSV}
          className="flex items-center space-x-2 bg-gold/10 hover:bg-gold/20 border border-gold/50 text-gold px-4 py-2 rounded transition-colors"
        >
          <Download className="w-4 h-4" />
          <span className="uppercase tracking-widest text-sm">Export Rankings CSV</span>
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Teams and Levels */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Teams Table */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
            <h2 className="text-xl font-serif text-gold mb-4 uppercase tracking-widest">Team Fleet</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm font-mono">
                <thead className="text-parchment/50 border-b border-zinc-800">
                  <tr>
                    <th className="pb-2">Ship Name</th>
                    <th className="pb-2">Current Level</th>
                    <th className="pb-2">Mistakes</th>
                    <th className="pb-2">Override</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {teams.map((t: any) => (
                    <tr key={t.team_id} className="hover:bg-zinc-800/20">
                      <td className="py-3 font-serif text-gold">{t.teams.ship_name}</td>
                      <td className="py-3">{t.current_level > 10 ? 'DONE' : t.current_level}</td>
                      <td className="py-3 text-danger">{t.incorrect_count || 0}</td>
                      <td className="py-3">
                        <select 
                          className="bg-black border border-zinc-700 rounded px-2 py-1 text-xs"
                          value={t.current_level}
                          onChange={(e) => handleLevelOverride(t.team_id, e)}
                        >
                          {[1,2,3,4,5,6,7,8,9,10,11].map(lvl => (
                            <option key={lvl} value={lvl}>{lvl > 10 ? 'DONE' : `Level ${lvl}`}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Level Locks */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
            <h2 className="text-xl font-serif text-gold mb-4 uppercase tracking-widest">Oracle Locks</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {levels.sort((a:any, b:any) => a.level_number - b.level_number).map((lvl: any) => (
                <button
                  key={lvl.id}
                  onClick={() => handleToggleLock(lvl.id, lvl.is_locked)}
                  className={`flex flex-col items-center p-3 border rounded transition-colors ${
                    lvl.is_locked 
                      ? 'border-danger bg-danger/10 text-danger hover:bg-danger/20' 
                      : 'border-gold/30 bg-gold/5 text-gold hover:bg-gold/10'
                  }`}
                >
                  {lvl.is_locked ? <Lock className="w-5 h-5 mb-1" /> : <Unlock className="w-5 h-5 mb-1" />}
                  <span className="font-mono text-xs text-center">Level {lvl.level_number}</span>
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column: Incident Logs */}
        <div className="space-y-8">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6 flex flex-col h-[600px]">
            <h2 className="text-xl font-serif text-gold mb-4 uppercase tracking-widest flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Incident Logs
            </h2>
            
            <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 custom-scrollbar">
              {logs.map((log: any) => (
                <div key={log.id} className="bg-black/40 border border-zinc-800 rounded p-3 text-sm">
                  <div className="flex justify-between text-xs text-parchment/40 mb-1 font-mono">
                    <span>{log.reported_by} {log.teams ? `(Flagged: ${log.teams.ship_name})` : ''}</span>
                    <span>{new Date(log.created_at).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-parchment/90 font-serif leading-relaxed">{log.message}</p>
                </div>
              ))}
              {logs.length === 0 && (
                <p className="text-parchment/30 text-center italic mt-10 font-serif">No incidents recorded.</p>
              )}
            </div>

            <form onSubmit={handleAddLog} className="mt-auto flex gap-2">
              <input 
                type="text"
                placeholder="Log an incident or note..."
                value={logInput}
                onChange={e => setLogInput(e.target.value)}
                disabled={isSubmitting}
                className="flex-1 bg-black border border-gold/30 focus:border-gold/80 px-3 py-2 rounded text-sm text-parchment outline-none font-serif"
              />
              <button
                type="submit"
                disabled={isSubmitting || !logInput.trim()}
                className="px-3 py-2 bg-gold/10 hover:bg-gold/20 border border-gold/50 rounded text-gold text-xs uppercase tracking-widest disabled:opacity-40 transition-colors"
              >
                {isSubmitting ? '...' : 'Log'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
);
}
