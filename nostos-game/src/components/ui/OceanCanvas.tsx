"use client";

import { useEffect, useRef } from 'react';

type Props = {
  className?: string;
};

type Star = {
  x: number;
  y: number;
  r: number;
  baseAlpha: number;
  twinkleSpeed: number;
  twinkleOffset: number;
};

type SprayParticle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  alpha: number;
  color: string;
};

type FogBand = {
  y: number;
  speed: number;
  amp: number;
  offset: number;
  opacity: number;
};

type RainDrop = {
  x: number;
  y: number;
  length: number;
  vy: number;
  vx: number;
  alpha: number;
};

/**
 * NOSTOS Aegean Sea Animated Canvas
 * Palette: Aegean Blue (#1B3B5F), Wave Teal (#2E7D8C), Aged Gold (#C9A24B), Parchment (#F1E7D0), Ink (#22252B)
 */
export function OceanCanvas({ className = '' }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const timeRef = useRef(0);
  const flashRef = useRef(0);
  const lightningRef = useRef<{ points: { x: number; y: number }[]; opacity: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;

    const stars: Star[] = [];
    const particles: SprayParticle[] = [];
    const fogBands: FogBand[] = [];
    const rainDrops: RainDrop[] = [];

    const setup = () => {
      // Clamp DPR to 1 to prevent 4K/2K resolution lag
      const dpr = 1;
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Stars in night sky
      stars.length = 0;
      const starCount = Math.floor((width * height) / 18000);
      for (let i = 0; i < starCount; i++) {
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height * 0.45,
          r: Math.random() * 1.2 + 0.3,
          baseAlpha: Math.random() * 0.45 + 0.2,
          twinkleSpeed: Math.random() * 2.2 + 0.8,
          twinkleOffset: Math.random() * Math.PI * 2,
        });
      }

      // Sea fog bands
      fogBands.length = 0;
      const fogCount = 3;
      for (let i = 0; i < fogCount; i++) {
        fogBands.push({
          y: height * (0.35 + i * 0.12),
          speed: 0.05 + i * 0.02,
          amp: 16 + i * 5,
          offset: Math.random() * Math.PI * 2,
          opacity: 0.04 + i * 0.015,
        });
      }

      // Visible Atmospheric Rain Drops
      rainDrops.length = 0;
      const rainCount = Math.floor(width / 14); // Increased density for visible rain
      for (let i = 0; i < rainCount; i++) {
        rainDrops.push({
          x: Math.random() * (width + 300) - 150,
          y: Math.random() * height,
          length: Math.random() * 18 + 14,
          vy: Math.random() * 8 + 16, // Faster rain speed
          vx: -2.0, // Wind slant angle
          alpha: Math.random() * 0.30 + 0.22, // Crisp & visible rain
        });
      }
    };

    setup();
    window.addEventListener('resize', setup);

    const generateLightning = () => {
      const startX = Math.random() * (width * 0.7) + width * 0.15;
      const points = [{ x: startX, y: 0 }];
      let currX = startX;
      let currY = 0;

      while (currY < height * 0.58) {
        currX += (Math.random() - 0.5) * 55;
        currY += Math.random() * 45 + 25;
        points.push({ x: currX, y: currY });
      }

      lightningRef.current = { points, opacity: 1.0 };
    };

    const spawnSprayParticle = () => {
      const isSpray = Math.random() < 0.7;
      particles.push({
        x: Math.random() * width * 1.2 - width * 0.1,
        y: isSpray ? height * (0.55 + Math.random() * 0.35) : height + 10,
        vx: Math.random() * 1.4 + 0.4,
        vy: -(Math.random() * 1.1 + 0.3),
        size: isSpray ? Math.random() * 2.0 + 0.8 : Math.random() * 1.4 + 0.4,
        life: 0,
        maxLife: Math.random() * 140 + 70,
        alpha: 0,
        color: isSpray ? 'rgba(241, 231, 208, ' : 'rgba(46, 125, 140, ',
      });
    };

    // Wave layers tuned to Aegean Blue & Wave Teal palette
    const waveLayers: [number, number, number, number, number, number][] = [
      [0.55, 40, 380, 1.3, 0.98, 0],
      [0.62, 34, 310, 1.7, 0.94, 1],
      [0.69, 28, 250, 2.1, 0.88, 2],
      [0.77, 22, 200, 2.6, 0.80, 3],
      [0.85, 16, 160, 3.1, 0.68, 4],
    ];

    const oceanColors = [
      'rgba(15, 23, 37, 1)',
      'rgba(27, 59, 95, 0.96)',
      'rgba(35, 75, 115, 0.90)',
      'rgba(46, 125, 140, 0.84)',
      'rgba(30, 95, 110, 0.70)',
    ];

    const foamColor = 'rgba(241, 231, 208, ';
    const deepFoamColor = 'rgba(46, 125, 140, ';

    const getWaveY = (
      x: number,
      baseY: number,
      amp: number,
      wavelength: number,
      t: number,
      speed: number,
      layerIdx: number
    ) => {
      const p1 = (x / wavelength) * Math.PI * 2 + t * speed * 0.012 + layerIdx * 1.5;
      const p2 = (x / (wavelength * 0.42)) * Math.PI * 2 - t * speed * 0.018;

      const combined = Math.sin(p1) + 0.45 * Math.sin(p2);
      return baseY + combined * amp;
    };

    let lastTime = 0;
    const fpsInterval = 1000 / 30; // Cap to 30 FPS for buttery smooth performance

    const draw = (currentTime: number) => {
      rafRef.current = requestAnimationFrame(draw);

      const elapsed = currentTime - lastTime;
      if (elapsed < fpsInterval) return;
      lastTime = currentTime - (elapsed % fpsInterval);

      timeRef.current += 1;
      const t = timeRef.current;

      // Occasional Intense Thunder & Lightning Trigger
      if (Math.random() < 0.0035) {
        flashRef.current = Math.random() * 0.5 + 0.45; // Intense full screen flash
        generateLightning();
      }

      if (flashRef.current > 0) {
        flashRef.current *= 0.84; // Rapid realistic decay
        if (flashRef.current < 0.01) flashRef.current = 0;
      }
      const flash = flashRef.current;

      // Dark Sky
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      skyGrad.addColorStop(0, '#0B1017');
      skyGrad.addColorStop(0.4, '#121E2C');
      skyGrad.addColorStop(0.7, '#1B3B5F');
      skyGrad.addColorStop(1, '#0D1B2A');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // Intense Thunder Flash Overlay
      if (flash > 0) {
        ctx.fillStyle = `rgba(255, 245, 215, ${flash * 0.5})`;
        ctx.fillRect(0, 0, width, height);
      }

      // Draw Forked Lightning Bolt
      if (lightningRef.current && lightningRef.current.opacity > 0) {
        const l = lightningRef.current;
        ctx.beginPath();
        ctx.strokeStyle = `rgba(255, 252, 235, ${l.opacity})`;
        ctx.lineWidth = 2.5;
        for (let i = 0; i < l.points.length; i++) {
          if (i === 0) ctx.moveTo(l.points[i].x, l.points[i].y);
          else ctx.lineTo(l.points[i].x, l.points[i].y);
        }
        ctx.stroke();
        l.opacity *= 0.72;
        if (l.opacity < 0.05) lightningRef.current = null;
      }

      // Stars
      for (const s of stars) {
        const tw = Math.sin(t * 0.02 * s.twinkleSpeed + s.twinkleOffset) * 0.5 + 0.5;
        const alpha = s.baseAlpha * (0.3 + tw * 0.7);
        ctx.beginPath();
        ctx.fillStyle = `rgba(241, 231, 208, ${alpha * 0.8})`;
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Gold Moon Glow
      const moonX = width * 0.8;
      const moonY = height * 0.18;
      const moonR = Math.min(width, height) * 0.05;
      const halo = ctx.createRadialGradient(moonX, moonY, 0, moonX, moonY, moonR * 4);
      halo.addColorStop(0, 'rgba(201, 162, 75, 0.35)');
      halo.addColorStop(0.3, 'rgba(46, 125, 140, 0.12)');
      halo.addColorStop(1, 'rgba(27, 59, 95, 0)');
      ctx.fillStyle = halo;
      ctx.fillRect(0, 0, width, height);
      ctx.beginPath();
      ctx.fillStyle = 'rgba(241, 231, 208, 0.85)';
      ctx.arc(moonX, moonY, moonR, 0, Math.PI * 2);
      ctx.fill();

      // Clearly Visible Rain Drops
      ctx.lineWidth = 1.3;
      for (const drop of rainDrops) {
        drop.x += drop.vx;
        drop.y += drop.vy;
        if (drop.y > height) {
          drop.y = -drop.length - Math.random() * 40;
          drop.x = Math.random() * (width + 300) - 150;
        }
        ctx.beginPath();
        ctx.strokeStyle = `rgba(220, 238, 255, ${drop.alpha + flash * 0.2})`;
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x + drop.vx * 1.5, drop.y + drop.length);
        ctx.stroke();
      }

      // Fog Bands
      for (const band of fogBands) {
        const drift = (t * band.speed) % width;
        ctx.beginPath();
        ctx.moveTo(0, band.y);
        for (let x = 0; x <= width; x += 40) {
          const y = band.y + Math.sin((x + drift) * 0.007 + band.offset) * band.amp;
          ctx.lineTo(x, y);
        }
        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        ctx.closePath();
        ctx.fillStyle = `rgba(46, 125, 140, ${band.opacity + flash * 0.03})`;
        ctx.fill();
      }

      // Waves (step x += 8 for 50% faster trig math)
      for (let li = 0; li < waveLayers.length; li++) {
        const [yFrac, amp, wavelength, speed, opacity, colorIndex] = waveLayers[li];
        const baseY = height * yFrac + li * 14;

        ctx.beginPath();
        ctx.moveTo(0, baseY);
        for (let x = 0; x <= width + 8; x += 8) {
          const y = getWaveY(x, baseY, amp, wavelength, t, speed, li);
          ctx.lineTo(x, y);
        }
        ctx.lineTo(width + 10, height + 30);
        ctx.lineTo(-10, height + 30);
        ctx.closePath();
        ctx.fillStyle = oceanColors[colorIndex].replace(/[\d.]+\)$/, `${opacity})`);
        ctx.fill();

        // Wave crest foam
        if (li < 3) {
          ctx.beginPath();
          for (let x = 0; x <= width + 8; x += 8) {
            const y = getWaveY(x, baseY, amp, wavelength, t, speed, li);
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          const foamAlpha = Math.min(1, opacity * 0.65 + flash * 0.2);
          ctx.strokeStyle = `${foamColor}${foamAlpha})`;
          ctx.lineWidth = li === 0 ? 2.0 : 1.2;
          ctx.stroke();
        }
      }

      // Particles (cap to 40 particles max)
      while (particles.length < 40) spawnSprayParticle();
      for (let i = particles.length - 1; i >= 0; i--) {
        const pt = particles[i];
        pt.life += 1;
        pt.x += pt.vx;
        pt.y += pt.vy;
        const lifeRatio = pt.life / pt.maxLife;
        pt.alpha = lifeRatio < 0.25 ? lifeRatio * 4 : 1 - (lifeRatio - 0.25) / 0.75;
        pt.alpha = Math.max(0, Math.min(1, pt.alpha));

        const ptAlpha = pt.alpha * 0.7;
        ctx.beginPath();
        ctx.fillStyle = `${pt.color}${ptAlpha})`;
        ctx.arc(pt.x, pt.y, pt.size * 0.8, 0, Math.PI * 2);
        ctx.fill();

        if (pt.life >= pt.maxLife || pt.y < -20 || pt.x > width + 50) {
          particles.splice(i, 1);
        }
      }
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', setup);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none z-0 ${className}`}
      style={{ display: 'block' }}
      aria-hidden="true"
    />
  );
}
