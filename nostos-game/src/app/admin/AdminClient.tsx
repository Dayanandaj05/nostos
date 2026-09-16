"use client";

import React, { useState, useEffect } from "react";
import { getLiveAdminData, sendGodMessage, sendGlobalBroadcast, forgiveTeamMistake } from "@/app/actions/adminActions";
import { AlertCircle, Download, MessageSquare, Send, Megaphone, MinusCircle } from "lucide-react";
import { OceanCanvas } from "@/components/ui/OceanCanvas";

export function AdminClient({ teams: initialTeams, logs: initialLogs, currentUsername }: any) {
  const [liveTeams, setLiveTeams] = useState(initialTeams);
  const [liveLogs, setLiveLogs] = useState(initialLogs || []);
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  const [godMessage, setGodMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const [isGlobalModalOpen, setIsGlobalModalOpen] = useState(false);
  const [globalMessage, setGlobalMessage] = useState("");
  const [isSendingGlobal, setIsSendingGlobal] = useState(false);

  // Poll for live progress every 10 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const { teams, logs } = await getLiveAdminData();
        if (teams) {
          setLiveTeams(teams);
        }
        if (logs) {
          setLiveLogs(logs);
        }
      } catch (err) {
        console.error("Failed to poll live data", err);
      }
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!godMessage.trim() || !selectedTeam || isSending) return;
    setIsSending(true);
    await sendGodMessage(selectedTeam.team_id, godMessage.trim());
    setGodMessage("");
    setSelectedTeam(null);
    setIsSending(false);
    alert("Message sent to " + selectedTeam.teams.ship_name);
  };

  const handleSendGlobal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!globalMessage.trim() || isSendingGlobal) return;
    if (!confirm("Are you sure you want to broadcast this to ALL teams?")) return;
    setIsSendingGlobal(true);
    await sendGlobalBroadcast(globalMessage.trim());
    setGlobalMessage("");
    setIsGlobalModalOpen(false);
    setIsSendingGlobal(false);
    alert("Broadcast sent to all teams!");
  };

  const handleForgiveMistake = async (teamId: string, currentMistakes: number) => {
    if (currentMistakes <= 0) return;
    if (!confirm("Are you sure you want to forgive 1 mistake for this team?")) return;
    await forgiveTeamMistake(teamId, currentMistakes);
    alert("Mistake forgiven!");
    // Optimistic update
    setLiveTeams((prev: any[]) => prev.map(t => 
      t.team_id === teamId ? { ...t, incorrect_count: t.incorrect_count - 1 } : t
    ));
  };

  const exportCSV = () => {
    const sorted = [...liveTeams].sort((a, b) => {
      if (a.current_level !== b.current_level) {
        return b.current_level - a.current_level;
      }
      const aTime = new Date(a.completed_at || a.last_updated_at || 0).getTime() - new Date(a.first_login_at || 0).getTime();
      const bTime = new Date(b.completed_at || b.last_updated_at || 0).getTime() - new Date(b.first_login_at || 0).getTime();
      if (aTime !== bTime) {
        if (aTime === 0) return 1;
        if (bTime === 0) return -1;
        return aTime - bTime;
      }
      return (a.incorrect_count || 0) - (b.incorrect_count || 0);
    });

    const headers = [
      "Rank", "Ship Name", "Current Level", "Correct Answers", "Incorrect Answers", "Run Time", "Completed At",
      "Member 1", "Phone 1", "Member 2", "Phone 2", "Member 3", "Phone 3", "Member 4", "Phone 4"
    ];
    
    const rows = sorted.map((t, idx) => {
      const runTimeMs = new Date(t.completed_at || t.last_updated_at || 0).getTime() - new Date(t.first_login_at || 0).getTime();
      const runTimeStr = t.first_login_at ? `${Math.floor(runTimeMs / 60000)}m ${Math.floor((runTimeMs % 60000) / 1000)}s` : "N/A";
      
      const mNames = t.teams.member_names || [];
      const mPhones = t.teams.member_phones || [];

      return [
        idx + 1,
        `"${t.teams.ship_name}"`,
        t.current_level > 10 ? "FINISHED" : t.current_level,
        t.correct_count || 0,
        t.incorrect_count || 0,
        runTimeStr,
        t.completed_at ? new Date(t.completed_at).toLocaleString() : "N/A",
        `"${mNames[0] || ''}"`, `"${mPhones[0] || ''}"`,
        `"${mNames[1] || ''}"`, `"${mPhones[1] || ''}"`,
        `"${mNames[2] || ''}"`, `"${mPhones[2] || ''}"`,
        `"${mNames[3] || ''}"`, `"${mPhones[3] || ''}"`
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "nostos_live_rankings.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const sortedTeams = [...liveTeams].sort((a, b) => b.current_level - a.current_level);

  return (
    <div className="min-h-screen bg-ink text-parchment p-8 relative overflow-hidden">
      <div className="fixed inset-0 opacity-35 pointer-events-none z-0">
        <OceanCanvas />
      </div>
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,rgba(15,23,37,0.70)_0%,rgba(15,23,37,0.90)_70%,rgba(10,16,25,0.97)_100%)] pointer-events-none z-0" />

      <div className="relative z-10 max-w-6xl mx-auto">
        <header className="flex justify-between items-end mb-8 border-b border-gold/20 pb-4">
          <div>
            <h1 className="text-4xl font-serif text-gold uppercase tracking-widest">Olympus Oversight</h1>
            <p className="text-parchment/60 font-mono text-sm mt-2">Live tracking grid • Polling every 10s</p>
          </div>
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setIsGlobalModalOpen(true)}
              className="flex items-center space-x-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/50 text-blue-400 px-4 py-2 rounded transition-colors"
            >
              <Megaphone className="w-4 h-4" />
              <span className="uppercase tracking-widest text-sm">Global Broadcast</span>
            </button>
            <button 
              onClick={exportCSV}
              className="flex items-center space-x-2 bg-gold/10 hover:bg-gold/20 border border-gold/50 text-gold px-4 py-2 rounded transition-colors"
            >
              <Download className="w-4 h-4" />
              <span className="uppercase tracking-widest text-sm">Export Rankings CSV</span>
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Teams */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-zinc-900/60 border border-gold/30 rounded-lg p-6 shadow-2xl backdrop-blur-sm">
              <h2 className="text-xl font-serif text-gold mb-6 uppercase tracking-widest">Live Fleet Leaderboard</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm font-mono">
                  <thead className="text-parchment/50 border-b border-zinc-800">
                    <tr>
                      <th className="pb-3 px-4">Ship Name</th>
                      <th className="pb-3 px-4">Current Level</th>
                      <th className="pb-3 px-4 text-danger">Mistakes</th>
                      <th className="pb-3 px-4 text-center">Intervention</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/50">
                    {sortedTeams.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center py-8 text-parchment/40 italic font-serif">
                          No ships have entered the waters yet.
                        </td>
                      </tr>
                    ) : (
                      sortedTeams.map((t: any) => (
                        <tr key={t.team_id} className="hover:bg-zinc-800/40 transition-colors">
                          <td className="py-4 px-4 font-serif text-gold text-lg">
                            <div>{t.teams?.ship_name}</div>
                            {(t.teams?.captain_name || t.teams?.captain_phone) && (
                              <div className="text-xs text-parchment/60 font-sans mt-0.5 font-normal">
                                Capt: {t.teams.captain_name || 'N/A'} {t.teams.captain_phone ? `• ${t.teams.captain_phone}` : ''}
                              </div>
                            )}
                          </td>
                          <td className="py-4 px-4 text-lg">{t.current_level > 10 ? 'FINISHED' : t.current_level}</td>
                          <td className="py-4 px-4 text-lg">
                            <div className="flex items-center space-x-2">
                              <span className="text-danger">{t.incorrect_count || 0}</span>
                              {(t.incorrect_count || 0) > 0 && (
                                <button 
                                  onClick={() => handleForgiveMistake(t.team_id, t.incorrect_count)}
                                  title="Forgive 1 Mistake"
                                  className="text-parchment/40 hover:text-green-400 transition-colors"
                                >
                                  <MinusCircle className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <button
                              onClick={() => setSelectedTeam(t)}
                              className="inline-flex items-center space-x-2 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded text-xs uppercase tracking-wider transition-colors"
                            >
                              <MessageSquare className="w-4 h-4" />
                              <span>Send Hint</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column: Incident Logs / History */}
          <div className="space-y-8">
            <div className="bg-zinc-900/60 border border-gold/30 rounded-lg p-6 flex flex-col h-[600px] shadow-2xl backdrop-blur-sm">
              <h2 className="text-xl font-serif text-gold mb-4 uppercase tracking-widest flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                History & Logs
              </h2>
              
              <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 custom-scrollbar">
                {liveLogs.map((log: any) => (
                  <div key={log.id} className="bg-black/40 border border-zinc-800 rounded p-3 text-sm">
                    <div className="flex justify-between text-xs text-parchment/40 mb-1 font-mono">
                      <span>{log.reported_by} {log.teams ? `(To: ${log.teams.ship_name})` : ''}</span>
                      <span>{new Date(log.created_at).toLocaleTimeString()}</span>
                    </div>
                    <p className={`font-serif leading-relaxed ${log.message.startsWith('[God Message') ? 'text-blue-300' : 'text-parchment/90'}`}>
                      {log.message}
                    </p>
                  </div>
                ))}
                {liveLogs.length === 0 && (
                  <p className="text-parchment/30 text-center italic mt-10 font-serif">No history recorded.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Message from the Gods Modal */}
      {selectedTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-ink border-2 border-blue-500/50 rounded-xl max-w-md w-full p-6 shadow-2xl relative">
            <h3 className="text-2xl font-serif text-blue-400 uppercase tracking-widest mb-2">Message from the Gods</h3>
            <p className="text-sm text-parchment/70 mb-6 font-mono">
              Sending a divine hint to: <strong className="text-gold">{selectedTeam.teams.ship_name}</strong>
            </p>
            
            <form onSubmit={handleSendMessage} className="space-y-4">
              <textarea
                value={godMessage}
                onChange={e => setGodMessage(e.target.value)}
                placeholder="Type your hint here. It will appear immediately on their screen..."
                className="w-full h-32 bg-black/50 border border-blue-500/30 focus:border-blue-400/80 rounded p-3 text-parchment outline-none font-serif resize-none"
                disabled={isSending}
                required
              />
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => { setSelectedTeam(null); setGodMessage(""); }}
                  className="px-4 py-2 border border-zinc-700 hover:bg-zinc-800 text-parchment rounded text-sm tracking-wide transition-colors"
                  disabled={isSending}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSending || !godMessage.trim()}
                  className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 text-blue-300 rounded text-sm tracking-wide uppercase font-bold flex items-center space-x-2 disabled:opacity-50 transition-colors"
                >
                  {isSending ? <span>Sending...</span> : (
                    <>
                      <span>Transmit</span>
                      <Send className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Global Broadcast Modal */}
      {isGlobalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-ink border-2 border-red-500/50 rounded-xl max-w-md w-full p-6 shadow-2xl relative">
            <h3 className="text-2xl font-serif text-red-400 uppercase tracking-widest mb-2 flex items-center gap-2">
              <Megaphone className="w-6 h-6" />
              Global Broadcast
            </h3>
            <p className="text-sm text-parchment/70 mb-6 font-mono">
              Sending a divine hint to: <strong className="text-danger">EVERY ACTIVE SHIP</strong>
            </p>
            
            <form onSubmit={handleSendGlobal} className="space-y-4">
              <textarea
                value={globalMessage}
                onChange={e => setGlobalMessage(e.target.value)}
                placeholder="Type your global announcement here..."
                className="w-full h-32 bg-black/50 border border-red-500/30 focus:border-red-400/80 rounded p-3 text-parchment outline-none font-serif resize-none"
                disabled={isSendingGlobal}
                required
              />
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => { setIsGlobalModalOpen(false); setGlobalMessage(""); }}
                  className="px-4 py-2 border border-zinc-700 hover:bg-zinc-800 text-parchment rounded text-sm tracking-wide transition-colors"
                  disabled={isSendingGlobal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSendingGlobal || !globalMessage.trim()}
                  className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-300 rounded text-sm tracking-wide uppercase font-bold flex items-center space-x-2 disabled:opacity-50 transition-colors"
                >
                  {isSendingGlobal ? <span>Broadcasting...</span> : (
                    <>
                      <span>Broadcast</span>
                      <Megaphone className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
