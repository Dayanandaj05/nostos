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
  { id: "cauldron", cx: 640, cy: 375, r: 45, hitR: 80 },
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
  // Mixed up letter arrangement for picture hotspots (never spells M-O-L-Y left to right: O - Y - M - L)
  const hotspotsList = [
    { id: 1, letter: "O" }, // Bush (x=160, left)
    { id: 2, letter: "Y" }, // Door (x=400, center)
    { id: 3, letter: "M" }, // Altar (x=640, right upper)
    { id: 4, letter: "L" }  // Cauldron (x=640, right lower)
  ];

  const [found, setFound] = useState<boolean[]>(hotspotsList.map(() => false));
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [animatingAction, setAnimatingAction] = useState<{ index: number; type: 'cutting' | 'opening' | 'lighting' | 'mixing' } | null>(null);
  const [tiles, setTiles] = useState<{id: string, letter: string}[]>([]);
  const [toolHint, setToolHint] = useState<string | null>(null);
  const prevIncorrectCount = useRef(incorrectCount);

  // Initialize tiles in a guaranteed scrambled order (NEVER pre-arranged as "MOLY")
  useEffect(() => {
    if (found.every(Boolean) && tiles.length === 0) {
      const initialTiles = hotspotsList.map(h => ({ id: `tile-${h.id}`, letter: h.letter }));
      let scrambled = [...initialTiles].sort(() => Math.random() - 0.5);
      if (scrambled.map(t => t.letter).join("") === "MOLY") {
        scrambled = [initialTiles[1], initialTiles[0], initialTiles[3], initialTiles[2]]; // Guaranteed scrambled: O-M-Y-L
      }
      setTiles(scrambled);
    }
  }, [found, hotspotsList, tiles.length]);

  // Reshuffle on incorrect answer submit
  useEffect(() => {
    if (incorrectCount > prevIncorrectCount.current) {
      if (tiles.length > 0) {
        let scrambled = [...tiles].sort(() => Math.random() - 0.5);
        if (scrambled.map(t => t.letter).join("") === "MOLY") {
          scrambled = [tiles[1], tiles[0], tiles[3], tiles[2]];
        }
        setTiles(scrambled);
      }
      prevIncorrectCount.current = incorrectCount;
    }
  }, [incorrectCount, tiles]);

  // Sync answer to hidden oracle-form only when arranged
  useEffect(() => {
    const input = document.querySelector('#oracle-form input[name="answer"]') as HTMLInputElement;
    if (input && found.every(Boolean) && tiles.length > 0) {
      const currentWord = tiles.map(t => t.letter).join("");
      input.value = currentWord;
    }
  }, [tiles, found]);

  const handleHotspotClick = (index: number) => {
    if (found[index] || animatingAction) return;

    // If no tool selected, auto-select matching tool for this object!
    let activeTool = selectedTool;
    if (!activeTool) {
      const matchingTool = TOOLS.find(t => t.targetIdx === index);
      if (matchingTool) {
        activeTool = matchingTool.id;
        setSelectedTool(matchingTool.id);
      }
    }

    const currentToolObj = TOOLS.find(t => t.id === activeTool);
    if (currentToolObj && currentToolObj.targetIdx === index) {
      setToolHint(null);
      const actionType = activeTool === 'sickle' ? 'cutting' 
        : activeTool === 'key' ? 'opening' 
        : activeTool === 'torch' ? 'lighting' 
        : 'mixing';

      // Trigger rich custom animation
      setAnimatingAction({ index, type: actionType });

      setTimeout(() => {
        setFound(prev => {
          const next = [...prev];
          next[index] = true;
          return next;
        });
        setAnimatingAction(null);
        setSelectedTool(null);
      }, 1100);
    } else {
      const requiredTool = TOOLS.find(t => t.targetIdx === index);
      if (requiredTool) {
        setToolHint(`Equip the ${requiredTool.name} to interact with this area!`);
        setTimeout(() => setToolHint(null), 3000);
      }
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
      
      {/* Custom Keyframe Styles for Rich Interactive Animations */}
      <style>{`
        @keyframes sickleCut {
          0% { transform: translate(-35px, -35px) rotate(-60deg); opacity: 0; }
          30% { transform: translate(-10px, -10px) rotate(-15deg); opacity: 1; }
          70% { transform: translate(25px, 20px) rotate(45deg); opacity: 1; }
          100% { transform: translate(45px, 35px) rotate(80deg); opacity: 0; }
        }
        @keyframes slashLine {
          0% { stroke-dashoffset: 120; opacity: 0; }
          40% { stroke-dashoffset: 0; opacity: 1; }
          100% { stroke-dashoffset: 0; opacity: 0; }
        }
        @keyframes keyTurn {
          0% { transform: rotate(0deg) scale(0.6); opacity: 0; }
          40% { transform: rotate(0deg) scale(1); opacity: 1; }
          80% { transform: rotate(90deg) scale(1); opacity: 1; }
          100% { transform: rotate(90deg) scale(1.1); opacity: 0; }
        }
        @keyframes doorSlideLeft {
          0% { transform: translateX(0px); }
          100% { transform: translateX(-28px); }
        }
        @keyframes doorSlideRight {
          0% { transform: translateX(0px); }
          100% { transform: translateX(28px); }
        }
        @keyframes torchLightIgnite {
          0% { transform: translateY(-30px) scale(0.5); opacity: 0; }
          40% { transform: translateY(0px) scale(1); opacity: 1; }
          70% { transform: translateY(-10px) scale(1.4); opacity: 1; }
          100% { transform: translateY(-5px) scale(1); opacity: 0.9; }
        }
        @keyframes ladleMixStir {
          0% { transform: translate(0px, -20px) rotate(0deg); }
          25% { transform: translate(14px, -10px) rotate(90deg); }
          50% { transform: translate(0px, 0px) rotate(180deg); }
          75% { transform: translate(-14px, -10px) rotate(270deg); }
          100% { transform: translate(0px, -20px) rotate(360deg); }
        }
        @keyframes potionSwirl {
          0% { transform: rotate(0deg) scale(0.8); opacity: 0.5; }
          50% { transform: rotate(180deg) scale(1.2); opacity: 1; }
          100% { transform: rotate(360deg) scale(1); opacity: 0.8; }
        }
      `}</style>

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
                <stop offset="0%" stopColor="#EF4444" stopOpacity="0.9" />
                <stop offset="60%" stopColor="#DC2626" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#EF4444" stopOpacity="0" />
              </radialGradient>

              <radialGradient id="shrineGlow">
                <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
              </radialGradient>

              <radialGradient id="magicLight">
                <stop offset="0%" stopColor="#A855F7" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#A855F7" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Night Sky Background */}
            <rect width="800" height="450" fill="url(#skyGrad)" />
            <circle cx="400" cy="180" r="280" fill="url(#moonGlow)" />
            
            {/* Distant Mountains */}
            <path d="M-50,380 L120,240 L300,380 L520,220 L850,380 L850,450 L-50,450 Z" fill="#0F172A" />
            <path d="M-20,450 Q250,290 520,450 Z" fill="#1E293B" />

            {/* Circe's Temple Palace Structure */}
            <rect x="280" y="190" width="240" height="180" fill="#1E293B" stroke="#475569" strokeWidth="2" rx="4" />
            <polygon points="260,190 400,100 540,190" fill="#334155" stroke="#C9A24B" strokeWidth="2" />
            <rect x="295" y="210" width="20" height="160" fill="#475569" stroke="#64748B" strokeWidth="1" />
            <rect x="330" y="210" width="20" height="160" fill="#475569" stroke="#64748B" strokeWidth="1" />
            <rect x="450" y="210" width="20" height="160" fill="#475569" stroke="#64748B" strokeWidth="1" />
            <rect x="485" y="210" width="20" height="160" fill="#475569" stroke="#64748B" strokeWidth="1" />

            {/* 1. PALACE BRONZE ENTRANCE DOOR (Target 1 - Key OPENING Animation) */}
            <g>
              {/* Outer Arch Frame */}
              <path d="M360,370 L360,260 Q400,230 440,260 L440,370 Z" fill="#0F172A" stroke="#C9A24B" strokeWidth="2.5" />
              
              {/* Inner Glowing Chamber when Opened */}
              <rect x="365" y="265" width="70" height="105" fill="#F59E0B" opacity={found[1] ? 0.35 : 0.05} />

              {/* Double Bronze Doors with Opening Slide Animation */}
              <g style={found[1] || animatingAction?.index === 1 ? { animation: 'doorSlideLeft 1s forwards' } : {}}>
                <rect x="365" y="265" width="33" height="105" fill="#78350F" stroke="#B45309" strokeWidth="1.5" rx="2" />
                <rect x="370" y="275" width="23" height="35" fill="#92400E" stroke="#F59E0B" strokeWidth="1" />
                <rect x="370" y="325" width="23" height="35" fill="#92400E" stroke="#F59E0B" strokeWidth="1" />
                {/* Left Door Knob */}
                <g>
                  <circle cx="392" cy="318" r="5" fill="#F59E0B" stroke="#78350F" strokeWidth="1.5" />
                  <rect x="391" y="318" width="2" height="4" fill="#78350F" />
                </g>
              </g>

              <g style={found[1] || animatingAction?.index === 1 ? { animation: 'doorSlideRight 1s forwards' } : {}}>
                <rect x="402" y="265" width="33" height="105" fill="#78350F" stroke="#B45309" strokeWidth="1.5" rx="2" />
                <rect x="407" y="275" width="23" height="35" fill="#92400E" stroke="#F59E0B" strokeWidth="1" />
                <rect x="407" y="325" width="23" height="35" fill="#92400E" stroke="#F59E0B" strokeWidth="1" />
                {/* Right Door Knob */}
                <g>
                  <circle cx="408" cy="318" r="5" fill="#F59E0B" stroke="#78350F" strokeWidth="1.5" />
                  <rect x="407" y="318" width="2" height="4" fill="#78350F" />
                </g>
              </g>

              {/* OPENING ANIMATION: Golden Key Rotation & Unlock Glow */}
              {animatingAction?.index === 1 && (
                <g transform="translate(400, 318)" style={{ animation: 'keyTurn 1s forwards' }}>
                  <circle cx="0" cy="0" r="25" fill="url(#shrineGlow)" />
                  <path d="M-12,0 L12,0 M6,-6 L6,6 M10,-4 L10,4" stroke="#F59E0B" strokeWidth="3.5" strokeLinecap="round" />
                  <circle cx="-12" cy="0" r="5" fill="none" stroke="#F59E0B" strokeWidth="3" />
                </g>
              )}
            </g>

            {/* 2. MARBLE ALTAR SHRINE (Target 2 - Torch LIGHTING Animation) */}
            <g>
              {/* Pedestal Base Steps */}
              <rect x="580" y="250" width="120" height="20" fill="#334155" stroke="#64748B" strokeWidth="1" rx="2" />
              <rect x="595" y="235" width="90" height="15" fill="#475569" stroke="#64748B" strokeWidth="1" rx="2" />
              {/* Altar Pillar */}
              <rect x="610" y="195" width="60" height="40" fill="#1E293B" stroke="#C9A24B" strokeWidth="1.5" />
              {/* Golden Brazier Vessel */}
              <path d="M600,195 Q640,210 680,195 L670,180 L610,180 Z" fill="#B45309" stroke="#F59E0B" strokeWidth="1.5" />
              
              {/* Shrine Sacred Fire Glow (Lit) */}
              {(found[2] || animatingAction?.index === 2) && (
                <g transform="translate(640, 175)">
                  <circle cx="0" cy="0" r="45" fill="url(#shrineGlow)" />
                  {/* Fire Flames */}
                  <path d="M-15,10 Q0,-35 15,10 Q0,0 -15,10 Z" fill="#EF4444" style={{ animation: 'torchLightIgnite 1s infinite alternate' }} />
                  <path d="M-10,10 Q0,-25 10,10 Q0,2 -10,10 Z" fill="#F59E0B" style={{ animation: 'torchLightIgnite 0.7s infinite alternate' }} />
                  <path d="M-5,10 Q0,-15 5,10 Z" fill="#FEF08A" />
                </g>
              )}

              {/* Star Medallion */}
              <polygon points="640,165 645,176 657,176 648,184 651,195 640,188 629,195 632,184 623,176 635,176" fill={found[2] ? "#F59E0B" : "#475569"} />

              {/* LIGHTING ANIMATION: Burning Torch Dipping & Flame Sparkles */}
              {animatingAction?.index === 2 && (
                <g transform="translate(640, 160)" style={{ animation: 'torchLightIgnite 1s forwards' }}>
                  <line x1="-20" y1="-30" x2="0" y2="0" stroke="#78350F" strokeWidth="5" strokeLinecap="round" />
                  <circle cx="0" cy="0" r="14" fill="#F59E0B" />
                  <circle cx="-5" cy="-5" r="8" fill="#EF4444" />
                </g>
              )}
            </g>

            {/* 3. OVERGROWN THORNY GRASS & BUSHES (Target 0 - Sickle CUTTING Animation) */}
            <g>
              {/* Dark Grass Mound Base */}
              <path d="M40,450 Q160,300 280,450 Z" fill="#064E3B" stroke="#047857" strokeWidth="2" />
              
              {/* Lush Green Grass Tufts (Cut down when found) */}
              <g opacity={found[0] ? 0.35 : 1} style={{ transition: 'opacity 0.8s' }}>
                <path d="M70,450 Q100,340 120,410 Q140,330 160,400 Q180,320 200,420 Q220,340 250,450 Z" fill="#15803D" />
                <path d="M80,450 Q110,360 130,420 Q150,350 170,410 Q190,340 210,430 Q230,360 260,450 Z" fill="#16A34A" />
                <path d="M95,450 Q120,380 140,430 Q165,360 185,420 Q205,370 230,450 Z" fill="#22C55E" opacity="0.9" />
                <path d="M90,430 Q150,330 220,410" stroke="#14532D" strokeWidth="5" fill="none" strokeLinecap="round" />
                <path d="M110,410 Q170,340 230,390" stroke="#047857" strokeWidth="4" fill="none" strokeLinecap="round" />
                <circle cx="125" cy="370" r="5" fill="#A855F7" />
                <circle cx="165" cy="350" r="6" fill="#F43F5E" />
              </g>

              {/* CUTTING ANIMATION: Sickle Slash Motion & Cutting Energy Line */}
              {animatingAction?.index === 0 && (
                <g>
                  {/* Slash Line */}
                  <path 
                    d="M110,330 L210,390" 
                    stroke="#F59E0B" 
                    strokeWidth="6" 
                    strokeLinecap="round"
                    strokeDasharray="120"
                    style={{ animation: 'slashLine 0.9s forwards' }}
                  />
                  {/* Swinging Bronze Sickle */}
                  <g transform="translate(160, 360)" style={{ animation: 'sickleCut 1s forwards' }}>
                    <path d="M-20,-10 C0,-35 25,-20 15,10 C5,0 -10,-5 -20,-10 Z" fill="#C9A24B" stroke="#78350F" strokeWidth="2" />
                    <line x1="-20" y1="-10" x2="-35" y2="-25" stroke="#78350F" strokeWidth="4" strokeLinecap="round" />
                  </g>
                </g>
              )}
            </g>

            {/* 4. WITCH'S POTION CAULDRON & FIRE (Target 3 - Ladle MIXING Animation) */}
            <g>
              {/* Ember Log Fire Base */}
              <path d="M605,420 L675,420 L665,405 L615,405 Z" fill="#451A03" />
              <circle cx="640" cy="412" r="25" fill="url(#potionGlow)" />
              <ellipse cx="640" cy="415" rx="30" ry="8" fill="#EA580C" opacity="0.8" />
              
              {/* Tripod Iron Legs */}
              <line x1="610" y1="360" x2="595" y2="425" stroke="#0F172A" strokeWidth="4" />
              <line x1="670" y1="360" x2="685" y2="425" stroke="#0F172A" strokeWidth="4" />
              
              {/* Iron Cauldron Body */}
              <circle cx="640" cy="375" r="38" fill="#1E293B" stroke="#475569" strokeWidth="2.5" />
              
              {/* Potion Rim & Bubbling Crimson/Purple Elixir */}
              <ellipse cx="640" cy="355" rx="34" ry="12" fill={found[3] ? "#A855F7" : "#991B1B"} stroke="#C9A24B" strokeWidth="2" />
              <ellipse cx="640" cy="355" rx="30" ry="9" fill={found[3] ? "#C084FC" : "#DC2626"} />

              {/* MIXING ANIMATION: Ladle Stirring & Swirling Potion Bubbles */}
              {animatingAction?.index === 3 ? (
                <g transform="translate(640, 355)">
                  {/* Swirling Potion Effect */}
                  <ellipse cx="0" cy="0" rx="26" ry="7" fill="url(#magicLight)" style={{ animation: 'potionSwirl 1s infinite' }} />
                  <circle cx="-10" cy="-2" r="5" fill="#E9D5FF" className="animate-bounce" />
                  <circle cx="8" cy="2" r="4" fill="#F472B6" className="animate-pulse" />
                  {/* Stirring Ladle */}
                  <g style={{ animation: 'ladleMixStir 1s forwards' }}>
                    <line x1="0" y1="0" x2="15" y2="-35" stroke="#78350F" strokeWidth="4" strokeLinecap="round" />
                    <circle cx="0" cy="0" r="7" fill="#C9A24B" />
                  </g>
                </g>
              ) : (
                <g>
                  <circle cx="630" cy="353" r="3" fill="#EF4444" />
                  <circle cx="648" cy="357" r="4" fill="#F87171" />
                  <circle cx="638" cy="352" r="2" fill="#FECACA" />
                  <circle cx="655" cy="354" r="3" fill="#EF4444" />
                </g>
              )}
            </g>

            {/* UNLOCKED GOLDEN INGREDIENT LETTER MEDALLIONS */}
            {hotspotsList.map((hotspot, i) => {
              const elem = VISUAL_ELEMENTS[i] || VISUAL_ELEMENTS[0];
              const isFound = found[i];

              return (
                <g key={i} className="cursor-pointer group" onClick={() => handleHotspotClick(i)}>
                  <circle cx={elem.cx} cy={elem.cy} r={elem.hitR} fill="transparent" />
                  
                  {isFound && (
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
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Instruction Banner */}
        {!found.every(Boolean) && (
          <div className="bg-[#0B121E]/95 border-2 border-gold/40 px-5 py-3 rounded-xl flex flex-col md:flex-row items-center justify-between shadow-xl gap-3 text-center md:text-left w-full">
            {toolHint ? (
              <p className="text-amber-300 font-serif font-bold text-sm flex items-center space-x-2 animate-bounce">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{toolHint}</span>
              </p>
            ) : (
              <p className="text-parchment/90 font-serif italic text-sm flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-gold animate-pulse shrink-0" />
                <span>Click directly on the palace door knobs or objects to unlock them!</span>
              </p>
            )}
            {selectedTool && (
              <span className="text-gold font-serif text-xs uppercase tracking-widest font-bold bg-gold/15 px-3 py-1 rounded-full border border-gold/30 shrink-0">
                Tool Equipped: {TOOLS.find(t => t.id === selectedTool)?.name}
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
        <div className="w-full max-w-xl bg-[#0B121E] border-2 border-gold p-8 rounded-2xl shadow-[0_0_50px_rgba(201,162,75,0.3)] flex flex-col items-center animate-in zoom-in duration-500 text-center space-y-5">
          <p className="text-parchment font-serif italic text-lg leading-relaxed">
            All ingredients gathered! Drag the letters into order to spell the holy antidote:
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

          {tiles.map(t => t.letter).join("") === "MOLY" ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                window.dispatchEvent(new CustomEvent("nostos-oracle-submit", { detail: "MOLY" }));
              }}
              className="w-full py-3.5 bg-gold hover:bg-gold-light text-ink font-serif text-lg font-bold uppercase tracking-widest rounded-xl shadow-xl transition-all hover:scale-105"
            >
              Counter-Spell Ready: Submit MOLY →
            </button>
          ) : (
            <p className="text-gold/60 font-serif text-xs italic tracking-widest uppercase">
              Current Word: {tiles.map(t => t.letter).join(" - ")} (Arrange to spell MOLY)
            </p>
          )}
        </div>
      )}

    </div>
  );
}
