"use client";

import React, { useState, useEffect, useRef } from "react";
import { Target, RotateCcw } from "lucide-react";

interface ReturnToIthacaProps {
  data: {
    combination_clue: string;
  };
}

export function ReturnToIthaca({ data }: ReturnToIthacaProps) {
  const [phase, setPhase] = useState<1 | 2 | 3 | 4>(1); // Phase 1: Tapestry, 2: Odyssey Lock, 3: 2D Bow & Arrow, 4: Victory
  
  // Phase 1: Penelope Tapestry
  const [riddleInput, setRiddleInput] = useState("");
  const [riddleError, setRiddleError] = useState(false);

  // Phase 2: Odyssey Lore Lock (Years=10, Cyclops=1, Axes=12)
  const [ring1, setRing1] = useState(0);
  const [ring2, setRing2] = useState(0);
  const [ring3, setRing3] = useState(0);

  // Phase 3: 2D Bow & Arrow Canvas Game
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isAiming, setIsAiming] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [dragCurrent, setDragCurrent] = useState<{ x: number; y: number } | null>(null);
  const [arrowState, setArrowState] = useState<'idle' | 'flying' | 'hit' | 'miss'>('idle');
  const [finalAnswer, setFinalAnswer] = useState("");

  const arrowPos = useRef({ x: 80, y: 220, vx: 0, vy: 0 });
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const input = document.getElementById('oracle-form')?.querySelector('input[name="answer"]') as HTMLInputElement;
    if (input && phase === 4) {
      input.value = finalAnswer || "ITHACA";
    }
  }, [finalAnswer, phase]);

  // Phase 1 Submit
  const handleRiddleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = riddleInput.trim().toUpperCase();
    if (val === "PENELOPE" || val === "TAPESTRY" || val === "SECRET" || val === "ITHACA") {
      setPhase(2);
      setRiddleError(false);
    } else {
      setRiddleError(true);
    }
  };

  // Phase 2 Lock Submit
  const handleLockSubmit = () => {
    if (ring1 === 10 && ring2 === 1 && ring3 === 12) {
      setPhase(3);
    } else {
      alert("The palace lock resists! Hint: 10 Years of Odyssey, 1 Cyclops eye, 12 Axe heads (Set 10 - 1 - 12).");
    }
  };

  // Phase 3: Canvas rendering & trajectory calculation
  useEffect(() => {
    if (phase !== 3) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;

    const render = () => {
      time += 0.03;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Background Sky & Palace Hall
      const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      grad.addColorStop(0, '#0b101d');
      grad.addColorStop(1, '#1b2a4a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Floor
      ctx.fillStyle = '#111827';
      ctx.fillRect(0, 310, canvas.width, 50);
      ctx.strokeStyle = '#c9a24b';
      ctx.lineWidth = 1;
      ctx.strokeRect(0, 310, canvas.width, 1);

      // 12 Axe Heads moving vertically
      const axeXPositions = Array.from({ length: 12 }, (_, i) => 220 + i * 36);
      let clearedAxes = true;

      axeXPositions.forEach((x, idx) => {
        const oscY = 180 + Math.sin(time * 2 + idx * 0.4) * 25;
        
        // Draw Axe Handle
        ctx.strokeStyle = '#854d0e';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(x, oscY - 60);
        ctx.lineTo(x, oscY + 60);
        ctx.stroke();

        // Draw Axe Head (Iron Ring opening)
        ctx.strokeStyle = '#c9a24b';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, oscY, 20, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Target Backboard on Right
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(690, 140, 15, 120);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(693, 160, 9, 80);
      ctx.fillStyle = '#c9a24b';
      ctx.fillRect(695, 185, 5, 30);

      // Draw Archer & Recurve Bow (Left)
      const archerX = 70;
      const archerY = 220;

      // Archer Figure
      ctx.strokeStyle = '#c9a24b';
      ctx.lineWidth = 3;
      ctx.beginPath();
      // Head
      ctx.arc(archerX, archerY - 30, 10, 0, Math.PI * 2);
      // Body
      ctx.moveTo(archerX, archerY - 20);
      ctx.lineTo(archerX, archerY + 30);
      // Arms holding bow
      ctx.moveTo(archerX, archerY - 10);
      ctx.lineTo(archerX + 25, archerY - 10);
      ctx.stroke();

      // Recurve Bow
      ctx.strokeStyle = '#c9a24b';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(archerX + 25, archerY - 10, 30, -Math.PI / 2, Math.PI / 2);
      ctx.stroke();

      // Aim Trajectory Line when dragging
      if (isAiming && dragStart && dragCurrent) {
        const dx = dragStart.x - dragCurrent.x;
        const dy = dragStart.y - dragCurrent.y;
        const power = Math.min(Math.hypot(dx, dy), 100);
        const angle = Math.atan2(dy, dx);

        ctx.strokeStyle = 'rgba(201, 162, 75, 0.5)';
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        let simX = archerX + 25;
        let simY = archerY - 10;
        let simVx = Math.cos(angle) * power * 0.18;
        let simVy = -Math.sin(angle) * power * 0.18;

        ctx.moveTo(simX, simY);
        for (let t = 0; t < 30; t++) {
          simX += simVx;
          simY += simVy;
          simVy += 0.25; // gravity
          ctx.lineTo(simX, simY);
        }
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Flying Arrow
      if (arrowState === 'flying') {
        const p = arrowPos.current;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.25; // gravity

        // Draw Arrow
        const arrowAngle = Math.atan2(p.vy, p.vx);
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(arrowAngle);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-20, 0);
        ctx.lineTo(10, 0);
        ctx.stroke();
        // Arrow tip
        ctx.fillStyle = '#c9a24b';
        ctx.beginPath();
        ctx.moveTo(10, -3);
        ctx.lineTo(18, 0);
        ctx.lineTo(10, 3);
        ctx.fill();
        ctx.restore();

        // Hit Backboard Check
        if (p.x >= 690 && p.y >= 140 && p.y <= 260) {
          setArrowState('hit');
          setPhase(4);
          setFinalAnswer("ITHACA");
        } else if (p.x > 730 || p.y > 320 || p.y < 0) {
          setArrowState('miss');
        }
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [phase, isAiming, dragStart, dragCurrent, arrowState]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (arrowState === 'flying') return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setDragStart({ x, y });
    setDragCurrent({ x, y });
    setIsAiming(true);
    setArrowState('idle');
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isAiming) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    setDragCurrent({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleMouseUp = () => {
    if (!isAiming || !dragStart || !dragCurrent) return;
    setIsAiming(false);

    const dx = dragStart.x - dragCurrent.x;
    const dy = dragStart.y - dragCurrent.y;
    const power = Math.min(Math.hypot(dx, dy), 100);
    const angle = Math.atan2(dy, dx);

    if (power > 15) {
      arrowPos.current = {
        x: 95,
        y: 210,
        vx: Math.cos(angle) * power * 0.18,
        vy: -Math.sin(angle) * power * 0.18,
      };
      setArrowState('flying');
    }
  };

  return (
    <div className="flex flex-col items-center space-y-8 w-full select-none pb-8">
      
      {/* PHASE 1: Penelope's Tapestry Riddle */}
      {phase === 1 && (
        <div className="w-full max-w-2xl bg-ink/70 border-2 border-gold/40 p-8 rounded-xl shadow-2xl backdrop-blur-sm flex flex-col items-center animate-in fade-in duration-500">
          <div className="flex items-center space-x-3 text-gold mb-4 border-b border-gold/20 pb-3 w-full justify-center">
            <span className="text-xs uppercase tracking-widest bg-gold/20 px-3 py-1 rounded border border-gold/40">Trial 10 — Phase 1 of 3</span>
            <h4 className="font-serif text-xl tracking-widest uppercase">Penelope's Tapestry</h4>
          </div>
          
          <p className="text-parchment/90 font-serif text-center italic text-lg mb-6 leading-relaxed">
            "The faithful queen who unwove her shroud each night for 20 years to delay the suitors while waiting for Odysseus. Speak her name to enter."
          </p>

          <form onSubmit={handleRiddleSubmit} className="w-full max-w-md space-y-4">
            <input 
              type="text" 
              value={riddleInput}
              onChange={e => setRiddleInput(e.target.value)}
              placeholder="Name of the Queen (PENELOPE)..."
              className="w-full bg-ink/80 border border-gold/40 focus:border-gold px-4 py-3 rounded text-parchment font-serif text-center text-lg uppercase tracking-widest outline-none"
            />
            {riddleError && (
              <p className="text-danger text-center text-sm font-serif italic">The tapestry unravels... Enter PENELOPE.</p>
            )}
            <button type="submit" className="w-full py-3 bg-gold/20 hover:bg-gold/30 border border-gold text-gold font-serif tracking-widest uppercase rounded">
              Pass First Gate →
            </button>
          </form>
        </div>
      )}

      {/* PHASE 2: Odyssey Lore Lock */}
      {phase === 2 && (
        <div className="w-full max-w-2xl bg-ink/70 border-2 border-gold/40 p-8 rounded-xl shadow-2xl backdrop-blur-sm flex flex-col items-center animate-in fade-in duration-500">
          <div className="flex items-center space-x-3 text-gold mb-4 border-b border-gold/20 pb-3 w-full justify-center">
            <span className="text-xs uppercase tracking-widest bg-gold/20 px-3 py-1 rounded border border-gold/40">Trial 10 — Phase 2 of 3</span>
            <h4 className="font-serif text-xl tracking-widest uppercase">Odyssey Lore Lock</h4>
          </div>

          <p className="text-parchment/90 font-serif text-center italic text-base mb-6">
            Align the 3 rings to the Odyssey lore numbers: <br />
            <strong>Years of Voyage (10)</strong> — <strong>Cyclops Eyes (1)</strong> — <strong>Axe Heads (12)</strong>
          </p>

          <div className="grid grid-cols-3 gap-6 mb-8 w-full max-w-md">
            {/* Ring 1 */}
            <div className="flex flex-col items-center space-y-2">
              <span className="text-parchment/60 text-xs uppercase tracking-widest font-serif">Years (10)</span>
              <button 
                onClick={() => setRing1((ring1 + 1) % 15)}
                className="w-20 h-20 rounded-full border-2 border-gold bg-ink flex items-center justify-center text-3xl font-serif text-gold font-bold shadow-[0_0_15px_rgba(201,162,75,0.3)] hover:scale-105 transition-transform"
              >
                {ring1}
              </button>
            </div>

            {/* Ring 2 */}
            <div className="flex flex-col items-center space-y-2">
              <span className="text-parchment/60 text-xs uppercase tracking-widest font-serif">Cyclops (1)</span>
              <button 
                onClick={() => setRing2((ring2 + 1) % 10)}
                className="w-20 h-20 rounded-full border-2 border-gold bg-ink flex items-center justify-center text-3xl font-serif text-gold font-bold shadow-[0_0_15px_rgba(201,162,75,0.3)] hover:scale-105 transition-transform"
              >
                {ring2}
              </button>
            </div>

            {/* Ring 3 */}
            <div className="flex flex-col items-center space-y-2">
              <span className="text-parchment/60 text-xs uppercase tracking-widest font-serif">Axes (12)</span>
              <button 
                onClick={() => setRing3((ring3 + 1) % 15)}
                className="w-20 h-20 rounded-full border-2 border-gold bg-ink flex items-center justify-center text-3xl font-serif text-gold font-bold shadow-[0_0_15px_rgba(201,162,75,0.3)] hover:scale-105 transition-transform"
              >
                {ring3}
              </button>
            </div>
          </div>

          <button 
            onClick={handleLockSubmit}
            className="w-full max-w-md py-3 bg-gold/20 hover:bg-gold/30 border border-gold text-gold font-serif tracking-widest uppercase rounded"
          >
            Unlock Palace Gates →
          </button>
        </div>
      )}

      {/* PHASE 3: Real 2D Canvas Bow & Arrow Game */}
      {phase === 3 && (
        <div className="w-full max-w-3xl bg-ink/80 border-2 border-gold/40 p-6 rounded-xl shadow-2xl backdrop-blur-md flex flex-col items-center space-y-4 animate-in fade-in duration-500">
          <div className="flex items-center space-x-3 text-gold border-b border-gold/20 pb-3 w-full justify-center">
            <span className="text-xs uppercase tracking-widest bg-gold/20 px-3 py-1 rounded border border-gold/40">Trial 10 — Final Trial</span>
            <h4 className="font-serif text-xl tracking-widest uppercase">Odysseus's Bow & 12 Axe Heads</h4>
          </div>

          <p className="text-parchment/90 font-serif text-center italic text-sm">
            Click & drag backward on the bow to adjust string pull power and angle, then release to shoot through the 12 moving axe heads!
          </p>

          <canvas 
            ref={canvasRef}
            width={720}
            height={360}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            className="w-full max-w-3xl border-2 border-gold/30 rounded-lg bg-black cursor-crosshair shadow-inner"
          />

          {arrowState === 'miss' && (
            <div className="flex flex-col items-center space-y-2 pt-2">
              <span className="text-danger font-serif tracking-widest uppercase">The arrow missed the target!</span>
              <button 
                onClick={() => setArrowState('idle')}
                className="flex items-center space-x-2 px-6 py-2 border border-danger/50 rounded text-danger hover:bg-danger/10"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Shoot Again</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* PHASE 4: Solved */}
      {phase === 4 && (
        <div className="w-full max-w-2xl bg-ink/70 border-2 border-gold p-8 rounded-xl shadow-2xl flex flex-col items-center animate-in zoom-in duration-700">
          <div className="flex items-center space-x-3 text-gold mb-6 border-b border-gold/20 pb-4 w-full justify-center">
            <Target className="w-8 h-8 text-gold animate-bounce" />
            <h4 className="font-serif text-2xl tracking-widest uppercase">Palace Reclaimed</h4>
          </div>
          
          <p className="text-parchment/90 font-serif text-center italic text-xl leading-relaxed mb-6">
            "{data.combination_clue || "You have bested the suitors, strung the bow, and reached the shores of home."}"
          </p>

          <div className="w-full flex flex-col items-center">
            <input 
              type="text" 
              value={finalAnswer}
              onChange={e => setFinalAnswer(e.target.value)}
              placeholder="Final answer: ITHACA"
              className="w-full max-w-md bg-ink/90 border-2 border-gold px-4 py-3 rounded text-gold font-serif text-center text-2xl font-bold uppercase tracking-widest shadow-[0_0_20px_rgba(201,162,75,0.4)]"
            />
          </div>
        </div>
      )}

    </div>
  );
}
