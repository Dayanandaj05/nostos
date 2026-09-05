"use server";

import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

export type SubmitState = {
  success: boolean;
  error?: string;
  incorrect_count?: number; // optionally pass back to UI
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

  // 1. Get current level of the team
  const { data: progress, error: progError } = await supabase
    .from("progress")
    .select("current_level, incorrect_count, correct_count")
    .eq("team_id", teamId)
    .single();

  if (progError || !progress) {
    return { success: false, error: "Failed to read team progress." };
  }

  const currentLevel = progress.current_level;

  // 2. Fetch the level data securely
  const { data: level, error: lvlError } = await supabase
    .from("levels")
    .select("id, correct_answer, is_locked")
    .eq("level_number", currentLevel)
    .single();

  if (lvlError || !level) {
    return { success: false, error: "The Oracle cannot find this level." };
  }

  if (level.is_locked) {
    return { success: false, error: "The Oracle is currently locked by the gods." };
  }

  const isCorrect = submittedAnswer.toLowerCase() === level.correct_answer.trim().toLowerCase();

  // 3. Log the submission
  await supabase
    .from("submissions")
    .insert([{
      team_id: teamId,
      level_id: level.id,
      submitted_answer: submittedAnswer,
      was_correct: isCorrect
    }]);

  // 4. Handle Correct vs Incorrect
  if (isCorrect) {
    const nextLevel = currentLevel + 1;
    const isCompleted = nextLevel > 10;
    
    const updateData: any = {
      current_level: nextLevel,
      correct_count: progress.correct_count ? progress.correct_count + 1 : 1,
      last_updated_at: new Date().toISOString(),
    };
    
    if (isCompleted) {
      updateData.completed_at = new Date().toISOString();
    }

    await supabase
      .from("progress")
      .update(updateData)
      .eq("team_id", teamId);

    revalidatePath("/play");
    return { success: true };
  } else {
    const newIncorrectCount = (progress.incorrect_count || 0) + 1;
    await supabase
      .from("progress")
      .update({
        incorrect_count: newIncorrectCount,
        last_updated_at: new Date().toISOString(),
      })
      .eq("team_id", teamId);

    return { 
      success: false, 
      error: "Incorrect. The gods laugh.", 
      incorrect_count: newIncorrectCount 
    };
  }
}
