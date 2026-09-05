"use client";

import { useEffect, useRef } from 'react';

type Props = {
  className?: string;
  scale?: number;
};

/**
 * NOSTOS Ancient Greek Galley (Pentekonter / Trireme)
 * Styled with NOSTOS palette: Aegean Blue, Wave Teal, Aged Gold, Parchment Cream, Charcoal Ink
 */
export function GreekShip({ className = '', scale = 1 }: Props) {
  const bobRef = useRef<SVGGElement>(null);

  useEffect(() => {
    let raf = 0;
    let t = 0;
    const bob = () => {
      t += 1;
      if (bobRef.current) {
        const rot = Math.sin(t * 0.022) * 4.2 + Math.cos(t * 0.038) * 1.2;
        const ty = Math.sin(t * 0.022) * 8 + Math.sin(t * 0.042) * 2.5;
        const tx = Math.cos(t * 0.016) * 5;
        bobRef.current.setAttribute(
          'transform',
          `translate(${tx} ${ty}) rotate(${rot} 210 140)`
        );
      }
      raf = requestAnimationFrame(bob);
    };
    raf = requestAnimationFrame(bob);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <svg
      viewBox="0 0 440 280"
      className={className}
      style={{ transform: `scale(${scale})`, transformOrigin: 'center' }}
      aria-hidden="true"
    >
      <defs>
        {/* Golden ambient glow */}
        <radialGradient id="nostosShipGlow" cx="50%" cy="60%" r="60%">
          <stop offset="0%" stopColor="rgba(201, 162, 75, 0.35)" />
          <stop offset="60%" stopColor="rgba(46, 125, 140, 0.12)" />
          <stop offset="100%" stopColor="rgba(27, 59, 95, 0)" />
        </radialGradient>

        {/* Charcoal Ink Wood Hull Gradient */}
        <linearGradient id="nostosHullWood" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#363A42" />
          <stop offset="40%" stopColor="#22252B" />
          <stop offset="100%" stopColor="#13151A" />
        </linearGradient>

        {/* Aged Gold trim */}
        <linearGradient id="nostosGoldTrim" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F1E7D0" />
          <stop offset="40%" stopColor="#C9A24B" />
          <stop offset="100%" stopColor="#8A6B29" />
        </linearGradient>

        {/* Parchment Sail */}
        <linearGradient id="nostosSailCanvas" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F8F3E6" />
          <stop offset="50%" stopColor="#F1E7D0" />
          <stop offset="100%" stopColor="#D8C8A3" />
        </linearGradient>
      </defs>

      {/* Background glow */}
      <circle cx="210" cy="140" r="160" fill="url(#nostosShipGlow)" />

      <g ref={bobRef}>
        {/* Oars */}
        <g stroke="#C9A24B" strokeWidth="2.2" strokeLinecap="round" opacity="0.85">
          <line x1="120" y1="175" x2="85" y2="215" />
          <line x1="140" y1="175" x2="105" y2="218" />
          <line x1="160" y1="175" x2="125" y2="220" />
          <line x1="180" y1="175" x2="145" y2="222" />
          <line x1="200" y1="175" x2="165" y2="223" />
          <line x1="220" y1="175" x2="185" y2="222" />
          <line x1="240" y1="175" x2="205" y2="220" />
          <line x1="260" y1="175" x2="225" y2="218" />
          <line x1="280" y1="175" x2="245" y2="215" />
        </g>

        {/* Oar Blades */}
        <g fill="#2E7D8C" opacity="0.9">
          <ellipse cx="83" cy="217" rx="6" ry="3" transform="rotate(-40 83 217)" />
          <ellipse cx="103" cy="220" rx="6" ry="3" transform="rotate(-40 103 220)" />
          <ellipse cx="123" cy="222" rx="6" ry="3" transform="rotate(-40 123 222)" />
          <ellipse cx="143" cy="224" rx="6" ry="3" transform="rotate(-40 143 224)" />
          <ellipse cx="163" cy="225" rx="6" ry="3" transform="rotate(-40 163 225)" />
          <ellipse cx="183" cy="224" rx="6" ry="3" transform="rotate(-40 183 224)" />
          <ellipse cx="203" cy="222" rx="6" ry="3" transform="rotate(-40 203 222)" />
          <ellipse cx="223" cy="220" rx="6" ry="3" transform="rotate(-40 223 220)" />
          <ellipse cx="243" cy="217" rx="6" ry="3" transform="rotate(-40 243 217)" />
        </g>

        {/* Ship Hull */}
        <path
          d="M 60,150 C 90,185 280,195 350,155 C 375,140 388,110 395,80 C 375,120 330,165 270,168 C 170,172 90,160 60,150 Z"
          fill="url(#nostosHullWood)"
          stroke="#C9A24B"
          strokeWidth="1.5"
        />

        {/* Bow Battering Ram (Embolos) */}
        <path
          d="M 55,152 L 25,160 C 20,162 18,168 22,172 L 58,168 Z"
          fill="url(#nostosGoldTrim)"
        />

        {/* Warding Eye (Opthalmos) on bow */}
        <ellipse cx="82" cy="158" rx="8" ry="5" fill="#F1E7D0" stroke="#C9A24B" strokeWidth="1" />
        <circle cx="82" cy="158" r="3" fill="#1B3B5F" />
        <circle cx="83" cy="157" r="1" fill="#F1E7D0" />

        {/* Shields along gunwale */}
        <g fill="url(#nostosGoldTrim)" stroke="#22252B" strokeWidth="0.8">
          <circle cx="120" cy="160" r="7" />
          <circle cx="140" cy="161" r="7" />
          <circle cx="160" cy="162" r="7" />
          <circle cx="180" cy="162" r="7" />
          <circle cx="200" cy="162" r="7" />
          <circle cx="220" cy="162" r="7" />
          <circle cx="240" cy="161" r="7" />
          <circle cx="260" cy="160" r="7" />
          <circle cx="280" cy="158" r="7" />
        </g>

        {/* Mast & Rigging */}
        <line x1="210" y1="165" x2="210" y2="40" stroke="#C9A24B" strokeWidth="4.5" strokeLinecap="round" />
        <line x1="130" y1="52" x2="290" y2="52" stroke="#C9A24B" strokeWidth="3" strokeLinecap="round" />
        <line x1="210" y1="40" x2="60" y2="150" stroke="#F1E7D0" strokeWidth="0.8" opacity="0.6" />
        <line x1="210" y1="40" x2="350" y2="155" stroke="#F1E7D0" strokeWidth="0.8" opacity="0.6" />

        {/* Billowing Sail */}
        <path
          d="M 135,54 C 170,75 250,75 285,54 C 275,125 145,125 135,54 Z"
          fill="url(#nostosSailCanvas)"
          stroke="#C9A24B"
          strokeWidth="1.8"
        />

        {/* Ithacan Sun Emblem on Sail */}
        <circle cx="210" cy="85" r="14" fill="none" stroke="#C9A24B" strokeWidth="1.8" />
        <circle cx="210" cy="85" r="6" fill="#C9A24B" />
        {/* Sun rays */}
        <g stroke="#C9A24B" strokeWidth="1.5" strokeLinecap="round">
          <line x1="210" y1="67" x2="210" y2="63" />
          <line x1="210" y1="103" x2="210" y2="107" />
          <line x1="192" y1="85" x2="188" y2="85" />
          <line x1="228" y1="85" x2="232" y2="85" />
          <line x1="197" y1="72" x2="194" y2="69" />
          <line x1="223" y1="98" x2="226" y2="101" />
          <line x1="197" y1="98" x2="194" y2="101" />
          <line x1="223" y1="72" x2="226" y2="69" />
        </g>

        {/* Churning Sea Foam around Hull */}
        <path
          d="M 40,165 Q 60,175 80,168 T 130,178 T 180,175 T 230,178 T 290,172 T 340,168 T 370,150"
          fill="none"
          stroke="#F1E7D0"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.8"
        />
        <path
          d="M 50,170 Q 75,182 105,175 T 160,183 T 225,182 T 285,178 T 350,160"
          fill="none"
          stroke="#2E7D8C"
          strokeWidth="1.8"
          strokeLinecap="round"
          opacity="0.6"
        />
      </g>
    </svg>
  );
}
