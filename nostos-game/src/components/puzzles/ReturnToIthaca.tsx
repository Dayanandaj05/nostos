"use client";

import React, { useState, useEffect, useRef } from "react";
import { Target, RotateCcw, Wind, Sparkles, Trophy, ArrowRight, ShieldAlert, CheckCircle, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/Card";

interface ReturnToIthacaProps {
  data: {
    combination_clue: string;
  };
  storyText?: string;
}

const LOCK_VARIATIONS = [
  { id: 1, r1: { eq: "(4 × 3) - 2", ans: 10 }, r2: { eq: "(18 - 6) ÷ 12", ans: 1 }, r3: { eq: "(7 × 3) - 9", ans: 12 } },
  { id: 2, r1: { eq: "(5 × 4) - 5", ans: 15 }, r2: { eq: "(24 ÷ 3) + 1", ans: 9 }, r3: { eq: "(8 × 2) - 4", ans: 12 } },
  { id: 3, r1: { eq: "3³ - 12", ans: 15 }, r2: { eq: "(100 ÷ 10) - 2", ans: 8 }, r3: { eq: "(6 × 4) - 20", ans: 4 } },
  { id: 4, r1: { eq: "(9 × 3) - 7", ans: 20 }, r2: { eq: "(36 ÷ 6) + 3", ans: 9 }, r3: { eq: "5² - 14", ans: 11 } }
];

export function ReturnToIthaca({ data, storyText }: ReturnToIthacaProps) {
  const [phase, setPhase] = useState<1 | 2 | 3 | 4>(1); // Phase 1: Tapestry, 2: Odyssey Lock, 3: 2D Bow & Arrow, 4: Victory
  
  // Hints System
  const [timeInPhase, setTimeInPhase] = useState(0);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    setTimeInPhase(0);
    setShowHint(false);
    const interval = setInterval(() => {
      setTimeInPhase(prev => {
        const next = prev + 1;
        if (next >= 120) setShowHint(true);
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [phase]);

  // Phase 1: Penelope Tapestry Overhaul
  const [threads, setThreads] = useState<boolean[]>(Array(16).fill(false)); // false = woven, true = unwoven
  
  useEffect(() => {
    if (phase !== 1) return;
    const interval = setInterval(() => {
      setThreads(prev => {
        const unwovenIndices = prev.map((t, i) => t ? i : -1).filter(i => i !== -1);
        if (unwovenIndices.length > 0 && unwovenIndices.length < 16) {
          const toReweave = unwovenIndices[Math.floor(Math.random() * unwovenIndices.length)];
          const next = [...prev];
          next[toReweave] = false; // Penelope re-weaves!
          return next;
        }
        return prev;
      });
    }, 1500);
    return () => clearInterval(interval);
  }, [phase]);

  const handleThreadClick = (index: number) => {
    setThreads(prev => {
      const next = [...prev];
      next[index] = true;
      if (next.every(t => t === true)) {
        setTimeout(() => setPhase(2), 2000);
      }
      return next;
    });
  };

  // Phase 2: Odyssey Lore Lock (Years=10, Cyclops=1, Axes=12)
  const [ring1, setRing1] = useState(0);
  const [ring2, setRing2] = useState(0);
  const [ring3, setRing3] = useState(0);
  const [lockVariation, setLockVariation] = useState(LOCK_VARIATIONS[0]);
  const [lockError, setLockError] = useState(false);

  useEffect(() => {
    setLockVariation(LOCK_VARIATIONS[Math.floor(Math.random() * LOCK_VARIATIONS.length)]);
  }, []);

  // Phase 3: 2D Bow & Arrow Canvas Game
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isAiming, setIsAiming] = useState(false);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 130, y: 270 });
  const mousePosRef = useRef<{ x: number; y: number }>({ x: 130, y: 270 });
  const [arrowState, setArrowState] = useState<'idle' | 'flying' | 'hit' | 'miss'>('idle');
  const [hitCount, setHitCount] = useState(0); // Requires 3 hits to win!
  const [missCount, setMissCount] = useState(0); // Track misses to unlock torch trick
  const [hitFeedback, setHitFeedback] = useState<string | null>(null);
  const [finalAnswer, setFinalAnswer] = useState("");

  const arrowPos = useRef({ x: 130, y: 270, vx: 0, vy: 0 });
  const animFrameRef = useRef<number | null>(null);

  // Sync state refs to prevent requestAnimationFrame teardown lag
  const hitCountRef = useRef(hitCount);
  useEffect(() => { hitCountRef.current = hitCount; }, [hitCount]);

  const isAimingRef = useRef(isAiming);
  useEffect(() => { isAimingRef.current = isAiming; }, [isAiming]);

  const arrowStateRef = useRef(arrowState);
  useEffect(() => { arrowStateRef.current = arrowState; }, [arrowState]);

  // Trick Mechanics: Extinguish Torches
  const [torch1Lit, setTorch1Lit] = useState(true);
  const [torch2Lit, setTorch2Lit] = useState(true);
  
  const torch1LitRef = useRef(torch1Lit);
  useEffect(() => { torch1LitRef.current = torch1Lit; }, [torch1Lit]);

  const torch2LitRef = useRef(torch2Lit);
  useEffect(() => { torch2LitRef.current = torch2Lit; }, [torch2Lit]);

  // Keep mousePosRef synced
  useEffect(() => {
    mousePosRef.current = mousePos;
  }, [mousePos]);

  // Sync answer to hidden oracle-form when phase 4 is unlocked
  useEffect(() => {
    const input = document.getElementById('oracle-form')?.querySelector('input[name="answer"]') as HTMLInputElement;
    if (input && phase === 4) {
      input.value = finalAnswer || "ITHACA";
    }
  }, [finalAnswer, phase]);

  // Safely trigger victory when 3 hits are reached
  useEffect(() => {
    if (hitCount >= 3 && phase === 3) {
      setHitFeedback("PERFECT! 3 Bullseyes! Reclaiming Ithaca...");
      const timer = setTimeout(() => {
        setPhase(4);
        setFinalAnswer("VICTORY");
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [hitCount, phase]);

  // Watchdog timer: If arrow stays in 'flying' state > 2.5s, auto-reset to idle to prevent glitches
  useEffect(() => {
    if (arrowState === 'flying') {
      const watchdog = setTimeout(() => {
        setArrowState('idle');
        setHitFeedback("Arrow reset. Shoot again!");
        setTimeout(() => setHitFeedback(null), 1200);
      }, 2500);
      return () => clearTimeout(watchdog);
    }
  }, [arrowState]);

  // Global mouse & touch release handlers to prevent stuck aim states
  useEffect(() => {
    if (!isAiming) return;

    const getCanvasCoords = (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 130, y: 270 };
      const rect = canvas.getBoundingClientRect();
      const scaleX = 900 / rect.width;
      const scaleY = 450 / rect.height;
      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY,
      };
    };

    const handleGlobalMouseMove = (e: MouseEvent) => {
      const coords = getCanvasCoords(e.clientX, e.clientY);
      setMousePos(coords);
    };

    const handleGlobalMouseUp = (e: MouseEvent) => {
      const coords = getCanvasCoords(e.clientX, e.clientY);
      shootArrow(coords);
    };

    const handleGlobalTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        const coords = getCanvasCoords(touch.clientX, touch.clientY);
        setMousePos(coords);
      }
    };

    const handleGlobalTouchEnd = () => {
      shootArrow(mousePosRef.current);
    };

    window.addEventListener("mousemove", handleGlobalMouseMove);
    window.addEventListener("mouseup", handleGlobalMouseUp);
    window.addEventListener("touchmove", handleGlobalTouchMove);
    window.addEventListener("touchend", handleGlobalTouchEnd);

    return () => {
      window.removeEventListener("mousemove", handleGlobalMouseMove);
      window.removeEventListener("mouseup", handleGlobalMouseUp);
      window.removeEventListener("touchmove", handleGlobalTouchMove);
      window.removeEventListener("touchend", handleGlobalTouchEnd);
    };
  }, [isAiming]);

  const shootArrow = (coords: { x: number; y: number }) => {
    setIsAiming(false);
    if (arrowState === 'flying' || arrowState === 'hit') return;

    const bowX = 130;
    const bowY = 270;
    const pullDx = bowX - coords.x;
    const pullDy = bowY - coords.y;
    const power = Math.min(Math.hypot(pullDx, pullDy), 110);
    const angle = Math.atan2(pullDy, pullDx);

    if (power > 12) {
      arrowPos.current = {
        x: bowX,
        y: bowY,
        vx: Math.cos(angle) * power * 0.22,
        vy: -Math.sin(angle) * power * 0.22,
      };
      setArrowState('flying');
    }
  };

  const resetBow = () => {
    setIsAiming(false);
    setArrowState('idle');
    setHitFeedback("Bow reloaded!");
    setTimeout(() => setHitFeedback(null), 1000);
  };

  // (Phase 1 auto-advances now)

  // Phase 2 Lock Submit
  const handleLockSubmit = () => {
    if (ring1 === lockVariation.r1.ans && ring2 === lockVariation.r2.ans && ring3 === lockVariation.r3.ans) {
      setPhase(3);
    } else {
      setLockError(true);
      setTimeout(() => setLockError(false), 2500);
    }
  };

  // Phase 4 Final Submit
  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalAns = finalAnswer.trim() || "VICTORY";
    window.dispatchEvent(new CustomEvent("nostos-oracle-submit", { detail: finalAns }));
  };

  // Pre-allocated axe X positions to avoid allocations per frame
  const AXE_X_POSITIONS = Array.from({ length: 12 }, (_, i) => 220 + i * 46);

  // Phase 3: 60FPS High Performance Canvas Loop
  useEffect(() => {
    if (phase !== 3) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width; // 900
    const height = canvas.height; // 450
    const bowX = 130;
    const bowY = 270;

    // Cache background and torch gradients ONCE to prevent GC spikes
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#070b14');
    grad.addColorStop(0.6, '#0f172a');
    grad.addColorStop(1, '#1e293b');

    const torchLeft = ctx.createRadialGradient(60, 180, 10, 60, 180, 200);
    torchLeft.addColorStop(0, 'rgba(234, 179, 8, 0.30)');
    torchLeft.addColorStop(1, 'rgba(234, 179, 8, 0)');

    const torchRight = ctx.createRadialGradient(840, 180, 10, 840, 180, 200);
    torchRight.addColorStop(0, 'rgba(225, 29, 72, 0.25)');
    torchRight.addColorStop(1, 'rgba(225, 29, 72, 0)');

    let time = 0;

    const render = () => {
      time += 0.03;
      ctx.clearRect(0, 0, width, height);

      // Read current state from refs (60FPS smooth execution)
      const currentHitCount = hitCountRef.current;
      const currentIsAiming = isAimingRef.current;
      const currentArrowState = arrowStateRef.current;
      const currentMousePos = mousePosRef.current;

      const currentTorch1Lit = torch1LitRef.current;
      const currentTorch2Lit = torch2LitRef.current;
      const isFocusMode = !currentTorch1Lit && !currentTorch2Lit;

      // 1. Grand Palace Hall Background
      ctx.fillStyle = isFocusMode ? '#030509' : grad; // Darken room if focus mode
      ctx.fillRect(0, 0, width, height);

      // Ambient Torch Lights
      if (currentTorch1Lit) {
        ctx.fillStyle = torchLeft;
        ctx.fillRect(0, 0, 300, height);
      }
      if (currentTorch2Lit) {
        ctx.fillStyle = torchRight;
        ctx.fillRect(600, 0, 300, height);
      }

      // Torch Base and Flame Animation
      const flameFlicker = Math.sin(time * 12) * 3;
      
      // Draw Torch 1
      ctx.fillStyle = '#451a03';
      ctx.fillRect(55, 180, 10, 40); // Base
      if (currentTorch1Lit) {
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.arc(60, 180, 9 + flameFlicker, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw Torch 2
      ctx.fillStyle = '#451a03';
      ctx.fillRect(835, 180, 10, 40); // Base
      if (currentTorch2Lit) {
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.arc(840, 180, 9 + flameFlicker, 0, Math.PI * 2);
        ctx.fill();
      }

      // Stone Floor & Pillar Accents
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 380, width, 70);
      ctx.strokeStyle = '#c9a24b';
      ctx.lineWidth = 2;
      ctx.strokeRect(0, 380, width, 2);

      ctx.fillStyle = '#1e293b';
      ctx.fillRect(10, 0, 30, height);
      ctx.fillRect(860, 0, 30, height);
      ctx.strokeStyle = '#334155';
      ctx.strokeRect(10, 0, 30, height);
      ctx.strokeRect(860, 0, 30, height);

      // 2. Round Difficulty Parameters
      let speedMult = 1.8;
      let oscAmp = 45;
      let windX = -0.15;
      let targetY = 270;

      if (currentHitCount === 1) {
        speedMult = 3.5;
        oscAmp = 65;
        windX = -0.28;
        targetY = 270 + Math.sin(time * 2.2) * 50; // Add moving target to crosswind round
      } else if (currentHitCount >= 2) {
        speedMult = 5.2;
        oscAmp = 85;
        windX = -0.45;
        targetY = 270 + Math.sin(time * 3.8) * 90; // Extremely fast moving target
      }

      // FOCUS MODE: THE TRICK IS ACTIVATED
      if (isFocusMode) {
        speedMult = 0; // Freeze axes
        oscAmp = 0;
        windX = 0; // Stop wind
        targetY = 270; // Freeze target in the middle
      }

      // 3. 12 Moving Axe Heads
      AXE_X_POSITIONS.forEach((x, idx) => {
        // High chaos oscillation for each individual axe (frozen perfectly if in focus mode)
        const oscY = 250 + (isFocusMode ? 0 : Math.sin(time * speedMult * 2.5 + idx * 1.8) * oscAmp);

        // Wooden Handle
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(x, oscY - 65);
        ctx.lineTo(x, oscY + 65);
        ctx.stroke();

        // Golden Axe Opening (Ring)
        ctx.strokeStyle = '#c9a24b';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(x, oscY, 26, 0, Math.PI * 2);
        ctx.stroke();

        // Inner Ring Accent
        ctx.strokeStyle = 'rgba(201, 162, 75, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(x, oscY, 20, 0, Math.PI * 2);
        ctx.stroke();
      });

      // 4. Target Backboard (targetX = 810)
      const targetX = 810;

      ctx.fillStyle = '#475569';
      ctx.fillRect(targetX - 4, targetY - 65, 8, 130);

      // Target Rings
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(targetX, targetY, 38, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(targetX, targetY, 24, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#c9a24b';
      ctx.beginPath();
      ctx.arc(targetX, targetY, 11, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(targetX, targetY, 41, 0, Math.PI * 2);
      ctx.stroke();

      // 5. Archer Figure & Bow
      const archerX = 90;
      const archerY = 280;

      ctx.strokeStyle = '#c9a24b';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(archerX, archerY - 35, 12, 0, Math.PI * 2); // Head
      ctx.moveTo(archerX, archerY - 23);
      ctx.lineTo(archerX, archerY + 35); // Body
      ctx.lineTo(archerX - 15, archerY + 80); // Leg 1
      ctx.moveTo(archerX, archerY + 35);
      ctx.lineTo(archerX + 15, archerY + 80); // Leg 2
      ctx.moveTo(archerX, archerY - 10);
      ctx.lineTo(bowX, bowY); // Arm
      ctx.stroke();

      // Recurve Bow
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(bowX, bowY, 38, -Math.PI / 2, Math.PI / 2);
      ctx.stroke();

      // Glowing Pulsing Aim Ring & Indicator Marker around Bow
      const pulse = Math.sin(time * 6) * 4;
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.arc(bowX, bowY, 34 + pulse, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(bowX, bowY, 7, 0, Math.PI * 2);
      ctx.fill();

      // ANIMATED DRAG GUIDE WHEN IDLE
      if (!currentIsAiming && currentArrowState === 'idle') {
        const dragOffset = (Math.sin(time * 4) * 0.5 + 0.5) * 45;
        const guideX = bowX - dragOffset;
        
        ctx.strokeStyle = 'rgba(250, 204, 21, 0.75)';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(bowX, bowY);
        ctx.lineTo(bowX - 60, bowY);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(guideX, bowY, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(guideX, bowY, 14, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.moveTo(bowX - 65, bowY);
        ctx.lineTo(bowX - 52, bowY - 6);
        ctx.lineTo(bowX - 52, bowY + 6);
        ctx.fill();

        const badgeX = 145;
        const badgeY = 338;
        const badgeW = 230;
        const badgeH = 30;

        ctx.fillStyle = 'rgba(11, 18, 30, 0.92)';
        ctx.strokeStyle = '#c9a24b';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        if (typeof ctx.roundRect === 'function') {
          ctx.roundRect(badgeX - badgeW / 2, badgeY - badgeH / 2, badgeW, badgeH, 15);
        } else {
          ctx.rect(badgeX - badgeW / 2, badgeY - badgeH / 2, badgeW, badgeH);
        }
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#facc15';
        ctx.font = 'bold 12px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('← PULL BACK HERE TO AIM 🏹', badgeX, badgeY);
      }

      // Pull Vector calculation when mouse dragging
      let pullDx = 0;
      let pullDy = 0;
      let power = 0;
      let aimAngle = 0;

      if (currentIsAiming) {
        pullDx = bowX - currentMousePos.x;
        pullDy = bowY - currentMousePos.y;
        power = Math.min(Math.hypot(pullDx, pullDy), 110);
        aimAngle = Math.atan2(pullDy, pullDx);
      }

      // Bowstring
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      if (currentIsAiming && power > 5) {
        const stringX = bowX - Math.cos(aimAngle) * (power * 0.4);
        const stringY = bowY - Math.sin(aimAngle) * (power * 0.4);
        ctx.moveTo(bowX, bowY - 48);
        ctx.lineTo(stringX, stringY);
        ctx.lineTo(bowX, bowY + 28);
      } else {
        ctx.moveTo(bowX, bowY - 48);
        ctx.lineTo(bowX, bowY + 28);
      }
      ctx.stroke();

      // 6. Smooth Trajectory Guide Line & Target Hit Prediction
      if (currentIsAiming && power > 10) {
        const simVx = Math.cos(aimAngle) * power * 0.22;
        const simVy = -Math.sin(aimAngle) * power * 0.22;

        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([6, 6]);
        ctx.beginPath();

        let simX = bowX;
        let simY = bowY;
        let curVx = simVx;
        let curVy = simVy;

        ctx.moveTo(simX, simY);
        for (let step = 0; step < 45; step++) {
          simX += curVx;
          simY += curVy;
          curVx += windX;
          curVy += 0.08;
          ctx.lineTo(simX, simY);
        }
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // 7. Flying Arrow Physics & Rendering
      if (currentArrowState === 'flying') {
        const p = arrowPos.current;
        p.vx += windX;
        p.vy += 0.08;
        p.x += p.vx;
        p.y += p.vy;

        const currentAngle = Math.atan2(p.vy, p.vx);
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(currentAngle);

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-25, 0);
        ctx.lineTo(14, 0);
        ctx.stroke();

        ctx.fillStyle = '#eab308';
        ctx.beginPath();
        ctx.moveTo(14, -4);
        ctx.lineTo(24, 0);
        ctx.lineTo(14, 4);
        ctx.fill();

        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.moveTo(-25, 0);
        ctx.lineTo(-30, -5);
        ctx.lineTo(-20, 0);
        ctx.lineTo(-30, 5);
        ctx.fill();

        ctx.restore();

        const distToTarget = Math.hypot(p.x - targetX, p.y - targetY);

        if (distToTarget <= 24) { // Only white ring (24) or bullseye (11)
          setArrowState('hit');
          setHitCount(prev => prev + 1);
          setHitFeedback(`BULLSEYE! Shot ${currentHitCount + 1} of 3 successful!`);

          setTimeout(() => {
            setArrowState('idle');
            setHitFeedback(null);
          }, 800);

        } else if (p.x > 870 || p.y > 400 || p.y < -50) {
          setArrowState('miss');
          setMissCount(prev => prev + 1);
          setHitFeedback("Missed target! Reloading arrow...");
          
          setTimeout(() => {
            setArrowState('idle');
            setHitFeedback(null);
          }, 1000);
        }
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [phase]);

  // Mouse / Touch Start Handlers for Aiming
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (arrowState === 'flying' || arrowState === 'hit') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = 900 / rect.width;
    const scaleY = 450 / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    // Check for torch clicks (only allowed if they've struggled for 60s or missed 3 times)
    const canUseTrick = showHint || timeInPhase > 60 || missCount >= 3;
    if (canUseTrick) {
      if (torch1Lit && Math.hypot(x - 60, y - 180) < 40) {
        setTorch1Lit(false);
        return;
      }
      if (torch2Lit && Math.hypot(x - 840, y - 180) < 40) {
        setTorch2Lit(false);
        return;
      }
    }

    setMousePos({ x, y });
    setIsAiming(true);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (arrowState === 'flying' || arrowState === 'hit') return;
    const canvas = canvasRef.current;
    if (!canvas || e.touches.length === 0) return;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const scaleX = 900 / rect.width;
    const scaleY = 450 / rect.height;
    const x = (touch.clientX - rect.left) * scaleX;
    const y = (touch.clientY - rect.top) * scaleY;

    // Check for torch clicks (only allowed if they've struggled for 60s or missed 3 times)
    const canUseTrick = showHint || timeInPhase > 60 || missCount >= 3;
    if (canUseTrick) {
      if (torch1Lit && Math.hypot(x - 60, y - 180) < 40) {
        setTorch1Lit(false);
        return;
      }
      if (torch2Lit && Math.hypot(x - 840, y - 180) < 40) {
        setTorch2Lit(false);
        return;
      }
    }

    setMousePos({ x, y });
    setIsAiming(true);
  };

  return (
    <div className="flex flex-col items-center space-y-6 w-full max-w-full select-none pb-4">
      
      {/* PHASE 1: The Royal Tapestry Riddle */}
      {phase === 1 && (
        <div className="w-full bg-ink/70 border-2 border-gold/40 p-5 md:p-6 rounded-2xl shadow-2xl backdrop-blur-sm flex flex-col items-center animate-in fade-in duration-500">
          <div className="flex items-center space-x-3 text-gold mb-4 border-b border-gold/20 pb-3 w-full justify-center">
            <span className="text-xs uppercase tracking-widest bg-gold/20 px-2.5 py-1 rounded border border-gold/40">Phase 1 of 3</span>
            <h4 className="font-serif text-lg md:text-xl tracking-widest uppercase font-bold">The Royal Tapestry</h4>
          </div>
          
          <p className="text-parchment/90 font-serif text-center italic text-base md:text-lg mb-5 leading-relaxed">
            "The faithful queen unwinds her shroud each night... click the woven threads to unweave them and reveal her name."
          </p>

          <div className="relative w-full max-w-sm aspect-square bg-black/50 border-4 border-gold/30 rounded-xl overflow-hidden p-2 grid grid-cols-4 grid-rows-4 gap-1">
            {/* The hidden word */}
            <div className="absolute inset-0 flex flex-col items-center justify-center z-0">
              <span className="text-4xl md:text-5xl font-serif font-bold text-gold tracking-[0.2em] opacity-80 drop-shadow-[0_0_15px_rgba(201,162,75,0.8)]">
                PENELOPE
              </span>
            </div>
            
            {/* The threads overlay */}
            {threads.map((isUnwoven, idx) => (
              <div 
                key={idx}
                onClick={() => !isUnwoven && handleThreadClick(idx)}
                className={`relative z-10 transition-all duration-500 cursor-pointer rounded-sm ${
                  isUnwoven 
                    ? "opacity-0 scale-90 pointer-events-none" 
                    : "opacity-100 scale-100 bg-[repeating-linear-gradient(45deg,#1e293b,#1e293b_10px,#0f172a_10px,#0f172a_20px)] border border-slate-700 hover:border-gold/50 shadow-inner"
                }`}
              >
                {!isUnwoven && (
                  <div className="absolute inset-0 bg-gold/5 opacity-0 hover:opacity-100 transition-opacity" />
                )}
              </div>
            ))}
          </div>

          {threads.every(t => t) && (
            <p className="mt-6 text-gold font-serif font-bold text-lg animate-pulse">
              The tapestry is unwoven! Proceeding...
            </p>
          )}
        </div>
      )}

      {/* PHASE 2: Odyssey Lore Lock */}
      {phase === 2 && (
        <div className="w-full bg-ink/70 border-2 border-gold/40 p-5 md:p-6 rounded-2xl shadow-2xl backdrop-blur-sm flex flex-col items-center animate-in fade-in duration-500">
          <div className="flex items-center space-x-3 text-gold mb-4 border-b border-gold/20 pb-3 w-full justify-center">
            <span className="text-xs uppercase tracking-widest bg-gold/20 px-2.5 py-1 rounded border border-gold/40 font-bold">Phase 2 of 3</span>
            <h4 className="font-serif text-lg md:text-xl tracking-widest uppercase font-bold">The Golden Dials</h4>
          </div>

          <p className="text-parchment/90 font-serif text-center italic text-sm md:text-base font-semibold mb-6 leading-relaxed">
            Rotate the heavy dials to match the lock's equations:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8 w-full place-items-center">
            {/* Dial 1 */}
            <div className="flex flex-col items-center space-y-3">
              <span className="text-gold font-serif text-xs md:text-sm font-bold tracking-wider bg-gold/15 border border-gold/40 px-3 py-1 rounded-lg text-center">
                {lockVariation.r1.eq}
              </span>
              <div className="flex items-center space-x-2">
                <button onClick={() => setRing1(r => (r - 1 + 16) % 16)} className="text-gold/60 hover:text-gold p-1 text-2xl font-bold transition-colors">‹</button>
                <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-gold bg-ink flex items-center justify-center shadow-[0_0_20px_rgba(201,162,75,0.3)]">
                  <div className="absolute inset-0 rounded-full border-2 border-dashed border-gold/40 animate-[spin_60s_linear_infinite]" />
                  <span className="text-3xl font-serif text-gold font-bold drop-shadow-md transition-transform duration-300" style={{ transform: `rotate(${ring1 * 22.5}deg)` }}>
                    <div style={{ transform: `rotate(-${ring1 * 22.5}deg)` }}>{ring1}</div>
                  </span>
                </div>
                <button onClick={() => setRing1(r => (r + 1) % 16)} className="text-gold/60 hover:text-gold p-1 text-2xl font-bold transition-colors">›</button>
              </div>
            </div>

            {/* Dial 2 */}
            <div className="flex flex-col items-center space-y-3">
              <span className="text-gold font-serif text-xs md:text-sm font-bold tracking-wider bg-gold/15 border border-gold/40 px-3 py-1 rounded-lg text-center">
                {lockVariation.r2.eq}
              </span>
              <div className="flex items-center space-x-2">
                <button onClick={() => setRing2(r => (r - 1 + 16) % 16)} className="text-gold/60 hover:text-gold p-1 text-2xl font-bold transition-colors">‹</button>
                <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-gold bg-ink flex items-center justify-center shadow-[0_0_20px_rgba(201,162,75,0.3)]">
                  <div className="absolute inset-0 rounded-full border-2 border-dashed border-gold/40 animate-[spin_40s_linear_infinite_reverse]" />
                  <span className="text-3xl font-serif text-gold font-bold drop-shadow-md transition-transform duration-300" style={{ transform: `rotate(${ring2 * 22.5}deg)` }}>
                    <div style={{ transform: `rotate(-${ring2 * 22.5}deg)` }}>{ring2}</div>
                  </span>
                </div>
                <button onClick={() => setRing2(r => (r + 1) % 16)} className="text-gold/60 hover:text-gold p-1 text-2xl font-bold transition-colors">›</button>
              </div>
            </div>

            {/* Dial 3 */}
            <div className="flex flex-col items-center space-y-3">
              <span className="text-gold font-serif text-xs md:text-sm font-bold tracking-wider bg-gold/15 border border-gold/40 px-3 py-1 rounded-lg text-center">
                {lockVariation.r3.eq}
              </span>
              <div className="flex items-center space-x-2">
                <button onClick={() => setRing3(r => (r - 1 + 16) % 16)} className="text-gold/60 hover:text-gold p-1 text-2xl font-bold transition-colors">‹</button>
                <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-gold bg-ink flex items-center justify-center shadow-[0_0_20px_rgba(201,162,75,0.3)]">
                  <div className="absolute inset-0 rounded-full border-2 border-dashed border-gold/40 animate-[spin_50s_linear_infinite]" />
                  <span className="text-3xl font-serif text-gold font-bold drop-shadow-md transition-transform duration-300" style={{ transform: `rotate(${ring3 * 22.5}deg)` }}>
                    <div style={{ transform: `rotate(-${ring3 * 22.5}deg)` }}>{ring3}</div>
                  </span>
                </div>
                <button onClick={() => setRing3(r => (r + 1) % 16)} className="text-gold/60 hover:text-gold p-1 text-2xl font-bold transition-colors">›</button>
              </div>
            </div>
          </div>

          <button 
            onClick={handleLockSubmit}
            className="w-full py-3.5 bg-gold hover:bg-gold-light text-ink font-serif font-bold tracking-widest uppercase rounded-xl shadow-lg transition-all text-sm md:text-base hover:scale-[1.01]"
          >
            Attempt to Unlock Gates →
          </button>
          
          {lockError && (
            <p className="mt-4 text-danger font-serif italic font-bold animate-shake text-center text-sm md:text-base">
              The heavy gears grind to a halt. The combination is incorrect!
            </p>
          )}
        </div>
      )}

      {/* PHASE 3: Real 2D Canvas Bow & Arrow Game */}
      {phase === 3 && (
        <div className="w-full bg-ink/90 border-2 border-gold/60 p-5 md:p-6 rounded-2xl shadow-[0_0_40px_rgba(201,162,75,0.25)] backdrop-blur-xl flex flex-col items-center space-y-5 animate-in fade-in duration-500">
          
          {/* Header Bar with Title & Hit Counter */}
          <div className="flex justify-between items-center w-full border-b border-gold/30 pb-3 gap-2">
            <div className="flex items-center space-x-2 text-gold">
              <Sparkles className="w-5 h-5 text-gold animate-pulse" />
              <h4 className="font-serif text-lg md:text-xl tracking-widest uppercase font-bold">Odysseus's Bow</h4>
            </div>

            {/* 3 Hit Progress Tracker */}
            <div className="flex items-center space-x-2 bg-black/60 border border-gold/40 px-3 py-1.5 rounded-full">
              <span className="text-parchment/90 font-serif text-xs md:text-sm uppercase tracking-widest font-bold hidden sm:inline">Hits:</span>
              <div className="flex items-center space-x-1.5">
                {[1, 2, 3].map((i) => (
                  <div 
                    key={i} 
                    className={`w-7 h-7 md:w-8 md:h-8 rounded-full border flex items-center justify-center font-bold text-xs md:text-sm transition-all duration-300 ${
                      hitCount >= i 
                        ? "border-gold bg-gold/30 text-gold shadow-[0_0_10px_rgba(201,162,75,0.8)] scale-105" 
                        : "border-gold/30 bg-black/50 text-parchment/30"
                    }`}
                  >
                    {hitCount >= i ? "✓" : i}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Level Difficulty Display at Top (Round 1, Round 2, Round 3) */}
          <div className="w-full grid grid-cols-3 gap-2 font-serif text-xs md:text-sm uppercase tracking-wider">
            <div className={`p-2.5 rounded-lg border flex flex-col items-center text-center transition-all ${
              hitCount === 0 
                ? "bg-gold/20 border-gold text-gold font-bold shadow-[0_0_12px_rgba(201,162,75,0.4)]" 
                : hitCount > 0 
                ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-400 font-bold" 
                : "bg-black/40 border-gold/20 text-parchment/40"
            }`}>
              <div className="flex items-center space-x-1 mb-0.5 font-bold">
                {hitCount > 0 ? <CheckCircle className="w-4 h-4" /> : <Trophy className="w-4 h-4" />}
                <span>R1: Easy</span>
              </div>
              <span className="text-[10px] md:text-xs normal-case opacity-90 hidden sm:inline">Static Target</span>
            </div>

            <div className={`p-2.5 rounded-lg border flex flex-col items-center text-center transition-all ${
              hitCount === 1 
                ? "bg-gold/20 border-gold text-gold font-bold shadow-[0_0_12px_rgba(201,162,75,0.4)]" 
                : hitCount > 1 
                ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-400 font-bold" 
                : "bg-black/40 border-gold/20 text-parchment/40"
            }`}>
              <div className="flex items-center space-x-1 mb-0.5 font-bold">
                {hitCount > 1 ? <CheckCircle className="w-4 h-4" /> : <Wind className="w-4 h-4" />}
                <span>R2: Medium</span>
              </div>
              <span className="text-[10px] md:text-xs normal-case opacity-90 hidden sm:inline">Crosswind</span>
            </div>

            <div className={`p-2.5 rounded-lg border flex flex-col items-center text-center transition-all ${
              hitCount === 2 
                ? "bg-gold/20 border-gold text-gold font-bold shadow-[0_0_12px_rgba(201,162,75,0.4)]" 
                : hitCount > 2 
                ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-400 font-bold" 
                : "bg-black/40 border-gold/20 text-parchment/40"
            }`}>
              <div className="flex items-center space-x-1 mb-0.5 font-bold">
                {hitCount > 2 ? <CheckCircle className="w-4 h-4" /> : <Target className="w-4 h-4" />}
                <span>R3: Master</span>
              </div>
              <span className="text-[10px] md:text-xs normal-case opacity-90 hidden sm:inline">Moving Target</span>
            </div>
          </div>

          {/* Explicit Aiming Instruction & Reset Banner */}
          <div className="w-full bg-gold/15 border border-gold/40 p-3 rounded-xl flex items-center justify-between gap-3 text-xs md:text-sm font-serif uppercase tracking-wider text-gold font-bold">
            <div className="flex items-center space-x-2">
              <Target className="w-4 h-4 text-gold shrink-0" />
              <span>Press & Drag back from Golden Bow (glowing ring), set angle, release to shoot!</span>
            </div>
            <button 
              onClick={resetBow}
              className="flex items-center space-x-1 px-3 py-1 bg-gold/20 hover:bg-gold/40 border border-gold/50 rounded-lg text-xs font-bold text-gold transition-all shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>

          {/* Canvas Display (900x450 Resolution) */}
          <div className="relative w-full flex justify-center">
            <canvas 
              ref={canvasRef}
              width={900}
              height={450}
              onMouseDown={handleMouseDown}
              onTouchStart={handleTouchStart}
              className="w-full border-2 border-gold/50 rounded-xl bg-black cursor-crosshair shadow-[inset_0_0_30px_rgba(0,0,0,0.9)] aspect-[2/1]"
            />

            {/* Hit/Miss Instant Feedback Popup */}
            {hitFeedback && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-ink/90 border border-gold text-gold font-serif font-bold text-xs md:text-sm tracking-wider uppercase shadow-2xl animate-in zoom-in duration-200">
                {hitFeedback}
              </div>
            )}
          </div>

        </div>
      )}

      {/* PHASE 4: Solved */}
      {phase === 4 && (
        <div className="w-full bg-ink/70 border-2 border-gold p-6 rounded-2xl shadow-2xl flex flex-col items-center animate-in zoom-in duration-700">
          <div className="flex items-center space-x-3 text-gold mb-5 border-b border-gold/20 pb-3 w-full justify-center">
            <Target className="w-7 h-7 text-gold animate-bounce" />
            <h4 className="font-serif text-xl tracking-widest uppercase font-bold">Palace Reclaimed</h4>
          </div>
          
          <p className="text-parchment/90 font-serif text-center italic text-base leading-relaxed mb-5">
            "{data.combination_clue || "You have bested the suitors, strung the bow, and reached the shores of home."}"
          </p>

          <form onSubmit={handleFinalSubmit} className="w-full flex flex-col items-center space-y-4">
            <label className="text-gold font-serif text-xs uppercase tracking-widest font-bold">
              Final Answer — Kingdom of Odysseus:
            </label>
            <input 
              type="text" 
              value={finalAnswer}
              onChange={e => setFinalAnswer(e.target.value)}
              placeholder="Enter final answer (VICTORY)..."
              className="w-full bg-ink/90 border-2 border-gold px-4 py-3 rounded-xl text-gold font-serif text-center text-xl font-bold uppercase tracking-widest shadow-[0_0_20px_rgba(201,162,75,0.4)] outline-none"
            />
            <button 
              type="submit" 
              className="w-full py-3.5 bg-gold hover:bg-gold-light text-ink font-serif text-base tracking-widest uppercase font-bold rounded-xl shadow-xl transition-all duration-200 hover:scale-102"
            >
              Submit Answer →
            </button>
          </form>
        </div>
      )}

      {/* 2-Minute Subtle Hint System */}
      {showHint && (
        <div className="w-full mt-4 p-4 border border-blue-400/30 bg-blue-950/40 rounded-xl animate-in fade-in slide-in-from-bottom-4 duration-1000 flex items-start space-x-3 text-left">
          <Sparkles className="w-5 h-5 text-blue-400 shrink-0 mt-0.5 animate-pulse" />
          <p className="text-blue-200/80 font-serif text-sm italic leading-relaxed">
            {phase === 1 && "The faithful queen delays her suitors by unraveling her work in the dark... What is woven can be unwoven with a swift touch."}
            {phase === 2 && "Three rings bind the gate. The first is a decade. The second divides. The third multiplies."}
            {phase === 3 && "The cross-winds are too strong for any mortal. The flames in the hall cast a distracting light... finding your focus requires darkness."}
          </p>
        </div>
      )}

    </div>
  );
}
