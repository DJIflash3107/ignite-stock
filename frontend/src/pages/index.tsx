import React, { useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  Bot,
  CheckCircle2,
  Cpu,
  Database,
  FileCheck,
  FileText,
  GitBranch,
  Layers,
  MinusCircle,
  Network,
  Scale,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const LandingPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'supporting' | 'contradictory' | 'neutral'>('all');

  return (
    <div className="min-h-screen bg-secondary text-foreground font-body selection:bg-accent/30 selection:text-white">
      {/* Top Banner */}
      <div className="border-b border-border/40 bg-secondary-dark/80 px-4 py-2 text-center text-xs text-secondary-foreground backdrop-blur-sm">
        <span className="inline-flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-accent animate-ping" />
          <span className="font-semibold text-white">Live IDX Engine:</span>
          <span>Deterministic analysis with 7 specialized tools via Sectors Financial API</span>
        </span>
      </div>

      {/* Navigation Header */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-secondary/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-white shadow-lg shadow-accent/25">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <span className="font-heading text-xl font-bold tracking-tight text-white">
                Ignite<span className="text-accent">Stock</span>
              </span>
              <span className="ml-2 hidden rounded bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-secondary-foreground sm:inline-block border border-border">
                IDX INTELLIGENCE
              </span>
            </div>
          </div>

          <nav className="hidden space-x-8 md:flex">
            <a href="#problem" className="text-sm font-medium text-secondary-foreground hover:text-white transition-colors">
              The Problem
            </a>
            <a href="#solution" className="text-sm font-medium text-secondary-foreground hover:text-white transition-colors">
              Solution
            </a>
            <a href="#features" className="text-sm font-medium text-secondary-foreground hover:text-white transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="text-sm font-medium text-secondary-foreground hover:text-white transition-colors">
              How It Works
            </a>
            <a href="#evidence-engine" className="text-sm font-medium text-secondary-foreground hover:text-white transition-colors">
              Evidence Engine
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <a href="#features">
              <Button variant="outline" size="sm" className="hidden sm:inline-flex border-border text-secondary-foreground hover:text-white">
                View Architecture
              </Button>
            </a>
            <a href="#cta">
              <Button variant="default" size="sm" className="shadow-md shadow-accent/20">
                Launch Agent
                <ArrowRight className="h-4 w-4" />
              </Button>
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28">
        {/* Subtle Background Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-accent/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[300px] bg-primary/40 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-primary/80 px-3.5 py-1.5 text-xs font-semibold text-accent shadow-inner mb-6 backdrop-blur-sm">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Evidence-First Equity Investigation Platform</span>
            </div>

            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
              Investigate what moved.{' '}
              <span className="text-accent underline decoration-accent/40 decoration-wavy decoration-2">
                Understand why.
              </span>{' '}
              Follow the evidence.
            </h1>

            <p className="mt-6 text-base sm:text-lg text-secondary-foreground/90 leading-relaxed font-normal">
              IgniteStock bridges deterministic Indonesian Stock Exchange (IDX) data with a multi-node LangGraph investigation pipeline. Uncover true price drivers, cross-examine corporate disclosures, and evaluate calibrated evidence without financial hallucinations.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <a href="#cta" className="w-full sm:w-auto">
                <Button variant="default" size="lg" className="w-full sm:w-auto shadow-xl shadow-accent/25 hover:shadow-accent/40 text-base">
                  <Bot className="mr-2 h-5 w-5" />
                  Start an Investigation
                </Button>
              </a>
              <a href="#evidence-engine" className="w-full sm:w-auto">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto text-base">
                  Explore Evidence Engine
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </a>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-secondary-foreground/70">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                Deterministic Math (No LLM Drift)
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                Sectors API V2 Real Data
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                Tri-State Evidence Classification
              </span>
            </div>
          </div>

          {/* Interactive Hero Product Showcase */}
          <div className="mt-14 rounded-2xl border border-border bg-primary/70 p-3 sm:p-5 shadow-2xl backdrop-blur-xl">
            {/* Window Header */}
            <div className="flex items-center justify-between border-b border-border/70 pb-3 px-2">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-rose-500/80" />
                <div className="h-3 w-3 rounded-full bg-amber-500/80" />
                <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
                <span className="ml-3 font-mono text-xs text-secondary-foreground font-medium">
                  agent://investigate/bbri/target-date=2026-03-15
                </span>
              </div>
              <Badge variant="outline" className="border-border text-secondary-foreground text-[11px]">
                LangGraph State Machine: ACTIVE
              </Badge>
            </div>

            {/* Simulated Live Agent Flow */}
            <div className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Left Column: State Pipeline & Query Context */}
              <div className="lg:col-span-4 flex flex-col gap-3">
                <div className="rounded-xl border border-border bg-secondary-dark/60 p-4">
                  <div className="flex items-center justify-between text-xs text-secondary-foreground mb-2">
                    <span className="font-semibold uppercase tracking-wider text-accent">Active Query</span>
                    <span className="text-[11px] font-mono">IDX: BBRI</span>
                  </div>
                  <p className="text-sm font-semibold text-white">
                    "Why did BBRI surge +4.8% while the banking index moved only +0.9%?"
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <Badge variant="secondary" className="text-[10px]">
                      Price Shock & Sector Divergence
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">
                      Benchmark: IHSG
                    </Badge>
                  </div>
                </div>

                {/* 5-Node Agent Flow */}
                <div className="rounded-xl border border-border bg-secondary-dark/60 p-4">
                  <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <GitBranch className="h-3.5 w-3.5 text-accent" />
                    Autonomous Investigation Nodes
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-primary border border-border/80 text-white">
                      <span className="flex items-center gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                        1. detect_intent
                      </span>
                      <span className="font-mono text-[10px] text-emerald-400">UNUSUAL_VOLUME</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-primary border border-border/80 text-white">
                      <span className="flex items-center gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                        2. plan_investigation
                      </span>
                      <span className="font-mono text-[10px] text-emerald-400">7 TOOLS PLANNED</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-primary border border-border/80 text-white">
                      <span className="flex items-center gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                        3. execute_tools
                      </span>
                      <span className="font-mono text-[10px] text-accent">SECTORS API V2</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-accent/15 border border-accent/40 text-white font-medium">
                      <span className="flex items-center gap-2">
                        <Cpu className="h-3.5 w-3.5 text-accent animate-pulse" />
                        4. process_evidence
                      </span>
                      <span className="font-mono text-[10px] text-accent">TRI-STATE EVAL</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-secondary-light/40 border border-border/40 text-secondary-foreground">
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-secondary-foreground/40 ml-1" />
                        5. generate_response
                      </span>
                      <span className="font-mono text-[10px] text-secondary-foreground/60">SYNTHESIS</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Live Calibrated Evidence Stream */}
              <div className="lg:col-span-8 flex flex-col gap-3">
                <div className="rounded-xl border border-border bg-secondary-dark/60 p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3 mb-3">
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-white">
                        Correlated Evidence Matrix
                      </span>
                      <p className="text-xs text-secondary-foreground">
                        Weighted against movement hypothesis • Overall Confidence: <span className="text-emerald-400 font-semibold">HIGH</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Badge variant="supporting" className="text-[10px]">
                        2 Supporting
                      </Badge>
                      <Badge variant="contradictory" className="text-[10px]">
                        1 Contradictory
                      </Badge>
                      <Badge variant="neutral" className="text-[10px]">
                        1 Neutral
                      </Badge>
                    </div>
                  </div>

                  {/* Evidence Cards */}
                  <div className="space-y-2.5">
                    {/* Item 1: Supporting */}
                    <div className="rounded-lg border border-emerald-800/40 bg-emerald-950/20 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span className="text-xs font-bold text-white">
                            Micro-Loan (Kupedes) Net Interest Margin Expansion
                          </span>
                        </div>
                        <Badge variant="supporting" className="text-[10px]">
                          SUPPORTING • IMPACT: HIGH
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-emerald-200/80 pl-6">
                        Audited financial disclosures confirm micro segment yield reached 13.4%, buffering against central bank rate volatility.
                      </p>
                      <div className="mt-2 flex items-center gap-4 text-[10px] text-emerald-400/80 pl-6 font-mono">
                        <span>Source: Sectors Financials API</span>
                        <span>Type: earnings_financials</span>
                      </div>
                    </div>

                    {/* Item 2: Supporting */}
                    <div className="rounded-lg border border-emerald-800/40 bg-emerald-950/20 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span className="text-xs font-bold text-white">
                            Interim Dividend Resolution & Payout Ratio Target
                          </span>
                        </div>
                        <Badge variant="supporting" className="text-[10px]">
                          SUPPORTING • IMPACT: MODERATE
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-emerald-200/80 pl-6">
                        IDX Official Filing: Board of Directors announced cash dividend schedule yielding 5.2% annualized at current price.
                      </p>
                      <div className="mt-2 flex items-center gap-4 text-[10px] text-emerald-400/80 pl-6 font-mono">
                        <span>Source: Sectors Company Filings</span>
                        <span>Type: corporate_action</span>
                      </div>
                    </div>

                    {/* Item 3: Contradictory */}
                    <div className="rounded-lg border border-rose-800/40 bg-rose-950/20 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <XCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                          <span className="text-xs font-bold text-white">
                            Foreign Institutional Outflow in IDX Banking Peers
                          </span>
                        </div>
                        <Badge variant="contradictory" className="text-[10px]">
                          CONTRADICTORY • IMPACT: MODERATE
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-rose-200/80 pl-6">
                        Peer financial institutions (BMRI, BBCA, BBNI) recorded net foreign selling totaling IDR 480B on the same trading session.
                      </p>
                      <div className="mt-2 flex items-center gap-4 text-[10px] text-rose-400/80 pl-6 font-mono">
                        <span>Source: Sectors Peer Movements</span>
                        <span>Type: peer_movement</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section id="problem" className="border-t border-border bg-secondary py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-widest text-accent">
              The Reality of IDX Market Intelligence
            </span>
            <h2 className="mt-3 font-heading text-3xl sm:text-4xl font-extrabold text-white">
              Why Traditional Stock Analysis Fails on the IDX
            </h2>
            <p className="mt-4 text-base text-secondary-foreground leading-relaxed">
              When a stock suddenly surges or collapses on the Indonesia Stock Exchange, investors are left drowning in speculative Telegram groups, delayed disclosures, and generic AI hallucinations.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Problem 1 */}
            <Card className="border-border bg-surface-card hover:border-accent/50 transition-colors">
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-rose-950/50 text-rose-400 border border-rose-800/40 mb-3">
                  <TrendingDown className="h-6 w-6" />
                </div>
                <CardTitle className="text-base text-white">Unsubstantiated Rumors</CardTitle>
                <CardDescription>
                  Market commentary is dominated by anonymous chat groups and hype, leading retail investors into liquidity traps.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-xs text-secondary-foreground/70">
                Lacks primary source verification and audited IDX disclosure references.
              </CardContent>
            </Card>

            {/* Problem 2 */}
            <Card className="border-border bg-surface-card hover:border-accent/50 transition-colors">
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-950/50 text-amber-400 border border-amber-800/40 mb-3">
                  <Database className="h-6 w-6" />
                </div>
                <CardTitle className="text-base text-white">Fragmented Data Silos</CardTitle>
                <CardDescription>
                  Price series, corporate action letters, financial statements, and news releases live in separate, disconnected portals.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-xs text-secondary-foreground/70">
                Hours spent manually compiling reports before reaching a coherent thesis.
              </CardContent>
            </Card>

            {/* Problem 3 */}
            <Card className="border-border bg-surface-card hover:border-accent/50 transition-colors">
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-rose-950/50 text-rose-400 border border-rose-800/40 mb-3">
                  <Bot className="h-6 w-6" />
                </div>
                <CardTitle className="text-base text-white">LLM Hallucinations</CardTitle>
                <CardDescription>
                  Standard ChatGPT-style models invent historical earnings figures, fake P/E multiples, and generate fabricated corporate events.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-xs text-secondary-foreground/70">
                Dangerous for capital allocation when precision is non-negotiable.
              </CardContent>
            </Card>

            {/* Problem 4 */}
            <Card className="border-border bg-surface-card hover:border-accent/50 transition-colors">
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/20 text-accent border border-accent/40 mb-3">
                  <BarChart3 className="h-6 w-6" />
                </div>
                <CardTitle className="text-base text-white">Context Blindness</CardTitle>
                <CardDescription>
                  A +3% move is meaningless without knowing whether the subsector jumped +5%, or how much the ticker influenced the composite index.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-xs text-secondary-foreground/70">
                Fails to calculate relative performance and weighted index contributions.
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section id="solution" className="border-t border-border bg-primary/40 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 rounded-md bg-accent/15 px-3 py-1 text-xs font-bold text-accent">
                THE IGNITESTOCK SOLUTION
              </div>
              <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-white leading-tight">
                Deterministic Accuracy Grounded in Real Market Evidence
              </h2>
              <p className="text-base text-secondary-foreground leading-relaxed">
                IgniteStock replaces speculative guesswork with a strict, verifiable research architecture. We separate mathematical truth from reasoning: all metrics are calculated deterministically using decimal math, while autonomous agents evaluate drivers against authentic market evidence.
              </p>

              <div className="space-y-4 pt-2">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent text-white">
                    <Scale className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-heading text-sm font-bold text-white">Strict No-Hallucination Policy</h4>
                    <p className="text-xs text-secondary-foreground leading-relaxed mt-1">
                      Returns, relative sector spreads, and estimated market cap share weights are calculated with Python Decimal precision—never generated by an LLM.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent text-white">
                    <Network className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-heading text-sm font-bold text-white">Dynamic 7-Tool Agent Architecture</h4>
                    <p className="text-xs text-secondary-foreground leading-relaxed mt-1">
                      Our LangGraph state machine autonomously triggers specialized tools across stock prices, market context, sector trends, peer movements, news, filings, and financials.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent text-white">
                    <FileCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-heading text-sm font-bold text-white">Tri-State Evidence Evaluation</h4>
                    <p className="text-xs text-secondary-foreground leading-relaxed mt-1">
                      Findings are classified as Supporting, Contradictory, or Neutral with explicit confidence weighting so you see the complete picture.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Architecture Card */}
            <div className="lg:col-span-6">
              <div className="rounded-2xl border border-border bg-surface-card p-6 shadow-xl">
                <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
                  <h3 className="font-heading text-base font-bold text-white flex items-center gap-2">
                    <Cpu className="h-4 w-4 text-accent" />
                    IgniteStock System Architecture
                  </h3>
                  <Badge variant="outline" className="text-[10px] text-accent border-accent/40">
                    FastAPI + LangGraph + Sectors V2
                  </Badge>
                </div>

                <div className="space-y-3 font-mono text-xs">
                  <div className="p-3 rounded-lg bg-secondary border border-border">
                    <span className="text-secondary-foreground text-[11px] block mb-1">CLIENT LAYER:</span>
                    <span className="text-white font-semibold">React 19 + TypeScript + Redux + Tailwind CSS</span>
                    <p className="text-[11px] text-secondary-foreground/80 mt-1">
                      Typed API client, reactive store, and event-driven SSE streaming.
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-secondary border border-border">
                    <span className="text-accent text-[11px] block mb-1">AGENTIC WORKFLOW LAYER:</span>
                    <span className="text-white font-semibold">LangGraph 5-Node StateGraph</span>
                    <p className="text-[11px] text-secondary-foreground/80 mt-1">
                      Intent Parsing → Tool Planning → Tool Execution → Evidence Processing → Synthesized Reasoning.
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-secondary border border-border">
                    <span className="text-emerald-400 text-[11px] block mb-1">DETERMINISTIC DATA CORE:</span>
                    <span className="text-white font-semibold">Sectors Financial API V2 Integration</span>
                    <p className="text-[11px] text-secondary-foreground/80 mt-1">
                      Bounded date intervals, process-local TTL cache, and Decimal math calculations.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features Section */}
      <section id="features" className="border-t border-border bg-secondary py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-widest text-accent">
              Platform Capabilities
            </span>
            <h2 className="mt-3 font-heading text-3xl sm:text-4xl font-extrabold text-white">
              Built Specifically for the Complexity of the IDX
            </h2>
            <p className="mt-4 text-base text-secondary-foreground leading-relaxed">
              Every feature is built around the fundamental principle: explain what moved, identify why, and substantiate every claim with auditable evidence.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <Card className="border-border bg-surface-card hover:border-accent/40 transition-all hover:-translate-y-1">
              <CardHeader>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/20 text-accent mb-2">
                  <Bot className="h-5 w-5" />
                </div>
                <CardTitle className="text-base text-white">AI Investigation Agent</CardTitle>
                <CardDescription>
                  Multi-turn conversational reasoning supporting dynamic queries like "Was this sector-wide?", "Compare with BMRI", and "Show me filings".
                </CardDescription>
              </CardHeader>
              <CardContent className="text-xs text-secondary-foreground/75 space-y-1.5">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-accent" />
                  <span>Stateful conversation memory</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-accent" />
                  <span>Server-Sent Events (SSE) streaming</span>
                </div>
              </CardContent>
            </Card>

            {/* Feature 2 */}
            <Card className="border-border bg-surface-card hover:border-accent/40 transition-all hover:-translate-y-1">
              <CardHeader>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/20 text-accent mb-2">
                  <Scale className="h-5 w-5" />
                </div>
                <CardTitle className="text-base text-white">Tri-State Evidence Matrix</CardTitle>
                <CardDescription>
                  Classifies all discovered signals into Supporting, Contradictory, or Neutral evidence items with impact and confidence ratings.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-xs text-secondary-foreground/75 space-y-1.5">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-accent" />
                  <span>Calibrated confidence levels</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-accent" />
                  <span>Explicit contradictory evidence alerts</span>
                </div>
              </CardContent>
            </Card>

            {/* Feature 3 */}
            <Card className="border-border bg-surface-card hover:border-accent/40 transition-all hover:-translate-y-1">
              <CardHeader>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/20 text-accent mb-2">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <CardTitle className="text-base text-white">Deterministic Market Impact</CardTitle>
                <CardDescription>
                  Computes index returns, subsector benchmarks, relative performance, and estimated market cap share weights deterministically.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-xs text-secondary-foreground/75 space-y-1.5">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-accent" />
                  <span>Exact stock contribution calculations</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-accent" />
                  <span>Zero LLM mathematical estimation</span>
                </div>
              </CardContent>
            </Card>

            {/* Feature 4 */}
            <Card className="border-border bg-surface-card hover:border-accent/40 transition-all hover:-translate-y-1">
              <CardHeader>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/20 text-accent mb-2">
                  <Database className="h-5 w-5" />
                </div>
                <CardTitle className="text-base text-white">7 Sectors API Tools</CardTitle>
                <CardDescription>
                  Integrates real-time price history, sector context, peer comparisons, company news, corporate filings, and quarterly financials.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-xs text-secondary-foreground/75 space-y-1.5">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-accent" />
                  <span>Real IDX corporate disclosure retrieval</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-accent" />
                  <span>Normalized subsector classification</span>
                </div>
              </CardContent>
            </Card>

            {/* Feature 5 */}
            <Card className="border-border bg-surface-card hover:border-accent/40 transition-all hover:-translate-y-1">
              <CardHeader>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/20 text-accent mb-2">
                  <Layers className="h-5 w-5" />
                </div>
                <CardTitle className="text-base text-white">Ranked Driver Identification</CardTitle>
                <CardDescription>
                  Isolates and ranks the primary drivers behind any price movement, categorized across earnings, macro, sector, or corporate action.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-xs text-secondary-foreground/75 space-y-1.5">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-accent" />
                  <span>Impact severity: Critical to Negligible</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-accent" />
                  <span>Cross-linked to supporting evidence items</span>
                </div>
              </CardContent>
            </Card>

            {/* Feature 6 */}
            <Card className="border-border bg-surface-card hover:border-accent/40 transition-all hover:-translate-y-1">
              <CardHeader>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/20 text-accent mb-2">
                  <FileText className="h-5 w-5" />
                </div>
                <CardTitle className="text-base text-white">Auditable Source Lineage</CardTitle>
                <CardDescription>
                  Every insight links back to source references and exact observation timestamps, creating a transparent institutional research audit trail.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-xs text-secondary-foreground/75 space-y-1.5">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-accent" />
                  <span>Direct source citation on every finding</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-accent" />
                  <span>Full database persistence & history</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="border-t border-border bg-primary/30 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-widest text-accent">
              The Workflow
            </span>
            <h2 className="mt-3 font-heading text-3xl sm:text-4xl font-extrabold text-white">
              How an Investigation Unfolds
            </h2>
            <p className="mt-4 text-base text-secondary-foreground leading-relaxed">
              From an initial market anomaly to an auditable, evidence-backed conclusion in four systematic stages.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Step 1 */}
            <div className="relative rounded-xl border border-border bg-surface-card p-6 flex flex-col justify-between">
              <div>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-white font-bold text-sm mb-4">
                  1
                </div>
                <h3 className="font-heading text-base font-bold text-white mb-2">Detect Intent & Anomaly</h3>
                <p className="text-xs text-secondary-foreground leading-relaxed">
                  Submit a ticker, specific target date, or conversational prompt. The agent classifies intent: volume spike, price shock, earnings surprise, or sector rotation.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-border/60 text-[11px] font-mono text-accent">
                detect_intent()
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative rounded-xl border border-border bg-surface-card p-6 flex flex-col justify-between">
              <div>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-white font-bold text-sm mb-4">
                  2
                </div>
                <h3 className="font-heading text-base font-bold text-white mb-2">Autonomous Tool Planning</h3>
                <p className="text-xs text-secondary-foreground leading-relaxed">
                  The agent builds a dynamic plan selecting required Sectors API endpoints: stock daily history, subsector benchmarks, peer performance, filings, and news.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-border/60 text-[11px] font-mono text-accent">
                plan_investigation()
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative rounded-xl border border-border bg-surface-card p-6 flex flex-col justify-between">
              <div>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-white font-bold text-sm mb-4">
                  3
                </div>
                <h3 className="font-heading text-base font-bold text-white mb-2">Deterministic Correlation</h3>
                <p className="text-xs text-secondary-foreground leading-relaxed">
                  The backend executes queries and computes relative performance, index returns, and contribution metrics using exact Decimal arithmetic.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-border/60 text-[11px] font-mono text-accent">
                execute_tools()
              </div>
            </div>

            {/* Step 4 */}
            <div className="relative rounded-xl border border-border bg-surface-card p-6 flex flex-col justify-between">
              <div>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-white font-bold text-sm mb-4">
                  4
                </div>
                <h3 className="font-heading text-base font-bold text-white mb-2">Evidence Synthesis</h3>
                <p className="text-xs text-secondary-foreground leading-relaxed">
                  Discovered items are calibrated as Supporting, Contradictory, or Neutral. Primary drivers are ranked by impact and presented in an enriched report.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-border/60 text-[11px] font-mono text-accent">
                process_evidence()
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Evidence-First Concept Showcase */}
      <section id="evidence-engine" className="border-t border-border bg-secondary py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-widest text-accent">
              The Evidence-First Methodology
            </span>
            <h2 className="mt-3 font-heading text-3xl sm:text-4xl font-extrabold text-white">
              Tri-State Evidence: Why Dissenting Data Matters
            </h2>
            <p className="mt-4 text-base text-secondary-foreground leading-relaxed">
              Most platforms confirm whatever narrative you feed them. IgniteStock actively searches for contradictory signals—ensuring you never fall for confirmation bias.
            </p>
          </div>

          {/* Interactive Evidence Filter Showcase */}
          <div className="mt-12 rounded-2xl border border-border bg-surface-card p-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4 mb-6">
              <div>
                <h3 className="font-heading text-lg font-bold text-white flex items-center gap-2">
                  <FileCheck className="h-5 w-5 text-accent" />
                  Sample Investigation: ASII (Astra International)
                </h3>
                <p className="text-xs text-secondary-foreground mt-0.5">
                  Target Event: Automotive Segment Volume Rebound (+3.8% intraday move)
                </p>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-2 bg-secondary p-1 rounded-lg border border-border">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                    activeTab === 'all'
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-secondary-foreground hover:text-white'
                  }`}
                >
                  All Evidence
                </button>
                <button
                  onClick={() => setActiveTab('supporting')}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                    activeTab === 'supporting'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                      : 'text-secondary-foreground hover:text-white'
                  }`}
                >
                  Supporting
                </button>
                <button
                  onClick={() => setActiveTab('contradictory')}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                    activeTab === 'contradictory'
                      ? 'bg-rose-950 text-rose-300 border border-rose-800/60'
                      : 'text-secondary-foreground hover:text-white'
                  }`}
                >
                  Contradictory
                </button>
                <button
                  onClick={() => setActiveTab('neutral')}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                    activeTab === 'neutral'
                      ? 'bg-amber-950 text-amber-300 border border-amber-800/60'
                      : 'text-secondary-foreground hover:text-white'
                  }`}
                >
                  Neutral
                </button>
              </div>
            </div>

            {/* Evidence List */}
            <div className="space-y-3">
              {(activeTab === 'all' || activeTab === 'supporting') && (
                <div className="rounded-xl border border-emerald-800/40 bg-emerald-950/20 p-4 transition-all">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-900/60 text-emerald-400">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                      <span className="font-heading text-sm font-bold text-white">
                        Gaikindo Monthly 4W Wholesale Data Release
                      </span>
                    </div>
                    <Badge variant="supporting">SUPPORTING • HIGH IMPACT</Badge>
                  </div>
                  <p className="mt-2 text-xs text-emerald-200/85 pl-9 leading-relaxed">
                    National automotive association data shows Astra brand market share rebounded to 56.4% in the reported month, up 280 bps month-on-month.
                  </p>
                  <div className="mt-3 flex items-center gap-4 pl-9 text-[11px] font-mono text-emerald-400/80">
                    <span>Source: Sectors Company News</span>
                    <span>Confidence: HIGH</span>
                    <span>Observed: 2026-02-18</span>
                  </div>
                </div>
              )}

              {(activeTab === 'all' || activeTab === 'contradictory') && (
                <div className="rounded-xl border border-rose-800/40 bg-rose-950/20 p-4 transition-all">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-900/60 text-rose-400">
                        <XCircle className="h-4 w-4" />
                      </div>
                      <span className="font-heading text-sm font-bold text-white">
                        Heavy Machinery (UNTR) Coal Price Sensitivity
                      </span>
                    </div>
                    <Badge variant="contradictory">CONTRADICTORY • MODERATE IMPACT</Badge>
                  </div>
                  <p className="mt-2 text-xs text-rose-200/85 pl-9 leading-relaxed">
                    Subsidiary United Tractors recorded softened Komatsu machinery delivery targets due to Newcastle thermal coal price consolidation at $128/tonne.
                  </p>
                  <div className="mt-3 flex items-center gap-4 pl-9 text-[11px] font-mono text-rose-400/80">
                    <span>Source: Sectors Financials & Commodity Filings</span>
                    <span>Confidence: MEDIUM</span>
                    <span>Observed: 2026-02-18</span>
                  </div>
                </div>
              )}

              {(activeTab === 'all' || activeTab === 'neutral') && (
                <div className="rounded-xl border border-amber-800/40 bg-amber-950/20 p-4 transition-all">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-900/60 text-amber-400">
                        <MinusCircle className="h-4 w-4" />
                      </div>
                      <span className="font-heading text-sm font-bold text-white">
                        Routine Treasury Stock Cancellation Disclosure
                      </span>
                    </div>
                    <Badge variant="neutral">NEUTRAL • LOW IMPACT</Badge>
                  </div>
                  <p className="mt-2 text-xs text-amber-200/85 pl-9 leading-relaxed">
                    Formal IDX regulatory announcement confirming scheduled treasury share adjustment following prior share buyback program completion.
                  </p>
                  <div className="mt-3 flex items-center gap-4 pl-9 text-[11px] font-mono text-amber-400/80">
                    <span>Source: Sectors Company Filings</span>
                    <span>Confidence: HIGH</span>
                    <span>Observed: 2026-02-17</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section id="cta" className="relative overflow-hidden border-t border-border bg-gradient-to-b from-primary to-secondary-dark py-24">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-accent/15 rounded-full blur-[140px] pointer-events-none" />

        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent mb-6">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Ready for Rigorous Equity Intelligence</span>
          </div>

          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight">
            Stop Guessing IDX Movements.{' '}
            <span className="text-accent">Follow the Evidence.</span>
          </h2>

          <p className="mt-6 text-base sm:text-lg text-secondary-foreground leading-relaxed max-w-2xl mx-auto">
            Experience the power of deterministic equity calculations paired with an autonomous LangGraph investigation agent. Uncover what really moved Indonesian stocks.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              variant="default"
              size="lg"
              className="w-full sm:w-auto shadow-xl shadow-accent/30 hover:shadow-accent/50 text-base"
              onClick={() => {
                alert('Agent chat interface is connecting to the backend API at ' + (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'));
              }}
            >
              <Bot className="mr-2 h-5 w-5" />
              Launch Investigation Console
            </Button>
            <a href="#how-it-works">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto text-base">
                Review Methodology
              </Button>
            </a>
          </div>

          <div className="mt-10 text-xs text-secondary-foreground/60 max-w-xl mx-auto leading-relaxed border-t border-border/40 pt-6">
            <span className="font-semibold text-secondary-foreground">Data Integrity Guarantee:</span>{' '}
            IgniteStock integrates with Sectors Financial API. All calculations are executed with exact decimal mathematics. No fabricated or simulated market data is used.
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/80 bg-secondary-dark py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-white shadow-md shadow-accent/20">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <span className="font-heading text-lg font-bold text-white">
                  Ignite<span className="text-accent">Stock</span>
                </span>
                <p className="text-xs text-secondary-foreground">
                  Evidence-driven equity investigation for the Indonesian Stock Exchange.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-secondary-foreground">
              <span className="font-mono">API: /api/agent/chat</span>
              <span className="font-mono">API: /api/investigations/analyze</span>
              <span className="font-mono">API: /api/market/overview</span>
            </div>

            <div className="text-xs text-secondary-foreground/60">
              © {new Date().getFullYear()} IgniteStock. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
