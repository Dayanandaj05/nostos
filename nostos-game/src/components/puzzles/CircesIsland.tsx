"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Sparkles } from "lucide-react";

interface Hotspot {
  id: number;
  letter: string;
}

interface CircesIslandProps {
  data: {
    hotspots: Hotspot[];
  };
  incorrectCount: number;
}

const HOTSPOT_COORDS = [
  { cx: 400, cy: 230, r: 50 }, // Hut roof
  { cx: 550, cy: 370, r: 40 }, // Cauldron/Fire
  { cx: 180, cy: 380, r: 45 }, // Left rocky outcrop
];

function SortableLetter({ id, letter }: { id: string, letter: string }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`w-16 h-16 md:w-20 md:h-20 flex items-center justify-center bg-ink/90 border-2 ${isDragging ? 'border-gold shadow-[0_0_20px_rgba(201,162,75,0.4)] scale-110' : 'border-gold/40 shadow-[0_0_10px_rgba(201,162,75,0.15)]'} rounded-lg cursor-grab active:cursor-grabbing hover:bg-gold/10 transition-colors touch-none`}
    >
      <span className="font-serif text-gold text-2xl md:text-3xl font-bold">{letter}</span>
    </div>
  );
}

export function CircesIsland({ data, incorrectCount }: CircesIslandProps) {
  const [found, setFound] = useState<boolean[]>(data.hotspots.map(() => false));
  const [tiles, setTiles] = useState<{id: string, letter: string}[]>([]);
  const prevIncorrectCount = useRef(incorrectCount);

  // Initialize/reshuffle tiles
  useEffect(() => {
    if (found.every(Boolean) && tiles.length === 0) {
      // Create tile objects (ID must be unique even if letters aren't, though here P-I-G are unique)
      const initialTiles = data.hotspots.map(h => ({ id: `tile-${h.id}`, letter: h.letter }));
      // Shuffle
      setTiles(initialTiles.sort(() => Math.random() - 0.5));
    }
  }, [found, data.hotspots, tiles.length]);

  // Reshuffle on incorrect submission
  useEffect(() => {
    if (incorrectCount > prevIncorrectCount.current) {
      if (tiles.length > 0) {
        setTiles([...tiles].sort(() => Math.random() - 0.5));
      }
      prevIncorrectCount.current = incorrectCount;
    }
  }, [incorrectCount, tiles]);

  // Sync arrangement to input field
  useEffect(() => {
    const input = document.querySelector('#oracle-form input[name="answer"]') as HTMLInputElement;
    if (input && found.every(Boolean)) {
      input.value = tiles.map(t => t.letter).join("");
    }
  }, [tiles, found]);

  const handleHotspotClick = (index: number) => {
    if (!found[index]) {
      setFound(prev => {
        const next = [...prev];
        next[index] = true;
        return next;
      });
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setTiles((items) => {
        const oldIndex = items.findIndex(t => t.id === active.id);
        const newIndex = items.findIndex(t => t.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  return (
    <div className="flex flex-col items-center space-y-8 w-full select-none pb-8">
      
      {/* SVG Hidden Object Scene */}
      <div className="relative w-full max-w-3xl aspect-[16/9] border-2 border-gold/30 rounded-xl overflow-hidden shadow-2xl bg-[#0f172a]">
        
        <svg viewBox="0 0 800 450" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
          {/* Background Sky */}
          <rect width="800" height="450" fill="#0f172a" />
          <circle cx="400" cy="250" r="300" fill="url(#moonGlow)" opacity="0.3" />
          
          <defs>
            <radialGradient id="moonGlow">
              <stop offset="0%" stopColor="#c9a24b" />
              <stop offset="100%" stopColor="#0f172a" />
            </radialGradient>
            <radialGradient id="cauldronGlow">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Distant Mountains */}
          <path d="M-100,350 Q100,200 300,350 T700,320 T900,350 L900,450 L-100,450 Z" fill="#1e293b" />
          
          {/* Main Island */}
          <path d="M100,450 Q400,280 700,450 Z" fill="#334155" />
          <path d="M250,450 Q400,320 550,450 Z" fill="#475569" />

          {/* Hut */}
          <rect x="340" y="270" width="120" height="90" fill="#1e293b" />
          {/* Door */}
          <rect x="385" y="310" width="30" height="50" fill="#0f172a" />
          {/* Roof */}
          <polygon points="320,270 400,180 480,270" fill="#64748b" />
          
          {/* Cauldron/Fire area */}
          <ellipse cx="550" cy="380" rx="35" ry="15" fill="#0f172a" />
          <circle cx="550" cy="370" r="50" fill="url(#cauldronGlow)" />
          {/* Small flames */}
          <path d="M540,375 Q550,340 555,365 Q560,330 565,370" stroke="#c9a24b" strokeWidth="3" fill="none" />

          {/* Left Rock Outcrop */}
          <path d="M120,450 Q180,330 240,450 Z" fill="#1e293b" />
          
          {/* Foreground Waves */}
          <path d="M0,420 Q100,390 200,420 T400,420 T600,420 T800,420 L800,450 L0,450 Z" fill="#0ea5e9" opacity="0.1" />
          <path d="M-50,435 Q50,410 150,435 T350,435 T550,435 T750,435 T850,435 L850,450 L-50,450 Z" fill="#0ea5e9" opacity="0.2" />

          {/* Render Hotspots & Found Letters */}
          {data.hotspots.map((hotspot, i) => {
            const coords = HOTSPOT_COORDS[i];
            const isFound = found[i];
            return (
              <g key={i}>
                {isFound ? (
                  <text 
                    x={coords.cx} 
                    y={coords.cy + 15} 
                    textAnchor="middle" 
                    fill="#c9a24b" 
                    fontSize="48" 
                    fontFamily="serif" 
                    fontWeight="bold"
                    className="drop-shadow-[0_0_10px_rgba(201,162,75,0.8)] animate-in zoom-in duration-500"
                  >
                    {hotspot.letter}
                  </text>
                ) : (
                  <circle 
                    cx={coords.cx} 
                    cy={coords.cy} 
                    r={coords.r} 
                    fill="transparent" 
                    cursor="pointer"
                    onClick={() => handleHotspotClick(i)}
                    className="hover:fill-gold/10 transition-colors"
                  />
                )}
              </g>
            );
          })}
        </svg>

        {/* Instructions overlay */}
        {!found.every(Boolean) && (
          <div className="absolute top-4 left-4 bg-ink/80 backdrop-blur-sm border border-gold/30 px-4 py-2 rounded-lg pointer-events-none">
            <p className="text-parchment/80 font-serif italic text-sm md:text-base flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-gold" />
              <span>Search the island to find the ingredients.</span>
            </p>
          </div>
        )}
      </div>

      {/* Arrangement Zone */}
      {found.every(Boolean) && (
        <div className="w-full max-w-lg animate-in fade-in slide-in-from-bottom-4 duration-700">
          <p className="text-parchment/80 font-serif italic text-lg leading-relaxed text-center mb-6">
            Arrange the letters to counter the sorceress's spell.
          </p>
          
          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={tiles.map(t => t.id)} strategy={horizontalListSortingStrategy}>
              <div className="flex justify-center space-x-4 p-6 border border-gold/20 rounded-xl bg-ink/30 backdrop-blur-sm">
                {tiles.map((tile) => (
                  <SortableLetter key={tile.id} id={tile.id} letter={tile.letter} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}

    </div>
  );
}
