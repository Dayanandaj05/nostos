"use server";

import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { SEED_LEVELS, mockDevProgressState } from "@/lib/mockData";

export type SubmitState = {
  success: boolean;
  error?: string;
  incorrect_count?: number;
};

export async function submitAnswer(prevState: SubmitState, formData: FormData): Promise<SubmitState> {
  const session = await getSession();
  if (!session || session.role !== "team") {
    return { success: false, error: "Authentication lost. Please log in again." };
  }

  const teamId = session.id;
  let submittedAnswer = formData.get("answer")?.toString();

  if (!submittedAnswer || submittedAnswer.trim() === "") {
    return { success: false, error: "You must provide an answer to the Oracle." };
  }
  
  submittedAnswer = submittedAnswer.trim();

  let progress: { current_level: number; incorrect_count: number; correct_count?: number } | null = null;
  let level: { id: string; correct_answer: string; is_locked?: boolean } | null = null;

  try {
    // 1. Get current level of the team
    const { data: progData } = await supabase
      .from("progress")
      .select("current_level, incorrect_count, correct_count")
      .eq("team_id", teamId)
      .single();
    if (progData) progress = progData;

    if (progress) {
      // 2. Fetch level data
      const { data: lvlData } = await supabase
        .from("levels")
        .select("id, correct_answer, is_locked")
        .eq("level_number", progress.current_level)
        .single();
      if (lvlData) level = lvlData;
    }
  } catch (err) {
    console.warn("Supabase unavailable for answer submission, using dev fallback state:", err);
  }

  // Fallbacks if Supabase is offline
  if (!progress) {
    if (!mockDevProgressState[teamId]) {
      mockDevProgressState[teamId] = { current_level: 1, incorrect_count: 0 };
    }
    progress = mockDevProgressState[teamId];
  }

  if (!level) {
    const seed = SEED_LEVELS.find(l => l.level_number === progress!.current_level) || SEED_LEVELS[0];
    level = {
      id: seed.id,
      correct_answer: seed.correct_answer,
      is_locked: seed.is_locked
    };
  }

  const currentLevel = progress.current_level;

  if (level.is_locked) {
    return { success: false, error: "The Oracle is currently locked by the gods." };
  }

  const isCorrect = submittedAnswer.toLowerCase() === level.correct_answer.trim().toLowerCase();

  try {
    // Log submission to DB if available
    await supabase
      .from("submissions")
      .insert([{
        team_id: teamId,
        level_id: level.id,
        submitted_answer: submittedAnswer,
        was_correct: isCorrect
      }]);
  } catch (e) {
    // ignore DB log errors in dev
  }

  if (isCorrect) {
    const nextLevel = currentLevel + 1;
    const isCompleted = nextLevel > 10;
    
    try {
      const updateData: any = {
        current_level: nextLevel,
        correct_count: (progress.correct_count || 0) + 1,
        last_updated_at: new Date().toISOString(),
      };
      if (isCompleted) updateData.completed_at = new Date().toISOString();

      await supabase
        .from("progress")
        .update(updateData)
        .eq("team_id", teamId);
    } catch (e) {
      // update mock state
      mockDevProgressState[teamId] = {
        current_level: nextLevel,
        incorrect_count: progress.incorrect_count || 0
      };
    }

    revalidatePath("/play");
    return { success: true };
  } else {
    const newIncorrectCount = (progress.incorrect_count || 0) + 1;
    
    try {
      await supabase
        .from("progress")
        .update({
          incorrect_count: newIncorrectCount,
          last_updated_at: new Date().toISOString(),
        })
        .eq("team_id", teamId);
    } catch (e) {
      mockDevProgressState[teamId] = {
        current_level: currentLevel,
        incorrect_count: newIncorrectCount
      };
    }

    return { 
      success: false, 
      error: "Incorrect. The gods laugh.", 
      incorrect_count: newIncorrectCount 
    };
  }
}
