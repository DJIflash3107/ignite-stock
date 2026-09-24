import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppSelector } from '@/redux/hooks';
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

/**
 * Marketing landing page.
 * Surfaces alternate between the 60% base (#282a36) and 30% nav (#1f202a) to
 * separate sections. A single accent CTA is used per view; every other action
 * is neutral. No gradients, glows or blur effects are used, and all radii are
 * 0.25rem. Illustrative product content is retained but recolored to the
 * semantic palette (success / danger / warning) with supporting icons.
 */
export const LandingPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'supporting' | 'contradictory' | 'neutral'>('all');
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  const primaryHref = isAuthenticated ? '/investigations' : '/login';

  const evidenceItems = [
    {
      kind: 'supporting' as const,
      title: 'Micro-Loan (Kupedes) Net Interest Margin Expansion',
      badge: 'Supporting • Impact: High',
      body: 'Audited financial disclosures confirm micro segment yield reached 13.4%, buffering against central bank rate volatility.',
      source: 'Source: Sectors Financials API',
      type: 'Type: earnings_financials',
      icon: CheckCircle2,
    },
    {
      kind: 'supporting' as const,
      title: 'Interim Dividend Resolution & Payout Ratio Target',
      badge: 'Supporting • Impact: Moderate',
      body: 'IDX Official Filing: Board of Directors announced cash dividend schedule yielding 5.2% annualized at current price.',
      source: 'Source: Sectors Company Filings',
      type: 'Type: corporate_action',
      icon: CheckCircle2,
    },
    {
      kind: 'contradictory' as const,
      title: 'Foreign Institutional Outflow in IDX Banking Peers',
      badge: 'Contradictory • Impact: Moderate',
      body: 'Peer financial institutions (BMRI, BBCA, BBNI) recorded net foreign selling totaling IDR 480B on the same trading session.',
      source: 'Source: Sectors Peer Movements',
      type: 'Type: peer_movement',
      icon: XCircle,
    },
    {
      kind: 'neutral' as const,
      title: 'Routine Treasury Stock Cancellation Disclosure',
      badge: 'Neutral • Impact: Low',
      body: 'Formal IDX regulatory announcement confirming scheduled treasury share adjustment following prior share buyback program completion.',
      source: 'Source: Sectors Company Filings',
      type: 'Type: corporate_filing',
      icon: MinusCircle,
    },
  ];

  const visibleEvidence = evidenceItems.filter(
    (item) => activeTab === 'all' || item.kind === activeTab
  );

  return (
    <div className="min-h-screen bg-secondary text-foreground font-body">
      {/* Utility banner */}
      <div className="border-b border-border bg-secondary-dark px-4 py-2 text-center text-sm text-secondary-foreground">
        <span className="inline-flex flex-wrap items-center justify-center gap-2">
          <span className="h-2 w-2 rounded-full bg-success" aria-hidden="true" />
          <span className="font-bold text-white">Live IDX Engine:</span>
          <span>Deterministic analysis with 7 specialized tools via Sectors Financial API</span>
        </span>
      </div>

      {/* Navigation header */}
      <header className="sticky top-0 z-40 border-b border-border bg-secondary">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="flex items-center gap-3 rounded-[0.25rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-[0.25rem] bg-accent text-white">
              <Sparkles className="h-5 w-5" aria-hidden="true" />
            </div>
            <span className="font-heading text-xl font-bold text-white">
              Ignite<span className="text-accent">Stock</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-8 lg:flex" aria-label="Section navigation">
            {[
              { href: '#problem', label: 'The Problem' },
              { href: '#solution', label: 'Solution' },
              { href: '#features', label: 'Features' },
              { href: '#how-it-works', label: 'How It Works' },
              { href: '#evidence-engine', label: 'Evidence Engine' },
            ].map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-[0.25rem] text-sm font-bold text-secondary-foreground transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <Link to="/market">
                <Button variant="default" size="sm">
                  Open Platform
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="default" size="sm">
                    Get Started
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b border-border bg-secondary pt-16 pb-20 md:pt-24 md:pb-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-[0.25rem] border border-border bg-primary px-3 py-1.5 text-sm font-bold text-accent">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              <span>Evidence-First Equity Investigation Platform</span>
            </div>

            <h1 className="mt-6 font-heading text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
              Investigate what moved.{' '}
              <span className="text-accent">Understand why.</span>{' '}
              Follow the evidence.
            </h1>

            <p className="mt-6 text-base text-secondary-foreground leading-relaxed sm:text-lg">
              IgniteStock bridges deterministic Indonesian Stock Exchange (IDX) data with a multi-node LangGraph investigation pipeline. Uncover true price drivers, cross-examine corporate disclosures, and evaluate calibrated evidence without financial hallucinations.
            </p>

            <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
              <Link to={primaryHref}>
                <Button variant="default" size="lg" className="w-full sm:w-auto">
                  <Bot className="h-5 w-5" aria-hidden="true" />
                  Start an Investigation
                </Button>
              </Link>
              <a href="#evidence-engine" className="w-full sm:w-auto">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                  Explore Evidence Engine
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </a>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-6 text-sm text-secondary-foreground">
              {[
                'Deterministic Math (No LLM Drift)',
                'Sectors API V2 Real Data',
                'Tri-State Evidence Classification',
              ].map((item) => (
                <span key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success" aria-hidden="true" />
                  {item}
                </span>
              ))}
            </div>
          </div>

          {/* Product showcase */}
          <div className="mt-14 rounded-[0.25rem] border border-border bg-primary p-4 sm:p-6">
            <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5" aria-hidden="true">
                  <span className="h-3 w-3 rounded-[0.25rem] bg-border" />
                  <span className="h-3 w-3 rounded-[0.25rem] bg-border" />
                  <span className="h-3 w-3 rounded-[0.25rem] bg-border" />
                </div>
                <span className="font-mono text-xs text-secondary-foreground">
                  agent://investigate/bbri/target-date=2026-03-15
                </span>
              </div>
              <Badge variant="secondary" className="font-mono">
                LangGraph State Machine: ACTIVE
              </Badge>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-12">
              {/* Pipeline */}
              <div className="flex flex-col gap-4 lg:col-span-4">
                <div className="rounded-[0.25rem] border border-border bg-secondary p-4">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-bold text-accent">Active query</span>
                    <span className="font-mono text-xs text-secondary-foreground">IDX: BBRI</span>
                  </div>
                  <p className="text-base font-bold text-white">
                    &ldquo;Why did BBRI surge +4.8% while the banking index moved only +0.9%?&rdquo;
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">Price Shock &amp; Sector Divergence</Badge>
                    <Badge variant="outline">Benchmark: IHSG</Badge>
                  </div>
                </div>

                <div className="rounded-[0.25rem] border border-border bg-secondary p-4">
                  <h4 className="mb-3 flex items-center gap-2 font-heading text-sm font-bold text-white">
                    <GitBranch className="h-4 w-4 text-accent" aria-hidden="true" />
                    Autonomous Investigation Nodes
                  </h4>
                  <div className="space-y-2 text-sm">
                    {[
                      { n: '1. detect_intent', status: 'UNUSUAL_VOLUME' },
                      { n: '2. plan_investigation', status: '7 TOOLS PLANNED' },
                      { n: '3. execute_tools', status: 'SECTORS API V2' },
                    ].map((node) => (
                      <div
                        key={node.n}
                        className="flex items-center justify-between rounded-[0.25rem] border border-border bg-primary p-2.5 text-white"
                      >
                        <span className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-success" aria-hidden="true" />
                          {node.n}
                        </span>
                        <span className="font-mono text-xs text-secondary-foreground">
                          {node.status}
                        </span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between rounded-[0.25rem] border border-accent bg-accent/10 p-2.5 text-white">
                      <span className="flex items-center gap-2">
                        <Cpu className="h-4 w-4 text-accent" aria-hidden="true" />
                        4. process_evidence
                      </span>
                      <span className="font-mono text-xs text-accent">TRI-STATE EVAL</span>
                    </div>
                    <div className="flex items-center justify-between rounded-[0.25rem] border border-border bg-primary p-2.5 text-secondary-foreground">
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-border" aria-hidden="true" />
                        5. generate_response
                      </span>
                      <span className="font-mono text-xs">SYNTHESIS</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Evidence matrix */}
              <div className="lg:col-span-8">
                <div className="rounded-[0.25rem] border border-border bg-secondary p-4">
                  <div className="mb-4 flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <span className="font-heading text-base font-bold text-white">
                        Correlated Evidence Matrix
                      </span>
                      <p className="text-sm text-secondary-foreground">
                        Weighted against movement hypothesis • Overall confidence:{' '}
                        <span className="font-bold text-success">HIGH</span>
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="supporting">2 Supporting</Badge>
                      <Badge variant="contradictory">1 Contradictory</Badge>
                      <Badge variant="neutral">1 Neutral</Badge>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {evidenceItems.slice(0, 3).map((item) => {
                      const Icon = item.icon;
                      const tone =
                        item.kind === 'supporting'
                          ? { border: 'border-success/40', bg: 'bg-success/5', text: 'text-success' }
                          : { border: 'border-danger/40', bg: 'bg-danger/5', text: 'text-danger' };
                      return (
                        <div
                          key={item.title}
                          className={`rounded-[0.25rem] border ${tone.border} ${tone.bg} p-4`}
                        >
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div className="flex items-start gap-2">
                              <Icon className={`h-4 w-4 shrink-0 mt-0.5 ${tone.text}`} aria-hidden="true" />
                              <span className="text-sm font-bold text-white">{item.title}</span>
                            </div>
                            <Badge variant={item.kind}>{item.badge}</Badge>
                          </div>
                          <p className="mt-2 pl-6 text-sm text-secondary-foreground leading-relaxed">
                            {item.body}
                          </p>
                          <div className="mt-2 flex flex-wrap items-center gap-4 pl-6 font-mono text-xs text-secondary-foreground">
                            <span>{item.source}</span>
                            <span>{item.type}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section id="problem" className="border-b border-border bg-primary py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <span className="text-sm font-bold text-accent">
              The Reality of IDX Market Intelligence
            </span>
            <h2 className="mt-3 font-heading text-3xl font-bold text-white sm:text-4xl">
              Why Traditional Stock Analysis Fails on the IDX
            </h2>
            <p className="mt-4 text-base text-secondary-foreground leading-relaxed">
              When a stock suddenly surges or collapses on the Indonesia Stock Exchange, investors are left drowning in speculative Telegram groups, delayed disclosures, and generic AI hallucinations.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: TrendingDown,
                title: 'Unsubstantiated Rumors',
                desc: 'Market commentary is dominated by anonymous chat groups and hype, leading retail investors into liquidity traps.',
                foot: 'Lacks primary source verification and audited IDX disclosure references.',
              },
              {
                icon: Database,
                title: 'Fragmented Data Silos',
                desc: 'Price series, corporate action letters, financial statements, and news releases live in separate, disconnected portals.',
                foot: 'Hours spent manually compiling reports before reaching a coherent thesis.',
              },
              {
                icon: Bot,
                title: 'LLM Hallucinations',
                desc: 'Standard ChatGPT-style models invent historical earnings figures, fake P/E multiples, and generate fabricated corporate events.',
                foot: 'Dangerous for capital allocation when precision is non-negotiable.',
              },
              {
                icon: BarChart3,
                title: 'Context Blindness',
                desc: 'A +3% move is meaningless without knowing whether the subsector jumped +5%, or how much the ticker influenced the composite index.',
                foot: 'Fails to calculate relative performance and weighted index contributions.',
              },
            ].map((problem) => {
              const Icon = problem.icon;
              return (
                <Card key={problem.title} className="border-border bg-surface-card">
                  <CardHeader>
                    <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-[0.25rem] border border-border bg-secondary text-danger">
                      <Icon className="h-6 w-6" aria-hidden="true" />
                    </div>
                    <CardTitle className="text-xl">{problem.title}</CardTitle>
                    <CardDescription>{problem.desc}</CardDescription>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    {problem.foot}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Solution */}
      <section id="solution" className="border-b border-border bg-secondary py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
            <div className="space-y-6 lg:col-span-6">
              <div className="inline-flex items-center rounded-[0.25rem] bg-accent/10 px-3 py-1 text-sm font-bold text-accent">
                The IgniteStock Solution
              </div>
              <h2 className="font-heading text-3xl font-bold leading-tight text-white sm:text-4xl">
                Deterministic Accuracy Grounded in Real Market Evidence
              </h2>
              <p className="text-base text-secondary-foreground leading-relaxed">
                IgniteStock replaces speculative guesswork with a strict, verifiable research architecture. We separate mathematical truth from reasoning: all metrics are calculated deterministically using decimal math, while autonomous agents evaluate drivers against authentic market evidence.
              </p>

              <div className="space-y-5 pt-2">
                {[
                  {
                    icon: Scale,
                    title: 'Strict No-Hallucination Policy',
                    body: 'Returns, relative sector spreads, and estimated market cap share weights are calculated with Python Decimal precision—never generated by an LLM.',
                  },
                  {
                    icon: Network,
                    title: 'Dynamic 7-Tool Agent Architecture',
                    body: 'Our LangGraph state machine autonomously triggers specialized tools across stock prices, market context, sector trends, peer movements, news, filings, and financials.',
                  },
                  {
                    icon: FileCheck,
                    title: 'Tri-State Evidence Evaluation',
                    body: 'Findings are classified as Supporting, Contradictory, or Neutral with explicit confidence weighting so you see the complete picture.',
                  },
                ].map((point) => {
                  const Icon = point.icon;
                  return (
                    <div key={point.title} className="flex items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.25rem] border border-border bg-primary text-accent">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </div>
                      <div>
                        <h4 className="font-heading text-base font-bold text-white">{point.title}</h4>
                        <p className="mt-1 text-sm text-secondary-foreground leading-relaxed">
                          {point.body}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Architecture */}
            <div className="lg:col-span-6">
              <div className="rounded-[0.25rem] border border-border bg-surface-card p-6">
                <div className="mb-4 flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
                  <h3 className="flex items-center gap-2 font-heading text-base font-bold text-white">
                    <Cpu className="h-4 w-4 text-accent" aria-hidden="true" />
                    IgniteStock System Architecture
                  </h3>
                  <Badge variant="outline" className="font-mono">
                    FastAPI + LangGraph + Sectors V2
                  </Badge>
                </div>

                <div className="space-y-3 font-mono text-sm">
                  {[
                    {
                      label: 'CLIENT LAYER:',
                      value: 'React 19 + TypeScript + Redux + Tailwind CSS',
                      note: 'Typed API client, reactive store, and event-driven SSE streaming.',
                      tone: 'text-secondary-foreground',
                    },
                    {
                      label: 'AGENTIC WORKFLOW LAYER:',
                      value: 'LangGraph 5-Node StateGraph',
                      note: 'Intent Parsing → Tool Planning → Tool Execution → Evidence Processing → Synthesized Reasoning.',
                      tone: 'text-accent',
                    },
                    {
                      label: 'DETERMINISTIC DATA CORE:',
                      value: 'Sectors Financial API V2 Integration',
                      note: 'Bounded date intervals, process-local TTL cache, and Decimal math calculations.',
                      tone: 'text-success',
                    },
                  ].map((layer) => (
                    <div key={layer.label} className="rounded-[0.25rem] border border-border bg-secondary p-3">
                      <span className={`block text-xs font-bold ${layer.tone}`}>{layer.label}</span>
                      <span className="font-bold text-white">{layer.value}</span>
                      <p className="mt-1 text-xs text-secondary-foreground">{layer.note}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-b border-border bg-primary py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <span className="text-sm font-bold text-accent">Platform Capabilities</span>
            <h2 className="mt-3 font-heading text-3xl font-bold text-white sm:text-4xl">
              Built Specifically for the Complexity of the IDX
            </h2>
            <p className="mt-4 text-base text-secondary-foreground leading-relaxed">
              Every feature is built around the fundamental principle: explain what moved, identify why, and substantiate every claim with auditable evidence.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Bot,
                title: 'AI Investigation Agent',
                desc: 'Multi-turn conversational reasoning supporting dynamic queries like "Was this sector-wide?", "Compare with BMRI", and "Show me filings".',
                points: ['Stateful conversation memory', 'Server-Sent Events (SSE) streaming'],
              },
              {
                icon: Scale,
                title: 'Tri-State Evidence Matrix',
                desc: 'Classifies all discovered signals into Supporting, Contradictory, or Neutral evidence items with impact and confidence ratings.',
                points: ['Calibrated confidence levels', 'Explicit contradictory evidence alerts'],
              },
              {
                icon: BarChart3,
                title: 'Deterministic Market Impact',
                desc: 'Computes index returns, subsector benchmarks, relative performance, and estimated market cap share weights deterministically.',
                points: ['Exact stock contribution calculations', 'Zero LLM mathematical estimation'],
              },
              {
                icon: Database,
                title: '7 Sectors API Tools',
                desc: 'Integrates real-time price history, sector context, peer comparisons, company news, corporate filings, and quarterly financials.',
                points: ['Real IDX corporate disclosure retrieval', 'Normalized subsector classification'],
              },
              {
                icon: Layers,
                title: 'Ranked Driver Identification',
                desc: 'Isolates and ranks the primary drivers behind any price movement, categorized across earnings, macro, sector, or corporate action.',
                points: ['Impact severity: Critical to Negligible', 'Cross-linked to supporting evidence items'],
              },
              {
                icon: FileText,
                title: 'Auditable Source Lineage',
                desc: 'Every insight links back to source references and exact observation timestamps, creating a transparent institutional research audit trail.',
                points: ['Direct source citation on every finding', 'Full database persistence & history'],
              },
            ].map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.title} className="border-border bg-surface-card">
                  <CardHeader>
                    <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-[0.25rem] border border-border bg-secondary text-accent">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                    <CardDescription>{feature.desc}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm text-secondary-foreground">
                    {feature.points.map((point) => (
                      <div key={point} className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-success" aria-hidden="true" />
                        <span>{point}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="border-b border-border bg-secondary py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <span className="text-sm font-bold text-accent">The Workflow</span>
            <h2 className="mt-3 font-heading text-3xl font-bold text-white sm:text-4xl">
              How an Investigation Unfolds
            </h2>
            <p className="mt-4 text-base text-secondary-foreground leading-relaxed">
              From an initial market anomaly to an auditable, evidence-backed conclusion in four systematic stages.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                n: '1',
                title: 'Detect Intent & Anomaly',
                body: 'Submit a ticker, specific target date, or conversational prompt. The agent classifies intent: volume spike, price shock, earnings surprise, or sector rotation.',
                fn: 'detect_intent()',
              },
              {
                n: '2',
                title: 'Autonomous Tool Planning',
                body: 'The agent builds a dynamic plan selecting required Sectors API endpoints: stock daily history, subsector benchmarks, peer performance, filings, and news.',
                fn: 'plan_investigation()',
              },
              {
                n: '3',
                title: 'Deterministic Correlation',
                body: 'The backend executes queries and computes relative performance, index returns, and contribution metrics using exact Decimal arithmetic.',
                fn: 'execute_tools()',
              },
              {
                n: '4',
                title: 'Evidence Synthesis',
                body: 'Discovered items are calibrated as Supporting, Contradictory, or Neutral. Primary drivers are ranked by impact and presented in an enriched report.',
                fn: 'process_evidence()',
              },
            ].map((step) => (
              <div
                key={step.n}
                className="flex flex-col justify-between rounded-[0.25rem] border border-border bg-surface-card p-6"
              >
                <div>
                  <div className="mb-4 flex h-8 w-8 items-center justify-center rounded-[0.25rem] bg-accent font-heading text-sm font-bold text-white">
                    {step.n}
                  </div>
                  <h3 className="mb-2 font-heading text-xl font-bold text-white">{step.title}</h3>
                  <p className="text-sm text-secondary-foreground leading-relaxed">{step.body}</p>
                </div>
                <div className="mt-4 border-t border-border pt-3 font-mono text-xs text-accent">
                  {step.fn}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Evidence engine */}
      <section id="evidence-engine" className="border-b border-border bg-primary py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <span className="text-sm font-bold text-accent">The Evidence-First Methodology</span>
            <h2 className="mt-3 font-heading text-3xl font-bold text-white sm:text-4xl">
              Tri-State Evidence: Why Dissenting Data Matters
            </h2>
            <p className="mt-4 text-base text-secondary-foreground leading-relaxed">
              Most platforms confirm whatever narrative you feed them. IgniteStock actively searches for contradictory signals—ensuring you never fall for confirmation bias.
            </p>
          </div>

          <div className="mt-12 rounded-[0.25rem] border border-border bg-surface-card p-6">
            <div className="flex flex-col gap-4 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="flex items-center gap-2 font-heading text-xl font-bold text-white">
                  <FileCheck className="h-5 w-5 text-accent" aria-hidden="true" />
                  Sample Investigation: ASII (Astra International)
                </h3>
                <p className="mt-1 text-sm text-secondary-foreground">
                  Target event: Automotive segment volume rebound (+3.8% intraday move)
                </p>
              </div>

              <div className="inline-flex flex-wrap rounded-[0.25rem] border border-border bg-secondary p-1">
                {(
                  [
                    { label: 'All', value: 'all' },
                    { label: 'Supporting', value: 'supporting' },
                    { label: 'Contradictory', value: 'contradictory' },
                    { label: 'Neutral', value: 'neutral' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => setActiveTab(tab.value)}
                    aria-pressed={activeTab === tab.value}
                    className={`rounded-[0.25rem] px-3 py-2 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                      activeTab === tab.value
                        ? 'bg-surface-hover text-white'
                        : 'text-muted-foreground hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {visibleEvidence.map((item) => {
                const Icon = item.icon;
                const tone =
                  item.kind === 'supporting'
                    ? { border: 'border-success/40', bg: 'bg-success/5', text: 'text-success' }
                    : item.kind === 'contradictory'
                      ? { border: 'border-danger/40', bg: 'bg-danger/5', text: 'text-danger' }
                      : { border: 'border-warning/40', bg: 'bg-warning/5', text: 'text-warning' };
                return (
                  <div key={item.title} className={`rounded-[0.25rem] border ${tone.border} ${tone.bg} p-4`}>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex items-start gap-2">
                        <Icon className={`h-4 w-4 shrink-0 mt-0.5 ${tone.text}`} aria-hidden="true" />
                        <span className="text-sm font-bold text-white">{item.title}</span>
                      </div>
                      <Badge variant={item.kind}>{item.badge}</Badge>
                    </div>
                    <p className="mt-2 pl-6 text-sm text-secondary-foreground leading-relaxed">
                      {item.body}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-4 pl-6 font-mono text-xs text-secondary-foreground">
                      <span>{item.source}</span>
                      <span>{item.type}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section id="cta" className="border-b border-border bg-secondary py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 rounded-[0.25rem] border border-border bg-primary px-3 py-1 text-sm font-bold text-accent">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            <span>Ready for Rigorous Equity Intelligence</span>
          </div>

          <h2 className="mt-6 font-heading text-3xl font-bold leading-tight text-white sm:text-4xl">
            Stop Guessing IDX Movements.{' '}
            <span className="text-accent">Follow the Evidence.</span>
          </h2>

          <p className="mt-6 max-w-2xl text-base text-secondary-foreground leading-relaxed sm:text-lg">
            Experience the power of deterministic equity calculations paired with an autonomous LangGraph investigation agent. Uncover what really moved Indonesian stocks.
          </p>

          <div className="mt-10 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            <Link to={primaryHref} className="w-full sm:w-auto">
              <Button variant="default" size="lg" className="w-full sm:w-auto">
                <Bot className="h-5 w-5" aria-hidden="true" />
                Launch Investigation Console
              </Button>
            </Link>
            <a href="#how-it-works" className="w-full sm:w-auto">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                Review Methodology
              </Button>
            </a>
          </div>

          <div className="mt-10 max-w-xl border-t border-border pt-6 text-sm text-muted-foreground leading-relaxed">
            <span className="font-bold text-secondary-foreground">Data Integrity Guarantee:</span>{' '}
            IgniteStock integrates with Sectors Financial API. All calculations are executed with exact decimal mathematics. No fabricated or simulated market data is used.
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-secondary-dark py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-[0.25rem] bg-accent text-white">
                <Sparkles className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <span className="font-heading text-lg font-bold text-white">
                  Ignite<span className="text-accent">Stock</span>
                </span>
                <p className="text-sm text-muted-foreground">
                  Evidence-driven equity investigation for the Indonesian Stock Exchange.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6 font-mono text-xs text-secondary-foreground">
              <span>API: /api/agent/chat</span>
              <span>API: /api/investigations/analyze</span>
              <span>API: /api/market/overview</span>
            </div>

            <div className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} IgniteStock. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
