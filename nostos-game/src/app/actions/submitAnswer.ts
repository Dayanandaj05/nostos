"use server";

import { supabase } from "@/lib/supabase";
import { getSession, isSessionActive } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { SEED_LEVELS } from "@/lib/mockData";

export type SubmitState = {
  success: boolean;
  error?: string;
  incorrect_count?: number;
  completed_level?: number;
};

export async function submitAnswer(prevState: SubmitState, formData: FormData): Promise<SubmitState> {
  const session = await getSession();
  if (!session || session.role !== "team") {
    return { success: false, error: "Authentication lost. Please log in again." };
  }

  if (session.id && session.username && session.sessionId && !isSessionActive(session.id, session.username, session.sessionId)) {
    return { success: false, error: "Your session has been logged in on another device or has expired." };
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
    const t0 = Date.now();
    // 1. Get current level of the team
    const { data: progData, error: progErr } = await supabase
      .from("progress")
      .select("current_level, incorrect_count, correct_count")
      .eq("team_id", teamId)
      .single();
    if (progData && !progErr) progress = progData;
    const t1 = Date.now();
    console.log(`[submitAnswer] progress fetch took ${t1 - t0}ms`);

    if (progress) {
      // 2. Fetch level data
      const { data: lvlData, error: lvlErr } = await supabase
        .from("levels")
        .select("id, correct_answer, is_locked")
        .eq("level_number", progress.current_level)
        .single();
      if (lvlData && !lvlErr) level = lvlData;
      console.log(`[submitAnswer] level fetch took ${Date.now() - t1}ms`);
    }
  } catch (err) {
    console.warn("Supabase unavailable for answer submission, using dev fallback state:", err);
  }

  // Fallbacks if Supabase is offline
  if (!progress) {
    const { mockDevProgressState } = require("@/lib/mockData");
    if (!mockDevProgressState[teamId]) {
      mockDevProgressState[teamId] = { current_level: 1, incorrect_count: 0, correct_count: 0 };
    }
    progress = mockDevProgressState[teamId];
  }

  if (!progress) {
    return { success: false, error: "Unable to retrieve your progress. Try again." };
  }

  if (!level) {
    const seed = SEED_LEVELS.find(l => l.level_number === progress!.current_level) || SEED_LEVELS[0];
    level = {
      id: seed.id,
      correct_answer: seed.correct_answer,
      is_locked: seed.is_locked
    };
  }

  if (!level) {
    return { success: false, error: "Level data not found." };
  }

  const currentLevel = progress.current_level;

  if (level.is_locked) {
    return { success: false, error: "The Oracle is currently locked by the gods." };
  }

  const normalize = (str: string) => str.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  const normSubmitted = normalize(submittedAnswer);
  const normTarget = normalize(level.correct_answer);

  let isCorrect = normSubmitted === normTarget;

  if (!isCorrect) {
    if (level.correct_answer === "NOBODY" || currentLevel === 3) {
      if (["nobody", "nothing", "noone", "outis", "none"].includes(normSubmitted)) {
        isCorrect = true;
      }
    } else if (currentLevel === 6 && (normSubmitted === "findtheroadhome" || normSubmitted === "theroadhome")) {
      isCorrect = true;
    } else if (level.correct_answer === "6_CORRECT" && (normSubmitted === "6" || normSubmitted === "6correct" || normSubmitted === "six")) {
      isCorrect = true;
    } else if (level.correct_answer === "DEPENDS_ON_PATH" && (normSubmitted === "5" || normSubmitted === "15" || normSubmitted === "15" || normSubmitted === "dependsonpath" || normSubmitted === "scylla" || normSubmitted === "charybdis")) {
      isCorrect = true;
    } else if (level.correct_answer === "MOLY" && (normSubmitted === "moly" || normSubmitted === "holyherb" || normSubmitted === "herb")) {
      isCorrect = true;
    } else if (level.correct_answer === "0" && (normSubmitted === "0" || normSubmitted === "zero" || normSubmitted === "none")) {
      isCorrect = true;
    }
  }

  try {
    const tSubStart = Date.now();
    // Log submission to DB if available
    await supabase
      .from("submissions")
      .insert([{
        team_id: teamId,
        level_id: level.id,
        submitted_answer: submittedAnswer,
        was_correct: isCorrect
      }]);
    console.log(`[submitAnswer] submissions insert took ${Date.now() - tSubStart}ms`);
  } catch (e) {
    // ignore DB log errors in dev
  }

  if (isCorrect) {
    const isCompleted = currentLevel >= 10;
    
    let dbSuccess = false;
    try {
      const updateData: any = {
        correct_count: (progress.correct_count || 0) + 1,
        last_updated_at: new Date().toISOString(),
      };
      if (isCompleted) updateData.completed_at = new Date().toISOString();

      const tUpStart = Date.now();
      const { error: updateErr } = await supabase
        .from("progress")
        .update(updateData)
        .eq("team_id", teamId);
      console.log(`[submitAnswer] progress update (correct) took ${Date.now() - tUpStart}ms`);

      if (!updateErr) dbSuccess = true;
    } catch (e) {
      dbSuccess = false;
    }

    if (!dbSuccess) {
      const { mockDevProgressState } = require("@/lib/mockData");
      mockDevProgressState[teamId] = {
        current_level: currentLevel,
        correct_count: (progress.correct_count || 0) + 1,
        incorrect_count: progress.incorrect_count || 0
      };
    }

    revalidatePath("/play");
    return { success: true, completed_level: currentLevel };
  } else {
    const newIncorrectCount = (progress.incorrect_count || 0) + 1;
    
    let dbSuccess = false;
    try {
      const { error: updateErr } = await supabase
        .from("progress")
        .update({
          incorrect_count: newIncorrectCount,
          last_updated_at: new Date().toISOString(),
        })
        .eq("team_id", teamId);

      if (!updateErr) dbSuccess = true;
    } catch (e) {
      dbSuccess = false;
    }

    if (!dbSuccess) {
      // Failed to update incorrect count, but continue anyway
    }

    return { 
      success: false, 
      error: "Incorrect. The gods laugh.", 
      incorrect_count: newIncorrectCount 
    };
  }
}
