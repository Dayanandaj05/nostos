"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { Anchor } from "lucide-react";
import { OceanCanvas } from "@/components/ui/OceanCanvas";

// Ornamental Motifs
const CompassRose = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="2 4" />
    <circle cx="50" cy="50" r="35" fill="none" stroke="currentColor" strokeWidth="0.5" />
    <path d="M50 5 L60 40 L50 95 L40 40 Z" fill="currentColor" opacity="0.8" />
    <path d="M5 50 L40 60 L95 50 L40 40 Z" fill="currentColor" opacity="0.5" />
    <circle cx="50" cy="50" r="8" fill="currentColor" />
  </svg>
);

export default function ShowcasePage() {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isHoveringMap, setIsHoveringMap] = React.useState(false);

  return (
    <main className="min-h-screen text-parchment font-serif pb-48 selection:bg-gold selection:text-ink relative overflow-hidden">
      
      {/* Less Intense Animated Ocean Canvas Background */}
      <div className="fixed inset-0 opacity-35 pointer-events-none z-0">
        <OceanCanvas />
      </div>
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,rgba(15,23,37,0.70)_0%,rgba(15,23,37,0.90)_70%,rgba(10,16,25,0.97)_100%)] pointer-events-none z-0" />

      {/* The Epic Hero Horizon */}
      <section className="relative w-full min-h-[85vh] flex flex-col justify-end p-12 md:p-24 overflow-hidden border-b border-parchment/10">
        
        {/* Deep Sea Gradient & Distant Horizon */}
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/80 to-transparent z-10" />
        
        {/* Colossal Faded Map Background */}
        <div className="absolute inset-0 opacity-10 pointer-events-none transform scale-125 rotate-12 origin-top-right mix-blend-screen"
             style={{ backgroundImage: 'radial-gradient(circle at center, #2E7D8C 1px, transparent 1px)', backgroundSize: '120px 120px' }}>
             <CompassRose className="absolute top-1/4 right-1/4 w-[800px] h-[800px] text-parchment animate-pulse" />
        </div>

        {/* Cinematic Title Alignment */}
        <div className="relative z-20 max-w-4xl space-y-6">
          <p className="text-gold tracking-[0.3em] uppercase text-sm md:text-base font-bold">
            Book I — The Arsenal
          </p>
          <h1 className="font-serif text-6xl md:text-9xl font-normal tracking-tight leading-[0.8] text-parchment drop-shadow-2xl">
            NOSTOS
          </h1>
          <p className="max-w-2xl text-xl md:text-3xl text-parchment/60 leading-relaxed font-serif italic border-l border-gold/30 pl-6 mt-8">
            The design codex. We leave the sterile grids behind and set sail into the dark.
          </p>
        </div>
      </section>

      {/* Chapter I: Typography & Texture */}
      <section className="max-w-5xl mx-auto px-8 md:px-16 mt-32 relative">
        <div className="absolute -left-4 md:-left-12 top-0 h-full w-px bg-gradient-to-b from-gold/50 to-transparent" />
        
        <p className="text-2xl md:text-4xl leading-relaxed text-parchment/90 text-justify">
          <span className="float-left text-7xl md:text-9xl font-bold text-gold mr-6 mt-2 leading-none border border-gold/20 p-4 bg-gold/5">
            T
          </span>
          his manuscript details the visual language of our voyage. We reject the sterile screens of modern machinery and symmetrical balance. Instead, we embrace the vastness of the sea, the permanence of ink, and the weight of history. Every word is carved in <strong className="text-gold font-normal">EB Garamond</strong>, echoing the heavy strikes of the printing press and the illuminated texts of antiquity.
        </p>
      </section>

      {/* Chapter II: The Actions */}
      <section className="max-w-6xl mx-auto px-8 md:px-24 mt-48">
        <h2 className="text-4xl md:text-6xl text-gold mb-16 tracking-wide">The Call to Action</h2>
        
        <div className="flex flex-col gap-12 max-w-2xl">
          <div className="group relative">
            <span className="absolute -left-12 top-1/2 -translate-y-1/2 text-parchment/20 text-4xl opacity-0 group-hover:opacity-100 transition-opacity duration-700">I.</span>
            <Button className="w-full justify-between group-hover:pl-12 transition-all duration-700 text-2xl">
              <span>Set Sail Into the Black</span>
              <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-700 font-normal italic text-gold">Primary</span>
            </Button>
          </div>

          <div className="group relative">
            <span className="absolute -left-12 top-1/2 -translate-y-1/2 text-parchment/20 text-4xl opacity-0 group-hover:opacity-100 transition-opacity duration-700">II.</span>
            <Button variant="secondary" className="w-full justify-between group-hover:pl-12 transition-all duration-700 text-2xl">
              <span>Chart a New Course</span>
              <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-700 font-normal italic text-parchment/50">Secondary</span>
            </Button>
          </div>

          <div className="group relative">
            <span className="absolute -left-12 top-1/2 -translate-y-1/2 text-danger/20 text-4xl opacity-0 group-hover:opacity-100 transition-opacity duration-700">III.</span>
            <Button variant="danger" className="w-full justify-between group-hover:pl-12 transition-all duration-700 text-2xl">
              <span>Scuttle the Ship</span>
              <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-700 font-normal italic text-danger/50">Destructive</span>
            </Button>
          </div>
        </div>
      </section>

      {/* Chapter III: The Inscriptions & Inputs */}
      <section className="max-w-6xl mx-auto px-8 md:px-24 mt-48 flex flex-col md:flex-row gap-24 items-end">
        <div className="flex-1 space-y-16">
          <h2 className="text-4xl md:text-6xl text-gold tracking-wide">Inscriptions</h2>
          <div className="space-y-4">
            <label className="text-gold/60 tracking-widest uppercase text-sm font-bold">Declare Your Vessel</label>
            <Input placeholder="Enter ship name..." />
          </div>
          <div className="space-y-4">
            <label className="text-danger/60 tracking-widest uppercase text-sm font-bold">The Oracle's Demand</label>
            <Input placeholder="Offer a password..." isError errorMessage="The sea rejects this offering. The word is lost." />
          </div>
        </div>
        
        {/* Massive atmospheric text offset */}
        <div className="hidden md:block flex-1 pb-4">
          <p className="text-3xl italic text-parchment/30 leading-relaxed text-right border-r border-parchment/20 pr-8">
            "Only those who know the true names of the winds may pass..."
          </p>
        </div>
      </section>

      {/* Chapter IV: Fragments & Containers */}
      <section className="w-full px-8 md:px-12 mt-48">
        <h2 className="text-4xl md:text-6xl text-gold mb-16 text-center tracking-wide">Fragments Recovered</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="min-h-[400px]">
            <CardHeader>
              <CardTitle>Ship's Log: Day I</CardTitle>
            </CardHeader>
            <CardContent className="text-xl leading-relaxed text-parchment/80 mt-8">
              We departed at dawn. The containers in this interface are no longer tidy white boxes with soft modern drop-shadows. They are dark, sheer voids that bleed into the vastness of the ocean, defined only by subtle, sharp borders.
            </CardContent>
          </Card>
          
          <Card isLoading className="min-h-[400px]" />
          
          <Card isEmpty emptyMessage="No vessels recorded in this sector." className="min-h-[400px]" />
        </div>
      </section>

      {/* Chapter V: Overlays and Decrees */}
      <section className="max-w-4xl mx-auto px-8 md:px-16 mt-48 text-center space-y-16">
        <h2 className="text-4xl md:text-6xl text-gold tracking-wide">The Edicts</h2>
        <p className="text-2xl text-parchment/60 italic max-w-2xl mx-auto">
          When the gods demand attention, the sea stops, and a singular message descends upon the crew.
        </p>
        <Button onClick={() => setIsModalOpen(true)} className="text-2xl">Unroll the Edict</Button>
        
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="The Oracle's Warning">
          <p className="text-parchment/80 mb-12 leading-relaxed text-2xl text-center italic">
            Are you certain you wish to chart this course? The sirens have been reported in these waters, and many who have sailed past the jagged rocks of Scylla never returned.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-8 mt-12">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Hold Position</Button>
            <Button onClick={() => setIsModalOpen(false)}>Embrace the Storm</Button>
          </div>
        </Modal>
      </section>

    </main>
  );
}
