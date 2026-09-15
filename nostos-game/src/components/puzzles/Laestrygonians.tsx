"use client";

import React, { useState, useEffect, useRef } from "react";
import { Ship, Skull, Sparkles, CheckCircle2, RotateCcw } from "lucide-react";

interface LaestrygoniansProps {
  data: {
    questions: number;
    required: number;
  };
  incorrectCount: number;
}

// 15 Original Questions
const QUESTION_BANK = [
  { q: "Roman Math: CLXXV - L", a: "125" },
  { q: "Math: (14 * 6) - (48 / 4)", a: "72" },
  { q: "Sequence: 100, 96, 88, 72, 40, ?", a: "-24" },
  { q: "Sequence: 3, 7, 15, 31, ?", a: "63" },
  { q: "Math: (120 / 5) * 3 - 42", a: "30" },
  { q: "Roman Math: XCIV + XXVI", a: "120" },
  { q: "Math: 4² + 3³ - 15", a: "28" },
  { q: "Unscramble: P I S H", a: "SHIP" },
  { q: "Unscramble: C H O A R N", a: "ANCHOR" },
  { q: "Odd one out: GALLEY, TRIREME, FRIGATE, CHARIOT", a: "CHARIOT" },
  { q: "Odd one out: ZEUS, POSEIDON, HERCULES, HADES", a: "HERCULES" },
  { q: "Odd one out: MAST, RUDDER, ANCHOR, SPEAR", a: "SPEAR" },
  { q: "Sequence: 2, 6, 18, 54, ?", a: "162" },
  { q: "Math: (85 - 15) / 2 + 18", a: "53" },
  { q: "Unscramble: T R I R E M E", a: "TRIREME" }
];

// True Fisher-Yates Shuffle algorithm for uniform non-repeating selection
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const TIME_PER_QUESTION = 35;
const TOTAL_QUESTIONS = 8;
const REQUIRED_CORRECT = 6;

