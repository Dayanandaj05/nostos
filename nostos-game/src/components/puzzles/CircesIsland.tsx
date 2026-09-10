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
import { Sparkles, Scissors, Key, Flame, Utensils, CheckCircle2, Wand2 } from "lucide-react";

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

const TOOLS = [
  { id: "sickle", name: "Bronze Sickle", icon: Scissors, targetIdx: 0, hint: "Cut the overgrown magical thorny vines" },
  { id: "key", name: "Golden Key", icon: Key, targetIdx: 1, hint: "Unlock the entrance to Circe's grand palace" },
  { id: "torch", name: "Sacred Torch", icon: Flame, targetIdx: 2, hint: "Illuminate the dark marble altar shrine" },
  { id: "ladle", name: "Magic Ladle", icon: Utensils, targetIdx: 3, hint: "Stir the bubbling crimson elixir cauldron" },
];

const VISUAL_ELEMENTS = [
  { id: "bush", cx: 160, cy: 360, r: 50, hitR: 90 },
  { id: "door", cx: 400, cy: 310, r: 45, hitR: 80 },
  { id: "altar", cx: 640, cy: 230, r: 40, hitR: 80 },
  { id: "cauldron", cx: 650, cy: 375, r: 45, hitR: 80 },
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
      className={`w-16 h-16 md:w-22 md:h-22 flex items-center justify-center bg-[#0B121E] border-2 ${isDragging ? 'border-gold shadow-[0_0_25px_rgba(201,162,75,0.6)] scale-110' : 'border-gold/50 shadow-[0_0_15px_rgba(201,162,75,0.2)]'} rounded-xl cursor-grab active:cursor-grabbing hover:bg-gold/15 transition-all touch-none`}
    >
      <span className="font-serif text-gold text-3xl md:text-4xl font-bold drop-shadow-[0_0_10px_rgba(201,162,75,0.8)]">{letter}</span>
    </div>
  );
}

