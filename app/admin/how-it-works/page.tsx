"use client";
import React from "react";
import Link from "next/link";
import {
  Zap,
  Database,
  Terminal,
  FileJson,
  CloudUpload,
  ShieldCheck,
  ArrowRight,
  LayoutDashboard,
  Cpu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HiOutlineMenuAlt4 } from "react-icons/hi";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export default function HowItWorks() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white font-montserrat selection:bg-purple-500/30">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md border-b border-purple-900/30 bg-[#0a0a0f]/80 px-4 md:px-8 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-purple-600 flex items-center justify-center">
              <Zap className="fill-white" size={18} />
            </div>
            <span className="text-xl font-bold tracking-tight italic">
              ATH Docs
            </span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/admin/dashboard"
              className="text-sm font-medium text-slate-400 hover:text-purple-400 transition-colors flex items-center gap-2"
            >
              <LayoutDashboard size={16} />
              Admin Dashboard
            </Link>
            <Button
              variant="outline"
              className="border-purple-500/30 hover:bg-purple-500/10 h-9"
            >
              v1.0.4 Deployment
            </Button>
          </nav>

          {/* Mobile Nav */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <HiOutlineMenuAlt4 className="text-2xl" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="bg-[#0a0a0f] border-purple-900/30 text-white font-montserrat"
              >
                <div className="mt-12 flex flex-col gap-6">
                  <Link
                    href="/admin/dashboard"
                    className="text-xl flex items-center gap-3 text-slate-300"
                  >
                    <LayoutDashboard /> Dashboard
                  </Link>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12 md:py-20">
        {/* Hero Section */}
        <section className="text-center mb-20">
          <h1 className="text-4xl md:text-6xl font-black mb-6 bg-gradient-to-b from-white to-purple-500 bg-clip-text text-transparent italic">
            Voucher Lifecycle & Automation
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Documentation for the three-tier architecture: MikroTik Edge, Data
            Pipeline, and Firebase Cloud storage.
          </p>
        </section>

        {/* Architecture Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
          <ArchitectureCard
            icon={<Cpu className="text-purple-400" />}
            title="Edge (MikroTik)"
            desc="Generates unique vouchers in bulk with specific uptime limits and handles user authentication."
          />
          <ArchitectureCard
            icon={<ArrowRight className="text-purple-400" />}
            title="Data Pipeline"
            desc="Extracts router data via :execute, converts to JSON, and prepares for cloud synchronization."
          />
          <ArchitectureCard
            icon={<Database className="text-purple-400" />}
            title="Cloud (Firebase)"
            desc="Stores voucher data consumed by the front-end for user login and status tracking."
          />
        </div>

        {/* The Pipeline - Steps */}
        <section className="space-y-16">
          <h2 className="text-3xl font-bold flex items-center gap-3">
            <Terminal className="text-purple-500" /> End-to-End Pipeline
          </h2>

          <Step
            number="01"
            title="Bulk Generation"
            desc="Run specialized scripts in the Winbox terminal. Each script uses a 5-digit random charset to avoid collisions and assigns a 'limit-uptime' to ensure automatic expiration."
            code={`/ip hotspot user add name=("QS" . $i . [:rndnum from=10 to=99]) password=$pass profile="QUICK_SURF" limit-uptime=2h`}
          />

          <Step
            number="02"
            title="Direct File Streaming"
            desc="To bypass the 4096-character limit of RouterOS variables, we stream directly to 'flash/vouchers_final.txt' using the :execute command."
            code={`/execute script=$scriptCode file="flash/vouchers_final.txt";`}
          />

          <Step
            number="03"
            title="JSON Transformation"
            desc="The .txt file is converted to a vouchers.json structure. This maps local MikroTik profiles to the global Cloud PlanTypes."
            icon={<FileJson className="text-yellow-500" />}
          />

          <Step
            number="04"
            title="Firebase Sync"
            desc="Execute 'node uploadVouchers.cjs'. The script uses Firestore Batches (chunks of 500) for high-speed, reliable delivery to the database."
            icon={<CloudUpload className="text-blue-500" />}
          />
        </section>

        {/* Security Note */}
        <div className="mt-24 p-8 rounded-2xl border border-green-900/30 bg-green-900/5 flex flex-col md:flex-row gap-6 items-center">
          <div className="h-14 w-14 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
            <ShieldCheck className="text-green-500" size={32} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-green-400 mb-2">
              Security & Isolation
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Our system architecture completely insulates the MikroTik server
              from malicious attacks. By utilizing a manual JSON push rather
              than a direct API connection, we ensure the router remains
              unreachable from the public front-end.
            </p>
          </div>
        </div>
      </main>

      <footer className="border-t border-purple-900/20 py-10 text-center text-slate-600 text-xs">
        &copy; 2026 ATH Network Solutions • Documentation v1.0
      </footer>
    </div>
  );
}

function ArchitectureCard({ icon, title, desc }: any) {
  return (
    <Card className="bg-gray-900/40 border-purple-900/20 hover:border-purple-500/40 transition-all duration-500 group">
      <CardHeader>
        <div className="mb-4 p-3 rounded-lg bg-purple-500/10 w-fit group-hover:bg-purple-500/20 transition-colors">
          {icon}
        </div>
        <CardTitle className="text-white italic">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
      </CardContent>
    </Card>
  );
}

function Step({ number, title, desc, code, icon }: any) {
  return (
    <div className="relative pl-12 md:pl-20">
      <div className="absolute left-0 top-0 text-5xl md:text-7xl font-black text-purple-900/20 italic select-none">
        {number}
      </div>
      <div className="relative">
        <h3 className="text-2xl font-bold mb-3 flex items-center gap-4">
          {title} {icon}
        </h3>
        <p className="text-slate-400 mb-6 max-w-3xl leading-relaxed">{desc}</p>
        {code && (
          <div className="bg-black/60 rounded-xl p-4 border border-purple-900/40 font-mono text-xs text-purple-300 overflow-x-auto shadow-inner">
            <code>{code}</code>
          </div>
        )}
      </div>
    </div>
  );
}
