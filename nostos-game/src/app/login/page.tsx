"use client";

import React, { useState, useActionState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { loginTeam, loginAdmin } from "@/app/actions/auth";
import { OceanCanvas } from "@/components/ui/OceanCanvas";

const GreekKeyLine = () => (
  <svg width="100%" height="16" viewBox="0 0 600 16" preserveAspectRatio="xMidYMid slice" className="text-gold/40 my-4">
    <pattern id="gk-log" x="0" y="0" width="30" height="16" patternUnits="userSpaceOnUse">
      <path d="M0,14 L8,14 L8,3 L22,3 L22,14 L30,14 L30,8 L14,8 L14,11 L25,11 L25,6 L5,6 L5,16" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </pattern>
    <rect x="0" y="0" width="100%" height="16" fill="url(#gk-log)" />
  </svg>
);

function LoginContent() {
  const searchParams = useSearchParams();
  const displacedError = searchParams.get("error") === "session_displaced" 
    ? "Your session has been logged in on another device or has expired."
    : null;

  const [activeTab, setActiveTab] = useState<"crew" | "coordinator">("crew");

  const [teamState, teamFormAction, isTeamPending] = useActionState(loginTeam, { success: false });
  const [adminState, adminFormAction, isAdminPending] = useActionState(loginAdmin, { success: false });

  const activeError = teamState.error || displacedError;

  return (
    <div className="relative z-10 w-full max-w-lg">
      
      {/* Odyssey Header Banner */}
      <div className="text-center mb-10 space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full border border-gold/30 bg-gold/10 text-gold text-xs uppercase tracking-widest mb-1 font-serif">
          ⚓ Return to the Odyssey • NOSTOS
        </div>
        <h1 className="text-5xl md:text-7xl text-gold tracking-widest uppercase font-normal drop-shadow-[0_4px_25px_rgba(201,162,75,0.3)]">
          Return
        </h1>
        <p className="text-lg text-parchment/80 italic max-w-md mx-auto leading-relaxed">
          “The sea remembers those who sail it.”
        </p>
        <div className="max-w-xs mx-auto">
          <GreekKeyLine />
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-gold/30 mb-8 bg-[#0B121E]/80 rounded-t-2xl p-1">
        <button 
          className={`flex-1 py-3 px-4 tracking-widest uppercase text-xs font-bold transition-all rounded-xl flex items-center justify-center gap-2 ${
            activeTab === "crew" 
              ? "bg-gold/20 text-gold border border-gold/40 shadow-[0_0_15px_rgba(201,162,75,0.2)]" 
              : "text-parchment/50 hover:text-parchment/90"
          }`}
          onClick={() => setActiveTab("crew")}
        >
          <span>⛵</span> Crew Captain & Sailors
        </button>
        <button 
          className={`flex-1 py-3 px-4 tracking-widest uppercase text-xs font-bold transition-all rounded-xl flex items-center justify-center gap-2 ${
            activeTab === "coordinator" 
              ? "bg-gold/20 text-gold border border-gold/40 shadow-[0_0_15px_rgba(201,162,75,0.2)]" 
              : "text-parchment/50 hover:text-parchment/90"
          }`}
          onClick={() => setActiveTab("coordinator")}
        >
          <span>🛡️</span> Event Directors & Proctors
        </button>
      </div>

      <Card className="bg-[#0B121E]/95 border border-gold/30 p-8 md:p-12 shadow-[0_20px_60px_rgba(0,0,0,0.8)] rounded-3xl relative overflow-visible">
        {/* Decorative Corner Ornaments */}
        <div className="absolute -top-3 -left-3 w-5 h-5 border-t-2 border-l-2 border-gold/70" />
        <div className="absolute -top-3 -right-3 w-5 h-5 border-t-2 border-r-2 border-gold/70" />
        <div className="absolute -bottom-3 -left-3 w-5 h-5 border-b-2 border-l-2 border-gold/70" />
        <div className="absolute -bottom-3 -right-3 w-5 h-5 border-b-2 border-r-2 border-gold/70" />

        {activeError && (
          <div className="mb-6">
            <ErrorBanner 
              variant="destructive" 
              title={teamState.error ? "Login Blocked" : "Session Displaced"} 
              message={activeError} 
            />
          </div>
        )}

        {activeTab === "crew" ? (
          <form action={teamFormAction} className="space-y-8">
            
            <div className="space-y-2">
              <label className="text-parchment/70 uppercase tracking-widest text-xs font-bold block flex justify-between">
                <span>Vessel Name (Ship Title)</span>
                <span className="text-gold/50 italic font-normal">Declared Manifest</span>
              </label>
              <Input name="ship_name" placeholder="e.g. The Argo, Ithaca's Pride" />
            </div>

            <div className="space-y-2">
              <label className="text-parchment/70 uppercase tracking-widest text-xs font-bold block flex justify-between">
                <span>Crew Member Name (Your Alias)</span>
                <span className="text-gold/50 italic font-normal">Personal ID</span>
              </label>
              <Input name="username" placeholder="e.g. Odysseus, Athena" />
            </div>

            <div className="space-y-2">
              <label className="text-parchment/70 uppercase tracking-widest text-xs font-bold block flex justify-between">
                <span>Secret Crew Cipher (Shared Password)</span>
                <span className="text-gold/50 italic font-normal">Crew Key</span>
              </label>
              <Input name="password" type="password" placeholder="••••••••" />
            </div>

            <Button type="submit" className="w-full py-4 text-xl tracking-widest uppercase shadow-[0_0_30px_rgba(201,162,75,0.3)]" disabled={isTeamPending}>
              {isTeamPending ? "Consulting Sacred Logs..." : "Embark Upon The Voyage →"}
            </Button>
          </form>
        ) : (
          <form action={adminFormAction} className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            {adminState.error && <ErrorBanner message={adminState.error} />}
            
            <div className="space-y-2">
              <label className="text-parchment/70 uppercase tracking-widest text-xs font-bold block">
                Coordinator Identifier (Director ID)
              </label>
              <Input name="username" placeholder="Director / Proctor ID" />
            </div>

            <div className="space-y-2">
              <label className="text-parchment/70 uppercase tracking-widest text-xs font-bold block">
                Master Key Passcode
              </label>
              <Input name="password" type="password" placeholder="••••••••" />
            </div>

            <Button type="submit" variant="secondary" className="w-full py-4 text-xl tracking-widest uppercase border border-gold/40 shadow-[0_0_30px_rgba(201,162,75,0.2)]" disabled={isAdminPending}>
              {isAdminPending ? "Verifying Credentials..." : "Unlock Control Panel →"}
            </Button>
          </form>
        )}
      </Card>

      <div className="mt-10 text-center">
        <Link href="/register" className="text-parchment/50 hover:text-gold italic text-sm tracking-widest uppercase transition-colors">
          A new vessel? Register your crew here →
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen text-parchment font-serif bg-ink selection:bg-gold selection:text-ink flex flex-col items-center justify-center p-6 md:p-12 relative overflow-hidden py-16">
      
      {/* Less Intense Animated Ocean Canvas Background */}
      <div className="fixed inset-0 opacity-35 pointer-events-none z-0">
        <OceanCanvas />
      </div>
      
      {/* Dark Atmospheric Overlay for Legibility & Form Focus */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,rgba(15,23,37,0.70)_0%,rgba(15,23,37,0.90)_70%,rgba(10,16,25,0.97)_100%)] pointer-events-none z-0" />
      
      <Suspense fallback={<div className="text-gold font-serif">Loading...</div>}>
        <LoginContent />
      </Suspense>
    </main>
  );
}
