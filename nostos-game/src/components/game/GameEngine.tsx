"use client";

import React, { useActionState, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { submitAnswer, SubmitState } from "@/app/actions/submitAnswer";
import { PuzzleRegistry } from "@/components/puzzles/PuzzleRegistry";
import { CrewChat } from "@/components/game/CrewChat";
import { TrialVictoryModal } from "@/components/game/TrialVictoryModal";

interface GameEngineProps {
  level: any;
  incorrectCount: number;
}

export function GameEngine({ level, incorrectCount }: GameEngineProps) {
  const [state, formAction, isPending] = useActionState<SubmitState, FormData>(submitAnswer, { success: false });
  
  // Use a ref to clear the input after a submission (if desired), 
  // but React 19 handles form resets automatically on success.
  const formRef = useRef<HTMLFormElement>(null);

  // Derive the total incorrect count (local state takes precedence if it updated)
  const currentIncorrectCount = state.incorrect_count ?? incorrectCount;
  const completedLevelNumber = state.completed_level ?? level.level_number;

  // Only teamwork / group trials display the floating Crew Chat widget
  const isTeamworkTrial = level.puzzle_type === "asymmetric_split" || level.puzzle_type === "split_blurred";

  // Special Custom Layout for Trial 1: Decoder Wheel
  if (level.puzzle_type === "decoder_wheel") {
    return (
      <div className="w-full max-w-6xl mx-auto space-y-8 relative z-10">
        {state.success && (
          <TrialVictoryModal 
            currentLevelNumber={completedLevelNumber} 
            onProceed={() => window.location.reload()} 
          />
        )}

        <h2 className="text-3xl text-gold tracking-widest uppercase border-b border-gold/20 pb-2">
          Trial {level.level_number}: {level.title}
        </h2>

        <PuzzleRegistry 
          level={level} 
          incorrectCount={currentIncorrectCount} 
          storyText={level.story_text}
        >
          <Card className="bg-ink/80 border border-gold/30 p-6 shadow-2xl backdrop-blur-md relative overflow-visible">
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
                  disabled={isPending}
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
                disabled={isPending}
              >
                {isPending ? "The Oracle ponders..." : "Submit Answer"}
              </Button>
            </form>
          </Card>
        </PuzzleRegistry>
        {isTeamworkTrial && <CrewChat />}
      </div>
    );
  }

  return (
    <>
      {state.success && (
        <TrialVictoryModal 
          currentLevelNumber={completedLevelNumber} 
          onProceed={() => window.location.reload()} 
        />
      )}

      <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
        
        {/* LEFT COLUMN: Story Panel (7 cols) */}
        <div className="lg:col-span-7 space-y-8">
          <h2 className="text-3xl text-gold tracking-widest uppercase border-b border-gold/20 pb-2">
            Trial {level.level_number}: {level.title}
          </h2>
          <Card className="bg-ink/60 border border-wave/20 p-8 md:p-12 shadow-2xl backdrop-blur-md">
            <div className="prose prose-invert prose-p:font-serif prose-p:text-xl prose-p:leading-relaxed prose-p:text-parchment/90 max-w-none">
              {/* Split story text by newlines to render proper paragraphs */}
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
          
          {/* Puzzle Panel */}
          <div className="space-y-4">
            <h3 className="text-xl text-gold/80 tracking-widest uppercase">The Enigma</h3>
            <PuzzleRegistry level={level} incorrectCount={currentIncorrectCount} />
          </div>

          {/* Submission Panel or Hidden Form for Auto-Submit Mini-Games */}
          {level.puzzle_type === "progress_bar" ? (
            <form id="oracle-form" ref={formRef} action={formAction} className="hidden">
              <input name="answer" type="hidden" />
            </form>
          ) : (
            <Card className="bg-ink/80 border border-gold/30 p-6 shadow-2xl backdrop-blur-md relative overflow-visible">
              {/* Ornamental corner accents */}
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
                    disabled={isPending}
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
                  disabled={isPending}
                >
                  {isPending ? "The Oracle ponders..." : "Submit Answer"}
                </Button>
              </form>
            </Card>
          )}

        </div>
      </div>
      {isTeamworkTrial && <CrewChat />}
    </>
  );
}
