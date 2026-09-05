"use client";

import React, { useState, useEffect, useActionState, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { registerTeam, RegisterState } from "@/app/actions/registerTeam";
import { Anchor } from "lucide-react";

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
      <main className="min-h-screen text-parchment font-serif bg-ink flex flex-col items-center justify-center p-6 selection:bg-gold selection:text-ink">
        {/* Subtle noise overlay */}
        <div className="absolute inset-0 opacity-10 pointer-events-none mix-blend-overlay"
             style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }} />
        
        <div className="max-w-2xl text-center space-y-12 relative z-10">
          <Anchor className="w-24 h-24 text-gold mx-auto animate-pulse" />
          <h1 className="text-4xl md:text-6xl text-gold tracking-widest uppercase">Vessel Recorded</h1>
          <p className="text-xl md:text-3xl text-parchment/80 italic leading-relaxed">
            The gods have acknowledged your crew. Prepare yourselves.
          </p>
          <div className="pt-8">
            <Link href="/login" passHref>
              <Button className="px-12 py-4 text-xl">Proceed to Login</Button>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen text-parchment font-serif bg-ink selection:bg-gold selection:text-ink flex flex-col items-center justify-center p-6 md:p-12">
      {/* Background elements */}
      <div className="fixed inset-0 bg-gradient-to-br from-ink via-ink to-[#151c22] z-0" />
      <div className="fixed inset-0 opacity-10 pointer-events-none mix-blend-overlay z-0"
           style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }} />
      
      <div className="relative z-10 w-full max-w-xl">
        <div className="text-center mb-16 space-y-6">
          <h1 className="text-5xl md:text-7xl text-gold tracking-widest uppercase font-normal">Declare</h1>
          <p className="text-xl text-parchment/60 italic">Who dares to sail the wine-dark sea?</p>
        </div>

        <Card className="bg-ink/60 border border-wave/20 p-6 md:p-12 shadow-2xl backdrop-blur-md relative overflow-visible">
          {/* Decorative Corner Anchors */}
          <div className="absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2 border-gold/40" />
          <div className="absolute -top-2 -right-2 w-4 h-4 border-t-2 border-r-2 border-gold/40" />
          <div className="absolute -bottom-2 -left-2 w-4 h-4 border-b-2 border-l-2 border-gold/40" />
          <div className="absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2 border-gold/40" />

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
                  <label className="text-parchment/60 uppercase tracking-widest text-sm block">First Sailor (Captain)</label>
                  <Input name="member_1" placeholder="Name" />
                </div>
                <div className="space-y-2">
                  <label className="text-parchment/60 uppercase tracking-widest text-sm block">Second Sailor</label>
                  <Input name="member_2" placeholder="Name" />
                </div>
                <div className="space-y-2">
                  <label className="text-parchment/60 uppercase tracking-widest text-sm block">Third Sailor</label>
                  <Input name="member_3" placeholder="Name" />
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
                    className="text-gold/60 hover:text-gold tracking-widest uppercase text-sm border border-dashed border-gold/30 hover:border-gold/60 p-4 w-full text-center transition-colors"
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
              className="w-full py-4 text-xl mt-8" 
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
