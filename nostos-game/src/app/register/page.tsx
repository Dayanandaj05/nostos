"use client";

import React, { useState, useEffect, useActionState, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { registerTeam, RegisterState } from "@/app/actions/registerTeam";
import { Anchor } from "lucide-react";
import { OceanCanvas } from "@/components/ui/OceanCanvas";

const GreekKeyLine = () => (
  <svg width="100%" height="16" viewBox="0 0 600 16" preserveAspectRatio="xMidYMid slice" className="text-gold/40 my-3">
    <pattern id="gk-reg" x="0" y="0" width="30" height="16" patternUnits="userSpaceOnUse">
      <path d="M0,14 L8,14 L8,3 L22,3 L22,14 L30,14 L30,8 L14,8 L14,11 L25,11 L25,6 L5,6 L5,16" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </pattern>
    <rect x="0" y="0" width="100%" height="16" fill="url(#gk-reg)" />
  </svg>
);

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState<RegisterState, FormData>(registerTeam, { success: false });
  
  const [shipName, setShipName] = useState("");
  const [isCheckingShip, setIsCheckingShip] = useState(false);
  const [shipTakenError, setShipTakenError] = useState<string | null>(null);
  
  const [showFourthMember, setShowFourthMember] = useState(false);
  
  // Live debounce checking
  useEffect(() => {
    if (!shipName.trim()) {
      setShipTakenError(null);
      return;
    }
    
    const timeoutId = setTimeout(async () => {
      setIsCheckingShip(true);
      try {
        const res = await fetch(`/api/check-ship?ship=${encodeURIComponent(shipName)}`);
        const data = await res.json();
        if (data.taken) {
          setShipTakenError("That ship is already sailing these waters.");
        } else {
          setShipTakenError(null);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsCheckingShip(false);
      }
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [shipName]);

  // Combined error logic for ship name
  const effectiveShipError = shipTakenError || state.errors?.ship_name;

  if (state.success) {
    return (
      <main className="min-h-screen text-parchment font-serif bg-ink flex flex-col items-center justify-center p-6 selection:bg-gold selection:text-ink relative overflow-hidden">
        {/* Subtle Ocean Canvas Background */}
        <div className="fixed inset-0 opacity-40 pointer-events-none z-0">
          <OceanCanvas />
        </div>
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,rgba(15,23,37,0.7)_0%,rgba(15,23,37,0.92)_70%,rgba(10,16,25,0.98)_100%)] pointer-events-none z-0" />

        <div className="max-w-2xl text-center space-y-12 relative z-10 p-8 border border-gold/30 bg-[#0B121E]/90 rounded-3xl shadow-[0_0_60px_rgba(201,162,75,0.2)]">
          <Anchor className="w-24 h-24 text-gold mx-auto animate-pulse" />
          <h1 className="text-4xl md:text-6xl text-gold tracking-widest uppercase">Vessel Recorded</h1>
          <p className="text-xl md:text-3xl text-parchment/80 italic leading-relaxed">
            The gods have acknowledged your crew. Prepare yourselves.
          </p>
          <div className="pt-8">
            <Link href="/login" passHref>
              <Button className="px-12 py-4 text-xl shadow-[0_0_30px_rgba(201,162,75,0.3)]">Proceed to Login</Button>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen text-parchment font-serif bg-ink selection:bg-gold selection:text-ink flex flex-col items-center justify-center p-6 md:p-12 relative overflow-hidden">
      {/* Less Intense Animated Ocean Canvas Background */}
      <div className="fixed inset-0 opacity-35 pointer-events-none z-0">
        <OceanCanvas />
      </div>
      
      {/* Dark Atmospheric Overlay for Legibility & Form Focus */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,rgba(15,23,37,0.65)_0%,rgba(15,23,37,0.88)_70%,rgba(10,16,25,0.96)_100%)] pointer-events-none z-0" />
      
      <div className="relative z-10 w-full max-w-xl">
        <div className="text-center mb-12 space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full border border-gold/30 bg-gold/10 text-gold text-xs uppercase tracking-widest mb-1 font-serif">
            ⚓ NOSTOS Crew Registration • Odyssey 2026
          </div>
          <h1 className="text-5xl md:text-7xl text-gold tracking-widest uppercase font-normal drop-shadow-[0_4px_25px_rgba(201,162,75,0.3)]">Declare</h1>
          <p className="text-xl text-parchment/60 italic">Who dares to sail the wine-dark sea?</p>
          <div className="max-w-xs mx-auto">
            <GreekKeyLine />
          </div>
        </div>

        <Card className="bg-[#0B121E]/95 border border-gold/30 p-6 md:p-12 shadow-[0_20px_60px_rgba(0,0,0,0.8)] relative overflow-visible rounded-3xl">
          {/* Decorative Corner Anchors & Gold Brackets */}
          <div className="absolute -top-3 -left-3 w-5 h-5 border-t-2 border-l-2 border-gold/70" />
          <div className="absolute -top-3 -right-3 w-5 h-5 border-t-2 border-r-2 border-gold/70" />
          <div className="absolute -bottom-3 -left-3 w-5 h-5 border-b-2 border-l-2 border-gold/70" />
          <div className="absolute -bottom-3 -right-3 w-5 h-5 border-b-2 border-r-2 border-gold/70" />
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-gold to-transparent" />

          {state.errors?.general && (
            <ErrorBanner message={state.errors.general} className="mb-8" />
          )}

          <form action={formAction} className="space-y-12">
            
            {/* Vessel Information */}
            <div className="space-y-8">
              <h2 className="text-2xl text-gold tracking-widest uppercase border-b border-gold/20 pb-2">I. The Vessel</h2>
              
              <div className="space-y-2 relative">
                <label className="text-parchment/60 uppercase tracking-widest text-sm block">Ship Name</label>
                <div className="relative">
                  <Input 
                    name="ship_name" 
                    value={shipName}
                    onChange={(e) => setShipName(e.target.value)}
                    isError={!!effectiveShipError}
                    placeholder="e.g. The Argo" 
                  />
                  {isCheckingShip && (
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gold text-xs uppercase animate-pulse">Consulting Oracle...</span>
                  )}
                </div>
                {effectiveShipError && (
                  <p className="text-danger italic text-sm mt-1">{effectiveShipError}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-parchment/60 uppercase tracking-widest text-sm block">Shared Password</label>
                <Input 
                  name="password" 
                  type="password"
                  isError={!!state.errors?.password}
                  placeholder="A secret for the crew" 
                />
                {state.errors?.password && (
                  <p className="text-danger italic text-sm mt-1">{state.errors.password}</p>
                )}
              </div>
            </div>

            {/* Crew Members */}
            <div className="space-y-8">
              <h2 className="text-2xl text-gold tracking-widest uppercase border-b border-gold/20 pb-2">II. The Crew</h2>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-parchment/60 uppercase tracking-widest text-sm block">Captain's Full Name</label>
                  <Input 
                    name="captain_name" 
                    isError={!!state.errors?.captain_name}
                    placeholder="Full Name (e.g. Odysseus)" 
                  />
                  {state.errors?.captain_name && (
                    <p className="text-danger italic text-sm mt-1">{state.errors.captain_name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-parchment/60 uppercase tracking-widest text-sm block">Captain's Phone Number</label>
                  <Input 
                    name="captain_phone" 
                    type="tel"
                    isError={!!state.errors?.captain_phone}
                    placeholder="Phone Number (e.g. +1 555-0199)" 
                  />
                  {state.errors?.captain_phone && (
                    <p className="text-danger italic text-sm mt-1">{state.errors.captain_phone}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-parchment/60 uppercase tracking-widest text-sm block">Second Sailor</label>
                  <Input name="member_2" placeholder="Name" />
                </div>
                <div className="space-y-2">
                  <label className="text-parchment/60 uppercase tracking-widest text-sm block">Third Sailor (Optional)</label>
                  <Input name="member_3" placeholder="Name (Optional)" />
                </div>
                
                {showFourthMember ? (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-4 duration-500">
                    <label className="text-parchment/60 uppercase tracking-widest text-sm flex justify-between">
                      <span>Fourth Sailor</span>
                      <button type="button" onClick={() => setShowFourthMember(false)} className="text-danger/60 hover:text-danger hover:underline">Remove</button>
                    </label>
                    <Input name="member_4" placeholder="Name" />
                  </div>
                ) : (
                  <button 
                    type="button" 
                    onClick={() => setShowFourthMember(true)}
                    className="text-gold/60 hover:text-gold tracking-widest uppercase text-sm border border-dashed border-gold/30 hover:border-gold/60 p-4 w-full text-center transition-colors rounded-xl bg-gold/5 hover:bg-gold/10"
                  >
                    + Add a fourth sailor
                  </button>
                )}
                
                {state.errors?.member_names && (
                  <p className="text-danger italic text-sm mt-2">{state.errors.member_names}</p>
                )}
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full py-4 text-xl mt-8 shadow-[0_0_30px_rgba(201,162,75,0.3)]" 
              disabled={isPending || !!shipTakenError || isCheckingShip}
            >
              {isPending ? "Recording in the logs..." : "Swear the Oath & Register"}
            </Button>
            
          </form>
        </Card>
        
        <div className="mt-12 text-center">
          <Link href="/" className="text-parchment/40 hover:text-gold italic text-sm tracking-widest uppercase transition-colors">
            ← Return to the Shore
          </Link>
        </div>
      </div>
    </main>
  );
}
