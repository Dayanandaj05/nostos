"use client";

import React, { useState, useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { loginTeam, loginAdmin, quickLoginTestTeam, quickLoginAdmin } from "@/app/actions/auth";

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<"crew" | "coordinator">("crew");

  const [teamState, teamFormAction, isTeamPending] = useActionState(loginTeam, { success: false });
  const [adminState, adminFormAction, isAdminPending] = useActionState(loginAdmin, { success: false });

  return (
    <main className="min-h-screen text-parchment font-serif bg-ink selection:bg-gold selection:text-ink flex flex-col items-center justify-center p-6 md:p-12 relative">
      
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0A1017] via-ink to-ink z-0" />
      <div className="absolute inset-0 opacity-10 pointer-events-none mix-blend-overlay z-0"
           style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }} />
      
      <div className="relative z-10 w-full max-w-md">
        
        <div className="text-center mb-12 space-y-4">
          <h1 className="text-5xl md:text-6xl text-gold tracking-widest uppercase font-normal">Return</h1>
          <p className="text-xl text-parchment/60 italic">The sea remembers those who sail it.</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-parchment/20 mb-8">
          <button 
            className={`flex-1 pb-4 tracking-widest uppercase text-sm font-bold transition-colors ${activeTab === "crew" ? "text-gold border-b-2 border-gold" : "text-parchment/40 hover:text-parchment/80"}`}
            onClick={() => setActiveTab("crew")}
          >
            Crew
          </button>
          <button 
            className={`flex-1 pb-4 tracking-widest uppercase text-sm font-bold transition-colors ${activeTab === "coordinator" ? "text-gold border-b-2 border-gold" : "text-parchment/40 hover:text-parchment/80"}`}
            onClick={() => setActiveTab("coordinator")}
          >
            Coordinator
          </button>
        </div>

        <Card className="bg-ink/40 border border-wave/20 p-8 md:p-10 shadow-2xl backdrop-blur-md">
          {activeTab === "crew" ? (
            <form action={teamFormAction} className="space-y-8">
              {teamState.error && <ErrorBanner message={teamState.error} />}
              
              <div className="space-y-2">
                <label className="text-parchment/60 uppercase tracking-widest text-sm block">Ship Name</label>
                <Input name="ship_name" placeholder="The Argo" />
              </div>
              <div className="space-y-2">
                <label className="text-parchment/60 uppercase tracking-widest text-sm block">Password</label>
                <Input name="password" type="password" placeholder="••••••••" />
              </div>
              <Button type="submit" className="w-full py-4 text-xl" disabled={isTeamPending}>
                {isTeamPending ? "Consulting Logs..." : "Embark"}
              </Button>
            </form>
          ) : (
            <form action={adminFormAction} className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              {adminState.error && <ErrorBanner message={adminState.error} />}
              
              <div className="space-y-2">
                <label className="text-parchment/60 uppercase tracking-widest text-sm block">Username</label>
                <Input name="username" placeholder="Coordinator ID" />
              </div>
              <div className="space-y-2">
                <label className="text-parchment/60 uppercase tracking-widest text-sm block">Password</label>
                <Input name="password" type="password" placeholder="••••••••" />
              </div>
              <Button type="submit" variant="secondary" className="w-full py-4 text-xl border border-gold/30" disabled={isAdminPending}>
                {isAdminPending ? "Authenticating..." : "Access Control"}
              </Button>
            </form>
          )}
        </Card>

        {/* Development Quick-Logins */}
        {process.env.NODE_ENV !== "production" && (
          <div className="mt-12 p-6 border border-dashed border-danger/40 bg-danger/5 space-y-4">
            <p className="text-danger/80 text-xs tracking-widest uppercase font-bold text-center">Development Shortcuts (Removed in Prod)</p>
            <div className="flex gap-4">
              <form action={quickLoginTestTeam} className="flex-1">
                <Button variant="outline" className="w-full text-xs py-2 border-danger/30 text-danger/80 hover:bg-danger/10">Test Team</Button>
              </form>
              <form action={quickLoginAdmin} className="flex-1">
                <Button variant="outline" className="w-full text-xs py-2 border-danger/30 text-danger/80 hover:bg-danger/10">Test Admin</Button>
              </form>
            </div>
          </div>
        )}

        <div className="mt-12 text-center">
          <Link href="/register" className="text-parchment/40 hover:text-gold italic text-sm tracking-widest uppercase transition-colors">
            A new vessel? Register here.
          </Link>
        </div>
      </div>
    </main>
  );
}
