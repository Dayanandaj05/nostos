"use client";

import React, { useActionState, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { submitAnswer, SubmitState } from "@/app/actions/submitAnswer";
import { confirmAdvance } from "@/app/actions/confirmAdvance";
import { PuzzleRegistry } from "@/components/puzzles/PuzzleRegistry";
import { CrewChat } from "@/components/game/CrewChat";
import { TeamSyncProvider, useTeamSync } from "@/components/game/TeamSyncProvider";
import { CheckCircle2, Circle, Users, Anchor, Compass, UserX } from "lucide-react";

const TRIAL_BRIEFING_DATA: Record<number, { title: string; subtitle: string; isTeamwork: boolean; guidelines: string[] }> = {
  1: {
    title: "Trial 1: The Lotus-Eaters",
    subtitle: "The Island of Forgetting",
    isTeamwork: false,
    guidelines: [
      "Your crew is succumbing to the lotus flowers and forgetting their home.",
      "Decode the ancient scrolls using the cryptographic wheel.",
      "Submit the true path to the Oracle before time runs out."
    ]
  },
  2: {
    title: "Trial 2: Island of Aeolus",
    subtitle: "The Keeper of the Winds",
    isTeamwork: false,
    guidelines: [
      "Tap the golden wind icons hidden among the storm clouds.",
      "Collect wind coordinates before the divine gale blows your vessel off course.",
      "Calculate the resulting vector to state your answer to the Oracle."
    ]
  },
  3: {
    title: "Trial 3: The Cyclops' Cave",
    subtitle: "Escape from Polyphemus",
    isTeamwork: false,
    guidelines: [
      "Polyphemus traps your fleet inside a dark cavern.",
      "Inspect the cave walls to locate hidden tools and objects.",
      "Use your items strategically to blind the giant and escape under the rams."
    ]
  },
  4: {
    title: "Trial 4: Land of the Laestrygonians",
    subtitle: "The Boulder Fleet Strait",
    isTeamwork: false,
    guidelines: [
      "Giant cannibals hurl massive boulders from the coastal cliffs!",
      "Solve rapid nautical & mathematical calculations within 35 seconds per round.",
      "Maneuver your ship through the straits before your fleet is destroyed."
    ]
  },
  5: {
    title: "Trial 5: Circe's Enchanted Isle",
    subtitle: "The Swine & The Holy Herb",
    isTeamwork: false,
    guidelines: [
      "Circe's witchery has transformed your sailors into swine inside her palace.",
      "Select tools from your equipment bar (Sickle, Torch, Key, Ladle).",
      "Interact with the palace elements to uncover the magical antidote herb."
    ]
  },
  6: {
    title: "Trial 6: Land of the Dead",
    subtitle: "The Underworld Asymmetric Split",
    isTeamwork: true,
    guidelines: [
      "TEAMWORK REQUIRED: The Shades assign DIFFERENT riddle fragments to each device on your team.",
      "Use the 'Crew Telepathy' chat at the bottom right to share unlocked word fragments with your crew.",
      "Combine all team fragments to form the full passcode and unlock the Underworld Gate."
    ]
  },
  7: {
    title: "Trial 7: The Sirens' Song",
    subtitle: "Sensory Role Separation",
    isTeamwork: true,
    guidelines: [
      "TEAMWORK REQUIRED: Only ONE crew member has clear hearing to see the floating melody words.",
      "All other team devices are deafened (blurred screen) by the Sirens' enchanting spell.",
      "The hearing sailor must click clear words to transmit them to the crew's shared tray!"
    ]
  },
  8: {
    title: "Trial 8: Scylla & Charybdis",
    subtitle: "The Sea Monster & The Whirlpool",
    isTeamwork: false,
    guidelines: [
      "Navigate between the 6-headed monster Scylla and the roaring whirlpool Charybdis.",
      "Path selection is instant: choose your risk level carefully.",
      "Answer the rapid tactical dilemma to steer through the narrow strait safely."
    ]
  },
  9: {
    title: "Trial 9: Cattle of Helios",
    subtitle: "Resisting Divine Temptation",
    isTeamwork: false,
    guidelines: [
      "Your starving crew lands on Thrinacia where the Sun God's cattle graze.",
      "Do NOT slaughter the golden cattle! Resist the glowing temptation.",
      "Calculate the exact sacred herd equation to honor Lord Helios."
    ]
  },
  10: {
    title: "Trial 10: Return to Ithaca",
    subtitle: "The Odyssey Grand Finale",
    isTeamwork: false,
    guidelines: [
      "Phase 1: Decode Penelope's story clue to discover Odysseus' disguise.",
      "Phase 2: Uncover the Odyssey Lore combination lock from your voyage knowledge.",
      "Phase 3: Interactive 2D Canvas Bow & Arrow game! Aim and shoot through the 12 axe handles to claim victory!"
    ]
  }
};

interface GameEngineProps {
  level: any;
  progress: any;
  teamId: string;
  username: string;
  memberNames?: string[];
  absentMembers?: string[];
}

function ReadinessGate({ levelNumber, onReady }: { levelNumber: number, onReady: () => void }) {
  const { connectedMembers, readyMembers, activeMemberNames, deviceAlias } = useTeamSync();
  const amIReady = readyMembers.some(m => m.alias.toLowerCase() === deviceAlias.toLowerCase());

  const crewList = activeMemberNames.length > 0 ? activeMemberNames : connectedMembers.map(m => m.alias);

  const briefing = TRIAL_BRIEFING_DATA[levelNumber] || {
    title: `Trial ${levelNumber}`,
    subtitle: "Unknown Waters",
    isTeamwork: false,
    guidelines: ["Rely on your wits to survive."]
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500 relative z-10 text-center">
      <Compass className="w-16 h-16 text-gold mx-auto opacity-80 animate-pulse" />
      <div>
        <h2 className="text-3xl font-serif text-gold tracking-widest uppercase">{briefing.title}</h2>
        <p className="text-parchment/70 font-serif text-lg italic">{briefing.subtitle}</p>
      </div>

      <Card className="bg-ink/80 border border-gold/30 p-6 backdrop-blur-md text-left space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-gold/10 pb-3">
          <span className="text-gold font-serif text-xs uppercase tracking-widest font-bold">Tactical Guidelines</span>
          {briefing.isTeamwork && (
            <span className="px-3 py-1 bg-gold/20 border border-gold/50 rounded-full text-gold font-serif text-[11px] uppercase tracking-widest font-bold flex items-center space-x-1">
              <Users className="w-3 h-3" />
              <span>Teamwork Required</span>
            </span>
          )}
        </div>
        <ul className="space-y-2">
          {briefing.guidelines.map((g, idx) => (
            <li key={idx} className="text-parchment/90 font-serif text-sm flex items-start space-x-2">
              <span className="text-gold font-bold">►</span>
              <span>{g}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="bg-ink/80 border border-gold/30 p-6 backdrop-blur-md">
        <h3 className="text-xs uppercase tracking-widest text-parchment/50 font-bold mb-4 border-b border-gold/10 pb-2">Crew Readiness</h3>
        <ul className="space-y-4">
          {crewList.map(name => {
            const isReady = readyMembers.some(m => m.alias.toLowerCase() === name.toLowerCase() && m.isReady);
            const isYou = name.toLowerCase() === deviceAlias.toLowerCase();
            return (
              <li key={name} className="flex justify-between items-center p-3 border-b border-gold/10 last:border-0">
                <span className={`font-serif uppercase tracking-widest ${isReady ? 'text-gold' : 'text-parchment/60'}`}>
                  {name} {isYou && "(You)"}
                </span>
                {isReady ? (
                  <span className="flex items-center text-success text-sm font-bold uppercase tracking-wider"><CheckCircle2 className="w-5 h-5 mr-2" /> Ready</span>
                ) : (
                  <span className="flex items-center text-parchment/40 text-sm font-bold uppercase tracking-wider"><Circle className="w-5 h-5 mr-2" /> Waiting</span>
                )}
              </li>
            );
          })}
        </ul>
      </Card>

      {!amIReady ? (
        <Button onClick={onReady} className="w-full py-4 text-xl">
          Begin Trial
        </Button>
      ) : (
        <p className="text-gold/80 font-serif italic animate-pulse">Waiting for the rest of the crew...</p>
      )}
    </div>
  );
}

function CompletionGate({ levelNumber }: { levelNumber: number }) {
  const { connectedMembers, doneMembers, activeMemberNames, deviceAlias, markDone } = useTeamSync();
  const [isPending, startTransition] = useTransition();

  const amIDone = doneMembers.some(m => m.alias.toLowerCase() === deviceAlias.toLowerCase() && m.isDone);

  const registeredCrew = activeMemberNames.length > 0 ? activeMemberNames : connectedMembers.map(m => m.alias);

  const isEveryoneDone = registeredCrew.length > 0 && registeredCrew.every(name =>
    doneMembers.some(m => m.alias.toLowerCase() === name.toLowerCase() && m.isDone)
  );

  // Auto-mark done when reaching this gate
  React.useEffect(() => {
    if (!amIDone) {
      markDone(true);
    }
  }, [amIDone, markDone]);

  // Auto-advance when everyone is done
  React.useEffect(() => {
    if (isEveryoneDone && !isPending) {
      startTransition(async () => {
        try {
          await confirmAdvance(levelNumber);
        } catch (e) {
          console.error(e);
        }
      });
    }
  }, [isEveryoneDone, isPending, levelNumber]);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500 relative z-10 text-center">
      <Anchor className="w-16 h-16 text-gold mx-auto opacity-80" />
      <h2 className="text-3xl font-serif text-gold tracking-widest uppercase">The Trial is Bested</h2>
      <p className="text-parchment/70 font-serif text-lg italic max-w-lg mx-auto">
        Your answer was true. Wait for your crew to finish their trials before setting sail.
      </p>

      <Card className="bg-ink/80 border border-gold/30 p-6 backdrop-blur-md">
        <h3 className="text-xs uppercase tracking-widest text-parchment/50 font-bold mb-4 border-b border-gold/10 pb-2">
          Crew Completion Status ({doneMembers.length} / {registeredCrew.length} Finished)
        </h3>
        <ul className="space-y-4">
          {registeredCrew.map((name: string) => {
            const isDone = doneMembers.some(m => m.alias.toLowerCase() === name.toLowerCase() && m.isDone);
            const isYou = name.toLowerCase() === deviceAlias.toLowerCase();
            return (
              <li key={name} className="flex justify-between items-center p-3 border-b border-gold/10 last:border-0">
                <span className={`font-serif uppercase tracking-widest ${isDone ? 'text-gold font-bold' : 'text-parchment/60'}`}>
                  {name} {isYou && "(You)"}
                </span>
                {isDone ? (
                  <span className="flex items-center text-success text-sm font-bold uppercase tracking-wider"><CheckCircle2 className="w-5 h-5 mr-2" /> Done</span>
                ) : (
                  <span className="flex items-center text-parchment/40 text-sm font-bold uppercase tracking-wider"><Circle className="w-5 h-5 mr-2" /> Working</span>
                )}
              </li>
            );
          })}
        </ul>
      </Card>

      <div className="space-y-4 mt-8">
        <p className="text-gold/80 font-serif italic animate-pulse text-lg">
          Waiting for all registered crew members to complete the trial...
        </p>
      </div>
    </div>
  );
}

function GameEngineInner({ level, progress, teamId, username, memberNames, absentMembers }: GameEngineProps) {
  const [state, formAction, isPendingForm] = useActionState<SubmitState, FormData>(submitAnswer, { success: false });
  const formRef = useRef<HTMLFormElement>(null);
  const { connectedMembers, readyMembers, markReady } = useTeamSync();

  // Allow puzzle components to trigger form submission programmatically
  React.useEffect(() => {
    const handleCustomSubmit = (e: any) => {
      const answer = e.detail;
      const fd = new FormData();
      fd.append("answer", answer);
      React.startTransition(() => {
        formAction(fd);
      });
    };
    window.addEventListener("nostos-oracle-submit", handleCustomSubmit);
    return () => window.removeEventListener("nostos-oracle-submit", handleCustomSubmit);
  }, [formAction]);

  const currentIncorrectCount = state.incorrect_count ?? progress.incorrect_count;
  
  const [localSolved, setLocalSolved] = useState(false);
  const storageKey = `nostos_solved_${teamId}_${username}_${level.id}`;

  React.useEffect(() => {
    if (state.success) {
      try { sessionStorage.setItem(storageKey, 'true'); } catch (e) {}
      setLocalSolved(true);
    } else {
      try {
        if (sessionStorage.getItem(storageKey) === 'true') {
          setLocalSolved(true);
        } else {
          setLocalSolved(false);
        }
      } catch (e) {}
    }
  }, [state.success, storageKey]);

  // A puzzle is successfully solved if either the global progress says so (from the team advancing)
  // or our local state says so (we personally solved it).
  const isSolved = localSolved || (state.success && state.completed_level === level.level_number);

  // The readiness gate is passed if everyone connected has marked ready, or during initial connection load.
  const isAllReady = connectedMembers.length === 0 || readyMembers.length === connectedMembers.length;

  if (isSolved) {
    return (
      <div className="w-full">
        <CompletionGate levelNumber={level.level_number} />
      </div>
    );
  }

  if (!isAllReady) {
    return (
      <div className="w-full">
        <ReadinessGate levelNumber={level.level_number} onReady={() => markReady(true)} />
      </div>
    );
  }

  // Common UI forms
  const renderSubmissionForm = () => (
    <Card className="bg-ink/80 border border-gold/30 p-6 shadow-2xl backdrop-blur-md relative overflow-visible mt-8">
      <div className="absolute -top-2 -left-2 w-3 h-3 border-t border-l border-gold/50" />
      <div className="absolute -top-2 -right-2 w-3 h-3 border-t border-r border-gold/50" />
      <div className="absolute -bottom-2 -left-2 w-3 h-3 border-b border-l border-gold/50" />
      <div className="absolute -bottom-2 -right-2 w-3 h-3 border-b border-r border-gold/50" />

      <form id="oracle-form" ref={formRef} action={formAction} className="space-y-6">
        <div className="space-y-2">
          <label className="text-parchment/60 uppercase tracking-widest text-sm flex justify-between">
            <span>Your Answer</span>
            {currentIncorrectCount > 0 && (
              <span className="text-danger/80">The gods have watched you falter: {currentIncorrectCount}</span>
            )}
          </label>
          
          <Input 
            name="answer" 
            placeholder="Speak the truth..." 
            autoComplete="off"
            disabled={isPendingForm}
          />
        </div>
        
        {state.error && (
          <p className="text-danger/90 font-serif italic text-lg tracking-wide border-l-2 border-danger/40 pl-4 py-1">
            {state.error}
          </p>
        )}

        <Button 
          id="oracle-submit-btn"
          type="submit" 
          className="w-full py-4 text-xl" 
          disabled={isPendingForm}
        >
          {isPendingForm ? "The Oracle ponders..." : "Submit Answer"}
        </Button>
      </form>
    </Card>
  );

  // Special Custom Layout for Trial 1: Decoder Wheel
  if (level.puzzle_type === "decoder_wheel") {
    return (
      <div className="w-full max-w-6xl mx-auto space-y-8 relative z-10 animate-in fade-in duration-1000">
        <h2 className="text-3xl text-gold tracking-widest uppercase border-b border-gold/20 pb-2">
          Trial {level.level_number}: {level.title}
        </h2>

        <PuzzleRegistry 
          level={level} 
          incorrectCount={currentIncorrectCount} 
          storyText={level.story_text}
        >
          {renderSubmissionForm()}
        </PuzzleRegistry>
      </div>
    );
  }

  // Special Custom Layout for Trial 7: Sirens' Song
  if (level.puzzle_type === "split_blurred" || level.puzzle_type === "audio_visual" || level.level_number === 7) {
    return (
      <div className="w-full max-w-6xl mx-auto space-y-8 relative z-10 animate-in fade-in duration-1000">
        <h2 className="text-3xl text-gold tracking-widest uppercase border-b border-gold/20 pb-2">
          Trial {level.level_number}: {level.title}
        </h2>

        <PuzzleRegistry 
          level={level} 
          incorrectCount={currentIncorrectCount} 
          storyText={level.story_text}
        >
          {renderSubmissionForm()}
        </PuzzleRegistry>
      </div>
    );
  }

  // Standard Original Two-Column Layout (From GitHub)
  return (
    <>
      <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10 animate-in fade-in duration-1000">
        
        {/* LEFT COLUMN: Story Panel (7 cols) */}
        <div className="lg:col-span-7 space-y-8">
          <h2 className="text-3xl text-gold tracking-widest uppercase border-b border-gold/20 pb-2">
            Trial {level.level_number}: {level.title}
          </h2>
          <Card className="bg-ink/60 border border-wave/20 p-8 md:p-12 shadow-2xl backdrop-blur-md">
            <div className="prose prose-invert prose-p:font-serif prose-p:text-xl prose-p:leading-relaxed prose-p:text-parchment/90 max-w-none">
              {level.story_text.split('\n\n').map((paragraph: string, i: number) => (
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
        </div>

        {/* RIGHT COLUMN: Puzzle & Submission (5 cols) */}
        <div className="lg:col-span-5 space-y-8">
          
          <div className="space-y-4">
            <h3 className="text-xl text-gold/80 tracking-widest uppercase">The Enigma</h3>
            <PuzzleRegistry level={level} incorrectCount={currentIncorrectCount} />
          </div>

          {level.puzzle_type === "progress_bar" || level.puzzle_type === "animated_fork" || level.puzzle_type === "visual_escape" || level.puzzle_type === "hidden_object" || level.puzzle_type === "timing_bar" || level.puzzle_type === "audio_visual" ? (
            <form id="oracle-form" ref={formRef} action={formAction} className="sr-only">
              <input name="answer" type="hidden" />
              <button id="oracle-submit-btn" type="submit" />
            </form>
          ) : (
            renderSubmissionForm()
          )}

        </div>
      </div>
    </>
  );
}

function AbsentMemberGate({ memberNames, username, onConfirm }: { memberNames: string[], username: string, onConfirm: (absent: string[]) => void }) {
  const [absent, setAbsent] = useState<string[]>([]);

  const toggle = (name: string) => {
    // Cannot mark yourself absent
    if (name.toLowerCase() === username.toLowerCase()) return;
    setAbsent(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]);
  };

  const activeCount = memberNames.length - absent.length;

  return (
    <div className="w-full max-w-lg mx-auto space-y-6 animate-in fade-in duration-500 relative z-10 text-center">
      <UserX className="w-16 h-16 text-gold mx-auto opacity-80" />
      <div>
        <h2 className="text-3xl font-serif text-gold tracking-widest uppercase">Crew Muster</h2>
        <p className="text-parchment/70 font-serif text-lg italic">Who sails with you today?</p>
      </div>

      <Card className="bg-ink/80 border border-gold/30 p-6 backdrop-blur-md text-left space-y-2">
        <p className="text-parchment/60 font-serif text-sm italic border-b border-gold/10 pb-3 mb-4">
          All registered crew must be listed here. If a sailor could not make it in time, you may proceed by marking them absent.
        </p>
        <ul className="space-y-3">
          {memberNames.map(name => {
            const isYou = name.toLowerCase() === username.toLowerCase();
            const isAbsent = absent.includes(name);
            return (
              <li key={name} className="flex justify-between items-center p-3 border-b border-gold/10 last:border-0">
                <span className={`font-serif uppercase tracking-widest text-sm ${
                  isAbsent ? 'text-parchment/30 line-through' : 'text-parchment'
                }`}>
                  {name} {isYou && <span className="text-gold not-italic normal-case">(You)</span>}
                </span>
                {isYou ? (
                  <span className="text-gold text-xs font-serif uppercase tracking-widest">Present</span>
                ) : (
                  <button
                    onClick={() => toggle(name)}
                    className={`px-3 py-1 rounded border text-xs font-serif uppercase tracking-widest transition-colors ${
                      isAbsent
                        ? 'border-gold/50 text-gold bg-gold/10 hover:bg-gold/20'
                        : 'border-danger/40 text-danger/80 bg-danger/5 hover:bg-danger/15'
                    }`}
                  >
                    {isAbsent ? 'Mark Present' : 'Mark Absent'}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </Card>

      {activeCount < 2 && (
        <p className="text-danger font-serif italic text-sm">At least 2 sailors must be present to set sail.</p>
      )}

      <Button
        onClick={() => onConfirm(absent)}
        disabled={activeCount < 2}
        className="w-full py-4 text-xl"
      >
        Set Sail with {activeCount} Sailor{activeCount !== 1 ? 's' : ''}
      </Button>
    </div>
  );
}

export function GameEngine({ level, progress, teamId, username, memberNames }: GameEngineProps) {
  const [absentMembers, setAbsentMembers] = useState<string[]>([]);
  const [crewConfirmed, setCrewConfirmed] = useState(false);

  // Only show the absent-member gate if there are more than 2 registered members
  // and this is the first level (or crew hasn't been confirmed yet this session)
  const registeredCount = memberNames?.length ?? 0;
  const storageKey = `nostos_crew_confirmed_${teamId}`;

  // Restore crew confirmation from sessionStorage
  React.useEffect(() => {
    try {
      const saved = sessionStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        setAbsentMembers(parsed.absentMembers || []);
        setCrewConfirmed(true);
      }
    } catch { /* ignore */ }
  }, [storageKey]);

  const handleCrewConfirm = (absent: string[]) => {
    setAbsentMembers(absent);
    setCrewConfirmed(true);
    try {
      sessionStorage.setItem(storageKey, JSON.stringify({ absentMembers: absent }));
    } catch { /* ignore */ }
  };

  if (!crewConfirmed && registeredCount > 2) {
    return (
      <AbsentMemberGate
        memberNames={memberNames || []}
        username={username}
        onConfirm={handleCrewConfirm}
      />
    );
  }

  return (
    <TeamSyncProvider key={`sync_lvl_${level.level_number}`} teamId={teamId} username={username} memberNames={memberNames} levelNumber={level.level_number} absentMembers={absentMembers}>
      <GameEngineInner key={`engine_lvl_${level.level_number}`} level={level} progress={progress} teamId={teamId} username={username} memberNames={memberNames} absentMembers={absentMembers} />
      <CrewChat levelId={level.id} levelNumber={level.level_number} teamId={teamId} />
    </TeamSyncProvider>
  );
}
