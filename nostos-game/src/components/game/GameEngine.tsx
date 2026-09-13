"use client";

import React, { useActionState, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { submitAnswer, SubmitState } from "@/app/actions/submitAnswer";
import { confirmAdvance } from "@/app/actions/confirmAdvance";
import { PuzzleRegistry } from "@/components/puzzles/PuzzleRegistry";
import { CrewChat } from "@/components/game/CrewChat";
import { TrialVictoryModal } from "@/components/game/TrialVictoryModal";
import { TeamSyncProvider, useTeamSync } from "@/components/game/TeamSyncProvider";
import { CheckCircle2, Circle, Users, Anchor } from "lucide-react";

interface GameEngineProps {
  level: any;
  progress: any;
  teamId: string;
  username: string;
  memberNames?: string[];
}

function ReadinessGate({ onReady }: { onReady: () => void }) {
  const { connectedMembers, readyMembers, memberNames, deviceAlias } = useTeamSync();
  const amIReady = readyMembers.some(m => m.alias.toLowerCase() === deviceAlias.toLowerCase());

  const crewList = (memberNames && memberNames.length > 0) 
    ? memberNames 
    : connectedMembers.map(m => m.alias);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500 relative z-10 text-center">
      <Users className="w-16 h-16 text-gold mx-auto opacity-80" />
      <h2 className="text-3xl font-serif text-gold tracking-widest uppercase">The Crew Must Gather</h2>
      <p className="text-parchment/70 font-serif text-lg italic max-w-lg mx-auto">
        The gods demand unity. All present sailors must confirm they are ready before the trial begins.
      </p>

      <Card className="bg-ink/80 border border-gold/30 p-6 backdrop-blur-md">
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
          I am ready
        </Button>
      ) : (
        <p className="text-gold/80 font-serif italic animate-pulse">Waiting for the rest of the crew...</p>
      )}
    </div>
  );
}

function CompletionGate({ levelNumber }: { levelNumber: number }) {
  const { connectedMembers, doneMembers, memberNames, deviceAlias, markDone } = useTeamSync();
  const [isPending, startTransition] = useTransition();
  const [advancing, setAdvancing] = useState(false);

  const amIDone = doneMembers.some(m => m.alias.toLowerCase() === deviceAlias.toLowerCase() && m.isDone);

  const crewList = (memberNames && memberNames.length > 0)
    ? memberNames
    : connectedMembers.map(m => m.alias);

  // Everyone in the registered crew list must be marked done
  const isEveryoneDone = crewList.length > 0 && crewList.every(name => 
    doneMembers.some(m => m.alias.toLowerCase() === name.toLowerCase() && m.isDone)
  );

  const handleMarkDone = () => {
    markDone(true);
  };

  // When everyone is done, trigger server advancement
  React.useEffect(() => {
    if (isEveryoneDone && !advancing) {
      setAdvancing(true);
      startTransition(async () => {
        await confirmAdvance(levelNumber);
      });
    }
  }, [isEveryoneDone, advancing, levelNumber]);

  if (advancing) {
    return <TrialVictoryModal currentLevelNumber={levelNumber} onProceed={() => { /* Transition handled by realtime router.refresh */ }} />;
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500 relative z-10 text-center">
      <Anchor className="w-16 h-16 text-gold mx-auto opacity-80" />
      <h2 className="text-3xl font-serif text-gold tracking-widest uppercase">The Trial is Bested</h2>
      <p className="text-parchment/70 font-serif text-lg italic max-w-lg mx-auto">
        The answer was true. Before setting sail to Trial {levelNumber + 1}, all registered crew members must confirm completion.
      </p>

      <Card className="bg-ink/80 border border-gold/30 p-6 backdrop-blur-md">
        <h3 className="text-xs uppercase tracking-widest text-parchment/50 font-bold mb-4 border-b border-gold/10 pb-2">
          Crew Completion Status ({doneMembers.length} / {crewList.length} Finished)
        </h3>
        <ul className="space-y-4">
          {crewList.map(name => {
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

      {!amIDone ? (
        <Button onClick={handleMarkDone} className="w-full py-4 text-xl font-bold">
          Mark My Part Done
        </Button>
      ) : (
        <div className="space-y-4">
          <p className="text-gold/80 font-serif italic animate-pulse text-lg">
            Waiting for all registered crew members to complete the trial...
          </p>
        </div>
      )}
    </div>
  );
}

function GameEngineInner({ level, progress }: GameEngineProps) {
  const [state, formAction, isPendingForm] = useActionState<SubmitState, FormData>(submitAnswer, { success: false });
  const formRef = useRef<HTMLFormElement>(null);
  const { connectedMembers, readyMembers, markReady } = useTeamSync();

  const currentIncorrectCount = state.incorrect_count ?? progress.incorrect_count;
  
  // A puzzle is successfully solved if either the global progress says so (from a teammate solving it)
  // or our local state says so (we solved it).
  const isSolved = progress.pending_advance || state.success;

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
        <ReadinessGate onReady={() => markReady(true)} />
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
            <form id="oracle-form" ref={formRef} action={formAction} className="hidden">
              <input name="answer" type="hidden" />
            </form>
          ) : (
            renderSubmissionForm()
          )}

        </div>
      </div>
    </>
  );
}

export function GameEngine({ level, progress, teamId, username, memberNames }: GameEngineProps) {
  return (
    <TeamSyncProvider teamId={teamId} username={username} memberNames={memberNames}>
      <GameEngineInner level={level} progress={progress} teamId={teamId} username={username} memberNames={memberNames} />
      <CrewChat levelId={level.id} levelNumber={level.level_number} />
    </TeamSyncProvider>
  );
}