export function CircesIsland({ data, incorrectCount }: CircesIslandProps) {
  const hotspotsList = data.hotspots && data.hotspots.length === 4 
    ? data.hotspots 
    : [
        { id: 1, letter: "M" },
        { id: 2, letter: "O" },
        { id: 3, letter: "L" },
        { id: 4, letter: "Y" }
      ];

  const [found, setFound] = useState<boolean[]>(hotspotsList.map(() => false));
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [activeAnimation, setActiveAnimation] = useState<number | null>(null);
  const [tiles, setTiles] = useState<{id: string, letter: string}[]>([]);
  const prevIncorrectCount = useRef(incorrectCount);

  // Initialize/reshuffle tiles
  useEffect(() => {
    if (found.every(Boolean) && tiles.length === 0) {
      const initialTiles = hotspotsList.map(h => ({ id: `tile-${h.id}`, letter: h.letter }));
      setTiles(initialTiles.sort(() => Math.random() - 0.5));
    }
  }, [found, hotspotsList, tiles.length]);

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
    if (found[index]) return;

    if (!selectedTool) {
      // User clicked without selecting a tool. We animate failure silently instead of blocking alert.
      setActiveAnimation(index);
      setTimeout(() => setActiveAnimation(null), 300);
      return;
    }

    const currentToolObj = TOOLS.find(t => t.id === selectedTool);
    if (currentToolObj && currentToolObj.targetIdx === index) {
      // Trigger action animation
      setActiveAnimation(index);
      setTimeout(() => {
        setFound(prev => {
          const next = [...prev];
          next[index] = true;
          return next;
        });
        setActiveAnimation(null);
        setSelectedTool(null);
      }, 700);
    } else {
      // Incorrect tool chosen. Animate failure gently.
      setActiveAnimation(index);
      setTimeout(() => {
        setActiveAnimation(null);
        setSelectedTool(null);
      }, 400);
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
    <div className="flex flex-col items-center space-y-8 w-full max-w-6xl mx-auto select-none pb-8">
      
      {/* Main Quest Scene & Equipment Bar */}
      <div className="flex flex-col gap-6 w-full">
        
        {/* SVG Interactive Scene */}
        <div className="w-full relative aspect-[16/9] border-2 border-gold/40 rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.8)] bg-[#0A0E17]">
          
          <svg viewBox="0 0 800 450" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
            <defs>
              <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0B1325" />
                <stop offset="100%" stopColor="#1E293B" />
              </linearGradient>

              <radialGradient id="moonGlow">
                <stop offset="0%" stopColor="#C9A24B" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#0B1325" stopOpacity="0" />
              </radialGradient>

              <radialGradient id="potionGlow">
                <stop offset="0%" stopColor="#EF4444" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#EF4444" stopOpacity="0" />
              </radialGradient>

              <radialGradient id="shrineGlow">
                <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Night Sky Background */}
            <rect width="800" height="450" fill="url(#skyGrad)" />
            <circle cx="400" cy="200" r="280" fill="url(#moonGlow)" />
            
            {/* Distant Mountains & Cliffs */}
            <path d="M-50,380 L150,220 L350,380 L550,200 L850,380 L850,450 L-50,450 Z" fill="#111827" />
            <path d="M50,450 Q300,260 550,450 Z" fill="#1F2937" />

            {/* Circe's Temple Palace Structure */}
            <rect x="300" y="220" width="200" height="150" fill="#1E293B" stroke="#334155" strokeWidth="2" />
            
            {/* Temple Columns */}
            <rect x="315" y="240" width="16" height="130" fill="#334155" />
            <rect x="345" y="240" width="16" height="130" fill="#334155" />
            <rect x="435" y="240" width="16" height="130" fill="#334155" />
            <rect x="465" y="240" width="16" height="130" fill="#334155" />
            <polygon points="280,220 400,140 520,220" fill="#475569" stroke="#C9A24B" strokeWidth="1" />

            {/* Palace Bronze Door (Target 1) */}
            <rect x="375" y="275" width="50" height="95" fill="#0B121E" stroke="#C9A24B" strokeWidth="2" rx="4" />
            <circle cx="415" cy="325" r="4" fill="#C9A24B" />

            {/* Marble Altar Shrine (Target 2) */}
            <path d="M600,270 L680,270 L670,200 L610,200 Z" fill="#334155" stroke="#64748B" strokeWidth="1.5" />
            <circle cx="640" cy="230" r="35" fill="url(#shrineGlow)" />
            <polygon points="640,195 648,215 670,215 652,228 658,250 640,236 622,250 628,228 610,215 632,215" fill="#C9A24B" opacity="0.8" />

            {/* Overgrown Thorny Bush Rocks (Target 0) */}
            <path d="M80,450 Q160,300 240,450 Z" fill="#111827" />
            <path d="M100,420 Q160,320 220,430" stroke="#15803D" strokeWidth="6" fill="none" />
            <path d="M120,400 Q170,350 210,410" stroke="#16A34A" strokeWidth="4" fill="none" />
            <circle cx="140" cy="360" r="4" fill="#C9A24B" />
            <circle cx="180" cy="340" r="4" fill="#C9A24B" />

            {/* Cauldron Potion Fire (Target 3) */}
            <circle cx="650" cy="375" r="45" fill="url(#potionGlow)" />
            <ellipse cx="650" cy="390" rx="38" ry="14" fill="#0B121E" stroke="#C9A24B" strokeWidth="2" />
            <path d="M635,390 Q650,350 655,380 Q660,340 665,390" stroke="#EF4444" strokeWidth="3" fill="none" />

            {/* Interactive Visual Targets */}
            {hotspotsList.map((hotspot, i) => {
              const elem = VISUAL_ELEMENTS[i] || VISUAL_ELEMENTS[0];
              const isFound = found[i];
              const isAnimating = activeAnimation === i;

              return (
                <g key={i} className="cursor-pointer group" onClick={() => handleHotspotClick(i)}>
                  {/* Invisible Hitbox to make clicking extremely forgiving */}
                  <circle cx={elem.cx} cy={elem.cy} r={elem.hitR} fill="transparent" />
                  
                  {isFound ? (
                    <g className="animate-in zoom-in duration-500">
                      <circle cx={elem.cx} cy={elem.cy} r={32} fill="#0B121E" stroke="#C9A24B" strokeWidth="2.5" />
                      <circle cx={elem.cx} cy={elem.cy} r={28} fill="url(#moonGlow)" />
                      <text 
                        x={elem.cx} 
                        y={elem.cy + 11} 
                        textAnchor="middle" 
                        fill="#C9A24B" 
                        fontSize="34" 
                        fontFamily="serif" 
                        fontWeight="bold"
                        className="drop-shadow-[0_0_10px_rgba(201,162,75,0.8)]"
                      >
                        {hotspot.letter}
                      </text>
                    </g>
                  ) : (
                    <g>
                      <circle 
                        cx={elem.cx} 
                        cy={elem.cy} 
                        r={elem.r} 
                        fill={selectedTool ? "rgba(201,162,75,0.2)" : "rgba(201,162,75,0.05)"} 
                        stroke="#C9A24B"
                        strokeWidth={isAnimating ? "4" : "1.5"}
                        strokeDasharray={selectedTool ? "4 4" : "none"}
                        className={`transition-all duration-300 ${
                          isAnimating 
                            ? 'animate-ping stroke-gold' 
                            : 'group-hover:fill-gold/30 group-hover:scale-110'
                        }`}
                      />
                      <circle 
                        cx={elem.cx} 
                        cy={elem.cy} 
                        r={12} 
                        fill="#C9A24B" 
                        opacity="0.3"
                        className="group-hover:opacity-80 transition-opacity"
                      />
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Instruction Banner (Moved below SVG) */}
        {!found.every(Boolean) && (
          <div className="bg-[#0B121E]/95 border-2 border-gold/40 px-5 py-3 rounded-xl flex flex-col md:flex-row items-center justify-between shadow-xl gap-3 text-center md:text-left w-full">
            <p className="text-parchment/90 font-serif italic text-sm flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-gold animate-pulse shrink-0" />
              <span>Select an Equipment Tool, then click its matching visual object in Circe's palace!</span>
            </p>
            {selectedTool && (
              <span className="text-gold font-serif text-xs uppercase tracking-widest font-bold bg-gold/15 px-3 py-1 rounded-full border border-gold/30 shrink-0">
                Tool Ready: {TOOLS.find(t => t.id === selectedTool)?.name}
              </span>
            )}
          </div>
        )}

        {/* Equipment Toolbelt Sidebar */}
        <div className="w-full bg-[#0B121E]/95 border-2 border-gold/40 p-6 rounded-2xl flex flex-col backdrop-blur-xl shadow-2xl space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-gold/30 pb-3 gap-2">
            <h4 className="text-gold font-serif text-lg tracking-widest uppercase font-bold flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-gold" />
              <span>Equipment Bar</span>
            </h4>
            <p className="text-parchment/60 font-serif text-xs italic">
              Equip your tools to break Circe's swine curse:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
            {TOOLS.map((tool) => {
              const IconComp = tool.icon;
              const isSelected = selectedTool === tool.id;
              const isUsed = found[tool.targetIdx];

              return (
                <button
                  key={tool.id}
                  disabled={isUsed}
                  onClick={() => setSelectedTool(isSelected ? null : tool.id)}
                  className={`w-full flex items-center space-x-3 p-3.5 rounded-xl border transition-all text-left ${
                    isUsed 
                      ? 'bg-zinc-900/40 border-zinc-800 text-zinc-600 opacity-40 cursor-not-allowed'
                      : isSelected 
                        ? 'bg-gold/25 border-gold text-gold shadow-[0_0_20px_rgba(201,162,75,0.4)] scale-102 font-bold' 
                        : 'bg-ink/80 border-gold/20 text-parchment/80 hover:border-gold/50 hover:bg-gold/10'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isSelected ? 'bg-gold text-ink' : 'bg-gold/15 text-gold'}`}>
                    <IconComp className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <span className="font-serif text-xs uppercase tracking-wider font-bold block">{tool.name}</span>
                    <span className="text-[10px] text-parchment/50 font-serif italic block">{tool.hint}</span>
                  </div>
                  {isUsed && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                </button>
              );
            })}
          </div>

          <div className="border-t border-gold/20 pt-3 text-center">
            <span className="text-gold/70 font-serif text-xs italic">
              {found.filter(Boolean).length} of 4 Ingredients Unlocked
            </span>
          </div>
        </div>

      </div>

      {/* Letter Drag and Drop Zone */}
      {found.every(Boolean) && (
        <div className="w-full max-w-xl bg-[#0B121E] border-2 border-gold p-8 rounded-2xl shadow-[0_0_50px_rgba(201,162,75,0.3)] flex flex-col items-center animate-in zoom-in duration-500 text-center space-y-4">
          <p className="text-parchment font-serif italic text-lg leading-relaxed">
            All ingredients gathered! Drag the letters into order to form the holy antidote:
          </p>
          
          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={tiles.map(t => t.id)} strategy={horizontalListSortingStrategy}>
              <div className="flex justify-center space-x-4 p-6 border border-gold/30 rounded-xl bg-ink/60 backdrop-blur-sm w-full">
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
