"use client";

import React from "react";
import { useRouter } from "next/navigation";

export function LevelSelector({ currentLevel }: { currentLevel: number }) {
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const targetLevel = e.target.value;
    if (targetLevel) {
      router.push(`/play?level=${targetLevel}`);
    }
  };

  return (
    <div className="flex items-center space-x-2 bg-black/60 border border-gold/40 px-3 py-1.5 rounded-lg text-gold font-serif text-xs uppercase tracking-wider shadow-sm">
      <span className="text-gold/80 font-bold">Select Trial:</span>
      <select
        value={currentLevel}
        onChange={handleChange}
        className="bg-[#0B121E] text-gold border border-gold/40 rounded px-2 py-1 font-serif font-bold text-xs uppercase outline-none cursor-pointer hover:border-gold transition-colors"
      >
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((lvl) => (
          <option key={lvl} value={lvl} className="bg-[#0B121E] text-parchment">
            Trial {lvl}
          </option>
        ))}
      </select>
    </div>
  );
}
