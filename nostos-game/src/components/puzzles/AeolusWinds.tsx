"use client";

import React, { useState, useEffect, useRef } from "react";
import { Compass, Sailboat, Sunset, Wind, Anchor } from "lucide-react";
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
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface AeolusWindsProps {
  data: { words: string[] };
  incorrectCount: number;
}

const ICONS = [Compass, Sailboat, Sunset, Wind, Anchor];

function SortableTile({ id, word }: { id: string, word: string }) {
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
      className={`p-3 md:p-4 bg-ink/90 border-2 ${isDragging ? 'border-gold shadow-[0_0_20px_rgba(201,162,75,0.4)] scale-105' : 'border-gold/40 shadow-[0_0_15px_rgba(201,162,75,0.15)]'} rounded cursor-grab active:cursor-grabbing hover:bg-gold/10 transition-colors touch-none min-w-[70px] md:min-w-[90px] flex justify-center`}
    >
      <span className="font-serif text-gold text-sm md:text-xl tracking-widest">{word}</span>
    </div>
  );
}

export function AeolusWinds({ data, incorrectCount }: AeolusWindsProps) {
  const [revealed, setRevealed] = useState<boolean[]>(data.words.map(() => false));
  const [tiles, setTiles] = useState<string[]>([]);
  const prevIncorrectCount = useRef(incorrectCount);

  // Initialize shuffled tiles once all are revealed
  useEffect(() => {
    if (revealed.every(Boolean) && tiles.length === 0) {
      const shuffled = [...data.words].sort(() => Math.random() - 0.5);
      setTiles(shuffled);
    }
  }, [revealed, data.words, tiles.length]);

  // Reshuffle on incorrect submission
  useEffect(() => {
    if (incorrectCount > prevIncorrectCount.current) {
      if (tiles.length > 0) {
        setTiles([...tiles].sort(() => Math.random() - 0.5));
      }
      prevIncorrectCount.current = incorrectCount;
    }
  }, [incorrectCount, tiles]);

  // Sync to input field
  useEffect(() => {
    const input = document.querySelector('#oracle-form input[name="answer"]') as HTMLInputElement;
    if (input && revealed.every(Boolean)) {
      input.value = tiles.join(" ");
    }
  }, [tiles, revealed]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setTiles((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleReveal = (index: number) => {
    if (revealed[index]) return;
    setRevealed(prev => {
      const next = [...prev];
      next[index] = true;
      return next;
    });
  };

  return (
    <div className="flex flex-col items-center space-y-12 w-full select-none pb-8">
      {/* Icon reveal grid */}
      <div className="w-full relative min-h-[250px]">
        {!revealed.every(Boolean) ? (
          <div className="w-full absolute inset-0 animate-in fade-in duration-500">
            <p className="text-parchment/80 font-serif italic text-lg leading-relaxed text-center mb-8">
              Click the golden coins to flip and reveal the hidden winds.
            </p>
            <div className="flex flex-wrap justify-center gap-4 md:gap-8">
              {data.words.map((word, i) => {
                const Icon = ICONS[i % ICONS.length];
                const isRevealed = revealed[i];
                return (
                  <div 
                    key={i} 
                    onClick={() => handleReveal(i)}
                    className="w-16 h-16 md:w-24 md:h-24 [perspective:1000px] cursor-pointer"
                  >
                    <div 
                      className={`relative w-full h-full rounded-full transition-transform duration-700 [transform-style:preserve-3d] shadow-[0_0_20px_rgba(201,162,75,0.3)] hover:shadow-[0_0_30px_rgba(201,162,75,0.6)] ${
                        isRevealed ? '[transform:rotateY(180deg)]' : 'hover:scale-105'
                      }`}
                    >
                      {/* FRONT SIDE — ICON */}
                      <div className="absolute inset-0 w-full h-full rounded-full border-2 border-gold/60 bg-ink/90 flex items-center justify-center [backface-visibility:hidden]">
                        <Icon className="text-gold w-6 h-6 md:w-10 md:h-10 drop-shadow-[0_0_10px_rgba(201,162,75,0.5)]" />
                      </div>

                      {/* BACK SIDE — TEXT */}
                      <div className="absolute inset-0 w-full h-full rounded-full border-2 border-gold bg-ink flex items-center justify-center [backface-visibility:hidden] [transform:rotateY(180deg)] shadow-[0_0_15px_rgba(201,162,75,0.4)]">
                        <span className="text-gold font-serif text-[10px] md:text-sm font-bold tracking-widest uppercase">{word}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="w-full absolute inset-0 animate-in fade-in zoom-in duration-700 delay-300">
            <p className="text-parchment/80 font-serif italic text-lg leading-relaxed text-center mb-8">
              Arrange the winds to catch the favorable current.
            </p>
            <DndContext 
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext 
                items={tiles}
                strategy={rectSortingStrategy}
              >
                <div className="flex flex-wrap justify-center gap-3 md:gap-4 p-6 border border-gold/20 rounded-xl bg-ink/30 backdrop-blur-sm">
                  {tiles.map((word) => (
                    <SortableTile key={word} id={word} word={word} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        )}
      </div>
    </div>
  );
}
