import React from "react";
import { DecoderWheel } from "@/components/puzzles/DecoderWheel";
import { AeolusWinds } from "@/components/puzzles/AeolusWinds";
import { CyclopsCave } from "@/components/puzzles/CyclopsCave";
import { Laestrygonians } from "@/components/puzzles/Laestrygonians";
import { CircesIsland } from "@/components/puzzles/CircesIsland";
import { LandOfTheDead } from "@/components/puzzles/LandOfTheDead";
import { SirensSong } from "@/components/puzzles/SirensSong";
import { ScyllaCharybdis } from "@/components/puzzles/ScyllaCharybdis";
import { CattleOfHelios } from "@/components/puzzles/CattleOfHelios";
import { ReturnToIthaca } from "@/components/puzzles/ReturnToIthaca";

export function PuzzleRegistry({ 
  level, 
  incorrectCount,
  storyText,
  children
}: { 
  level: any, 
  incorrectCount: number,
  storyText?: string,
  children?: React.ReactNode
}) {
  if (level.puzzle_type === "decoder_wheel") {
    return (
      <DecoderWheel 
        data={level.puzzle_data} 
        incorrectCount={incorrectCount}
        storyText={storyText}
      >
        {children}
      </DecoderWheel>
    );
  }
  
  if (level.puzzle_type === "icon_reveal") {
    return <AeolusWinds data={level.puzzle_data} incorrectCount={incorrectCount} />;
  }

  if (level.puzzle_type === "visual_escape") {
    return <CyclopsCave data={level.puzzle_data} incorrectCount={incorrectCount} />;
  }

  if (level.puzzle_type === "progress_bar") {
    return <Laestrygonians data={level.puzzle_data} incorrectCount={incorrectCount} />;
  }

  if (level.puzzle_type === "hidden_object") {
    return <CircesIsland data={level.puzzle_data} incorrectCount={incorrectCount} />;
  }

  if (level.puzzle_type === "asymmetric_split") {
    return <LandOfTheDead levelId={level.id} data={level.puzzle_data} incorrectCount={incorrectCount} />;
  }

  if (level.puzzle_type === "split_blurred") {
    return (
      <SirensSong 
        levelId={level.id} 
        storyText={storyText}
      >
        {children}
      </SirensSong>
    );
  }

  if (level.puzzle_type === "animated_fork") {
    return <ScyllaCharybdis levelId={level.id} data={level.puzzle_data} incorrectCount={incorrectCount} />;
  }

  if (level.puzzle_type === "tempting_glow") {
    return <CattleOfHelios data={level.puzzle_data} incorrectCount={incorrectCount} />;
  }

  if (level.puzzle_type === "timing_bar") {
    return <ReturnToIthaca data={level.puzzle_data} storyText={storyText} />;
  }

  // Fallback for unimplemented puzzles
  return (
    <div className="bg-ink/50 p-6 border border-wave/20 font-mono text-sm text-parchment/70 overflow-auto whitespace-pre-wrap">
      {level.puzzle_type === "text" && (
        <p className="font-serif text-lg">{level.puzzle_data.text}</p>
      )}
      {level.puzzle_type !== "text" && (
        JSON.stringify(level.puzzle_data, null, 2)
      )}
    </div>
  );
}