export function Laestrygonians({ data, incorrectCount }: LaestrygoniansProps) {
  const [hasAcceptedGuidelines, setHasAcceptedGuidelines] = useState(false);
  const [questions, setQuestions] = useState<{q: string, a: string}[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIME_PER_QUESTION);
  const [status, setStatus] = useState<'playing' | 'won' | 'lost'>('playing');
  const [shipPosition, setShipPosition] = useState(10); // Percentage 10% to 90%
  const [localInput, setLocalInput] = useState("");
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Retrieve previously answered/seen questions from localStorage for this user
  const getSeenQuestionKeys = (): string[] => {
    try {
      const raw = localStorage.getItem("nostos_t4_seen_q");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  };

  const saveSeenQuestionKeys = (keys: string[]) => {
    try {
      localStorage.setItem("nostos_t4_seen_q", JSON.stringify(keys));
    } catch {
      // ignore
    }
  };

  // Draw 8 strictly non-repeating questions for the current user
  const drawQuestionsForUser = (count: number) => {
    let seenList = getSeenQuestionKeys();
    let available = QUESTION_BANK.filter(item => !seenList.includes(item.q));

    // If remaining unseen questions are fewer than count (8), reset the seen list
    if (available.length < count) {
      seenList = [];
      available = [...QUESTION_BANK];
    }

    // Fisher-Yates shuffle the available pool
    const shuffled = shuffleArray(available);
    const selected = shuffled.slice(0, count);

    // Persist new seen questions so they won't repeat for this user until all 15 are exhausted
    const newSeen = [...seenList, ...selected.map(item => item.q)];
    saveSeenQuestionKeys(newSeen);

    return selected;
  };

  // Initial setup
  useEffect(() => {
    startNewGame();
    // Hide the main form initially
    const form = document.getElementById('oracle-form');
    if (form) form.style.display = 'none';
    
    return () => {
      if (form) form.style.display = 'block';
    };
  }, []);

  const startNewGame = () => {
    // Select 8 questions without any repetition for this user
    const selectedQuestions = drawQuestionsForUser(TOTAL_QUESTIONS);
    setQuestions(selectedQuestions);
    setCurrentIndex(0);
    setCorrectCount(0);
    setTimeLeft(TIME_PER_QUESTION);
    setStatus('playing');
    setShipPosition(10);
    setLocalInput("");
  };

  // Timer Countdown - Only runs after guidelines accepted
  useEffect(() => {
    if (status !== 'playing' || !hasAcceptedGuidelines) return;

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleTimeUp();
          return TIME_PER_QUESTION;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status, currentIndex, hasAcceptedGuidelines]);

  const handleTimeUp = () => {
    processAnswer(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (status !== 'playing') return;

    const isCorrect = localInput.trim().toUpperCase() === questions[currentIndex].a.toUpperCase();
    processAnswer(isCorrect);
  };

  const processAnswer = (isCorrect: boolean) => {
    let newCorrect = correctCount;
    if (isCorrect) {
      newCorrect += 1;
      setCorrectCount(newCorrect);
      setShipPosition(prev => Math.min(prev + 12, 95));
    } else {
      setShipPosition(prev => Math.max(prev - 5, 5));
    }

    const nextIndex = currentIndex + 1;
    if (nextIndex >= TOTAL_QUESTIONS) {
      // Game Over
      if (newCorrect >= REQUIRED_CORRECT) {
        setStatus('won');
        handleWin();
      } else {
        setStatus('lost');
      }
    } else {
      setCurrentIndex(nextIndex);
      setTimeLeft(TIME_PER_QUESTION);
      setLocalInput("");
    }
  };

  const handleWin = () => {
    const form = document.getElementById('oracle-form') as HTMLFormElement;
    if (form) {
      const input = form.querySelector('input[name="answer"]') as HTMLInputElement;
      if (input) {
        input.value = "6_CORRECT";
        // Auto submit after a short delay to let them see the victory state
        setTimeout(() => {
          document.getElementById('oracle-submit-btn')?.click();
        }, 1800);
      }
    }
  };

  if (questions.length === 0) return null;

  if (!hasAcceptedGuidelines) {
    return (
      <div className="w-full max-w-2xl mx-auto bg-ink/90 border-2 border-gold/40 p-8 rounded-xl shadow-2xl backdrop-blur-md flex flex-col items-center text-center space-y-6 animate-in zoom-in duration-500">
        <h3 className="text-2xl text-gold font-serif tracking-widest uppercase border-b border-gold/20 pb-3 w-full">
          Trial 4 Guidelines & Rules
        </h3>
        <p className="text-parchment/90 font-serif text-lg leading-relaxed italic">
          Giant Laestrygonians are hurling boulders at your ship! You must answer rapid mathematical & navigation calculations to steer the ship forward out of the straits.
        </p>

        <div className="w-full bg-black/40 border border-gold/20 p-4 rounded-lg space-y-3 text-left font-serif text-sm text-parchment/80">
          <div className="flex justify-between border-b border-gold/10 pb-2">
            <span className="text-parchment/60 uppercase tracking-widest">Total Voyage Questions:</span>
            <span className="text-gold font-bold">8 Unique Questions</span>
          </div>
          <div className="flex justify-between border-b border-gold/10 pb-2">
            <span className="text-parchment/60 uppercase tracking-widest">Required Correct Maneuvers:</span>
            <span className="text-gold font-bold">6 of 8 Correct</span>
          </div>
          <div className="flex justify-between border-b border-gold/10 pb-2">
            <span className="text-parchment/60 uppercase tracking-widest">Time per Calculation:</span>
            <span className="text-gold font-bold">35 Seconds</span>
          </div>
          <div className="flex justify-between">
            <span className="text-parchment/60 uppercase tracking-widest">Ship Forward Movement:</span>
            <span className="text-gold font-bold">+12% Forward per Correct Answer</span>
          </div>
        </div>

        <button
          onClick={() => setHasAcceptedGuidelines(true)}
          className="w-full py-4 bg-gold/20 hover:bg-gold/30 border-2 border-gold text-gold font-serif text-xl font-bold tracking-widest uppercase rounded shadow-[0_0_20px_rgba(201,162,75,0.4)] hover:shadow-[0_0_30px_rgba(201,162,75,0.8)] transition-all"
        >
          I Understand — Begin Voyage →
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-8 w-full select-none pb-8">
      
      {/* Visual Track */}
      <div className="w-full max-w-2xl px-4">
        <div className="relative w-full h-16 bg-blue-950/40 border-y-2 border-blue-900/50 rounded-lg overflow-hidden flex items-center shadow-inner">
          {/* Water effect */}
          <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
          
          {/* Progress Markers */}
          {[...Array(TOTAL_QUESTIONS)].map((_, i) => (
            <div key={i} className="absolute h-full w-[1px] bg-blue-400/10" style={{ left: `${10 + (i * 12)}%` }} />
          ))}

          {/* The Ship */}
          <div 
            className="absolute transition-all duration-700 ease-out flex flex-col items-center drop-shadow-[0_0_10px_rgba(201,162,75,0.8)]"
            style={{ left: `calc(${shipPosition}% - 24px)` }}
          >
            <Ship className="w-12 h-12 text-gold -mt-2" />
          </div>

          {/* Danger zone indicator on left */}
          <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-danger/40 to-transparent flex items-center justify-start pl-2">
            <Skull className="w-6 h-6 text-danger/60" />
          </div>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="w-full max-w-lg bg-ink/80 border border-gold/30 p-6 shadow-2xl backdrop-blur-md relative overflow-hidden min-h-[220px] flex flex-col items-center justify-center rounded-xl">
        
        {status === 'playing' && (
          <div className="w-full flex flex-col items-center space-y-6 animate-in fade-in">
            <div className="flex justify-between w-full text-parchment/60 font-serif text-sm uppercase tracking-widest border-b border-gold/20 pb-2">
              <span>Question {currentIndex + 1} of {TOTAL_QUESTIONS}</span>
              <span>Correct: {correctCount}/{REQUIRED_CORRECT}</span>
            </div>

            {/* Timer */}
            <div className="relative flex items-center justify-center">
              <div className="absolute w-16 h-16 rounded-full border-4 border-gold/20" />
              <svg className="absolute w-16 h-16 -rotate-90">
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  className={`transition-all duration-1000 ease-linear ${timeLeft <= 10 ? 'text-danger' : 'text-gold'}`}
                  strokeDasharray="176"
                  strokeDashoffset={176 - (176 * timeLeft) / TIME_PER_QUESTION}
                />
              </svg>
              <span className={`font-serif text-2xl font-bold ${timeLeft <= 10 ? 'text-danger animate-pulse' : 'text-gold'}`}>
                {timeLeft}
              </span>
            </div>

            <p className="text-xl text-center text-parchment/90 font-serif font-semibold px-2">
              {questions[currentIndex].q}
            </p>

            <form onSubmit={handleSubmit} className="w-full flex space-x-2">
              <input 
                type="text" 
                value={localInput}
                onChange={e => setLocalInput(e.target.value)}
                autoFocus
                autoComplete="off"
                placeholder="Enter answer..."
                className="flex-1 bg-ink/50 border border-gold/30 focus:border-gold/80 px-4 py-3 rounded text-parchment outline-none font-serif uppercase tracking-widest text-center"
              />
              <button 
                type="submit"
                className="px-6 py-3 bg-gold/20 hover:bg-gold/30 border border-gold text-gold uppercase tracking-widest font-serif font-bold rounded transition-colors"
              >
                Fire
              </button>
            </form>
          </div>
        )}

        {status === 'won' && (
          <div className="flex flex-col items-center space-y-4 animate-in zoom-in duration-500">
            <Ship className="w-16 h-16 text-gold drop-shadow-[0_0_15px_rgba(201,162,75,0.8)]" />
            <h3 className="text-2xl font-serif text-gold uppercase tracking-widest">You Escaped!</h3>
            <p className="text-parchment/80 font-serif text-center">
              The ship clears the straits. Journeying onward...
            </p>
          </div>
        )}

        {status === 'lost' && (
          <div className="flex flex-col items-center space-y-6 animate-in zoom-in duration-500">
            <Skull className="w-16 h-16 text-danger drop-shadow-[0_0_15px_rgba(220,38,38,0.8)]" />
            <div className="text-center">
              <h3 className="text-2xl font-serif text-danger uppercase tracking-widest mb-2">Crushed</h3>
              <p className="text-parchment/80 font-serif">
                The Laestrygonians have sunk your fleet.
              </p>
              <p className="text-parchment/60 font-serif text-sm mt-1">
                You only survived {correctCount} out of {REQUIRED_CORRECT} necessary maneuvers.
              </p>
            </div>
            <button 
              onClick={startNewGame}
              className="flex items-center space-x-2 px-8 py-3 bg-danger/20 hover:bg-danger/30 border border-danger/60 rounded text-danger uppercase tracking-widest font-serif font-bold transition-all shadow-[0_0_15px_rgba(220,38,38,0.3)]"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Restart Trial</span>
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
