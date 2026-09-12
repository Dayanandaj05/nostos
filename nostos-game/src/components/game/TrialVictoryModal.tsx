"use client";

import React, { useState } from "react";
import { ShieldCheck, ArrowRight, Compass, Users, Sparkles, Award, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { confirmAdvance } from "@/app/actions/confirmAdvance";

interface TrialVictoryModalProps {
  currentLevelNumber: number;
  onProceed: () => void;
}

const NEXT_TRIAL_DATA: Record<number, { title: string; subtitle: string; isTeamwork: boolean; guidelines: string[] }> = {
  2: {
    title: "Trial 2: Island of Aeolus",
    subtitle: "The Keeper of the Winds",
    isTeamwork: false,
    guidelines: [
      "Tap the golden wind icons hidden among the storm clouds.",
      "Collect wind coordinates before the divine gale blows your vessel off course.",
      "Calculate the resulting vector to state your answer to the Oracle."
    ]
  },
  3: {
    title: "Trial 3: The Cyclops' Cave",
    subtitle: "Escape from Polyphemus",
    isTeamwork: false,
    guidelines: [
      "Polyphemus traps your fleet inside a dark cavern.",
      "Inspect the cave walls to locate hidden tools and objects.",
      "Use your items strategically to blind the giant and escape under the rams."
    ]
  },
  4: {
    title: "Trial 4: Land of the Laestrygonians",
    subtitle: "The Boulder Fleet Strait",
    isTeamwork: false,
    guidelines: [
      "Giant cannibals hurl massive boulders from the coastal cliffs!",
      "Solve rapid nautical & mathematical calculations within 35 seconds per round.",
      "Maneuver your ship through the straits before your fleet is destroyed."
    ]
  },
  5: {
    title: "Trial 5: Circe's Enchanted Isle",
    subtitle: "The Swine & The Holy Herb",
    isTeamwork: false,
    guidelines: [
      "Circe's witchery has transformed your sailors into swine inside her palace.",
      "Select tools from your equipment bar (Sickle, Torch, Key, Ladle).",
      "Interact with the palace elements to uncover the magical antidote herb."
    ]
  },
  6: {
    title: "Trial 6: Land of the Dead",
    subtitle: "The Underworld Asymmetric Split",
    isTeamwork: true,
    guidelines: [
      "TEAMWORK REQUIRED: The Shades assign DIFFERENT riddle fragments to each device on your team.",
      "Use the 'Crew Telepathy' chat at the bottom right to share unlocked word fragments with your crew.",
      "Combine all team fragments to form the full passcode and unlock the Underworld Gate."
    ]
  },
  7: {
    title: "Trial 7: The Sirens' Song",
    subtitle: "Sensory Role Separation",
    isTeamwork: true,
    guidelines: [
      "TEAMWORK REQUIRED: Only ONE crew member has clear hearing to see the floating melody words.",
      "All other team devices are deafened (blurred screen) by the Sirens' enchanting spell.",
      "The hearing sailor must click clear words to transmit them to the crew's shared tray!"
    ]
  },
  8: {
    title: "Trial 8: Scylla & Charybdis",
    subtitle: "The Sea Monster & The Whirlpool",
    isTeamwork: false,
    guidelines: [
      "Navigate between the 6-headed monster Scylla and the roaring whirlpool Charybdis.",
      "Path selection is instant: choose your risk level carefully.",
      "Answer the rapid tactical dilemma to steer through the narrow strait safely."
    ]
  },
  9: {
    title: "Trial 9: Cattle of Helios",
    subtitle: "Resisting Divine Temptation",
    isTeamwork: false,
    guidelines: [
      "Your starving crew lands on Thrinacia where the Sun God's cattle graze.",
      "Do NOT slaughter the golden cattle! Resist the glowing temptation.",
      "Calculate the exact sacred herd equation to honor Lord Helios."
    ]
  },
  10: {
    title: "Trial 10: Return to Ithaca",
    subtitle: "The Odyssey Grand Finale",
    isTeamwork: false,
    guidelines: [
      "Phase 1: Decode Penelope's story clue to discover Odysseus' disguise.",
      "Phase 2: Uncover the Odyssey Lore combination lock from your voyage knowledge.",
      "Phase 3: Interactive 2D Canvas Bow & Arrow game! Aim and shoot through the 12 axe handles to claim victory!"
    ]
  }
};

export function TrialVictoryModal({ currentLevelNumber, onProceed }: TrialVictoryModalProps) {
  const [isAdvancing, setIsAdvancing] = useState(false);
  const nextLevelNumber = currentLevelNumber + 1;
  const nextData = NEXT_TRIAL_DATA[nextLevelNumber] || {
    title: `Trial ${nextLevelNumber}: The Final Horizon`,
    subtitle: "Completion of Nostos",
    isTeamwork: false,
    guidelines: ["Proceed to finish your grand journey."]
  };

  const handleProceed = async () => {
    if (isAdvancing) return;
    setIsAdvancing(true);
    try {
      await confirmAdvance();
    } catch (e) {
      console.error("[TrialVictoryModal] Error during advance:", e);
    }
    onProceed();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/90 backdrop-blur-md animate-in fade-in duration-300 select-none">
      <div className="w-full max-w-2xl bg-[#0B121E] border-2 border-gold p-8 md:p-10 rounded-2xl shadow-[0_0_60px_rgba(201,162,75,0.3)] relative overflow-hidden flex flex-col items-center text-center space-y-6">
        
        {/* Background Radial Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gold/15 via-transparent to-transparent pointer-events-none" />

        {/* Victory Icon Badge */}
        <div className="w-16 h-16 rounded-full bg-gold/20 border-2 border-gold flex items-center justify-center shadow-[0_0_20px_rgba(201,162,75,0.5)] animate-bounce">
          <Award className="w-8 h-8 text-gold" />
        </div>

        {/* Victory Headline */}
        <div>
          <span className="text-gold font-serif text-xs uppercase tracking-widest font-bold">The Oracle Favors You</span>
          <h2 className="text-3xl md:text-4xl text-parchment font-serif font-bold tracking-wide mt-1">
            Trial {currentLevelNumber} Completed!
          </h2>
          <p className="text-parchment/70 font-serif italic text-sm mt-1">
            Your answer was accepted by the gods. Prepare for the next leg of your journey.
          </p>
        </div>

        {/* Divider */}
        <div className="w-full border-t border-gold/30 my-2" />

        {/* Next Trial Briefing */}
        <div className="w-full bg-ink/60 border border-gold/20 p-6 rounded-xl text-left space-y-3 relative">
          <div className="flex items-center justify-between">
            <span className="text-gold font-serif text-xs uppercase tracking-widest font-bold flex items-center space-x-1.5">
              <Compass className="w-4 h-4 text-gold" />
              <span>Next Destination</span>
            </span>
            
            {nextData.isTeamwork && (
              <span className="px-3 py-1 bg-gold/20 border border-gold/50 rounded-full text-gold font-serif text-[11px] uppercase tracking-widest font-bold flex items-center space-x-1">
                <Users className="w-3 h-3" />
                <span>Teamwork Required</span>
              </span>
            )}
          </div>

          <div>
            <h3 className="text-xl text-gold font-serif font-bold">{nextData.title}</h3>
            <p className="text-parchment/60 font-serif italic text-xs">{nextData.subtitle}</p>
          </div>

          <div className="border-t border-gold/10 pt-3 space-y-2">
            <p className="text-parchment/80 font-serif text-xs uppercase tracking-widest font-bold">Tactical Guidelines:</p>
            <ul className="space-y-1.5">
              {nextData.guidelines.map((g, idx) => (
                <li key={idx} className="text-parchment/90 font-serif text-sm flex items-start space-x-2">
                  <span className="text-gold font-bold">►</span>
                  <span>{g}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Action Button */}
        <Button
          onClick={handleProceed}
          disabled={isAdvancing}
          className="w-full py-4 text-xl font-bold flex items-center justify-center space-x-3 shadow-xl hover:scale-102 transition-transform cursor-pointer"
        >
          {isAdvancing ? (
            <span className="flex items-center space-x-2">
              <Loader2 className="w-6 h-6 animate-spin text-gold" />
              <span>Setting Sail...</span>
            </span>
          ) : (
            <>
              <span>Set Sail for Trial {nextLevelNumber}</span>
              <ArrowRight className="w-6 h-6" />
            </>
          )}
        </Button>

      </div>
    </div>
  );
}
