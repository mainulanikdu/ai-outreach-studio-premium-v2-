import { useEffect, useMemo, useState } from 'react';
import {
  Play,
  ArrowRight,
  Sparkles,
  Activity,
  Cpu,
  ShieldCheck,
  Users,
  Layers,
  Globe,
  ChevronDown,
  Copy,
  Check,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { OutreachAreaChart } from '../components/charts/OutreachCharts';
import { SpotlightCard } from '../components/ui/SpotlightCard';
import { StatusText, formatRelativeTime } from '../components/ui/StatusIndicator';
import type {
  ActivityLog,
  AnalyticsSummary,
  BackgroundJob,
  BrowserSession,
  Campaign,
  NavSection,
  SystemHealthSnapshot,
} from '../types/outreach';

interface DashboardViewProps {
  analytics: AnalyticsSummary;
  campaigns: Campaign[];
  sessions: BrowserSession[];
  jobs: BackgroundJob[];
  activityLogs: ActivityLog[];
  systemHealth: SystemHealthSnapshot;
  aiMode: 'gemini' | 'mock';
  onRunDemo: () => void;
  onNavigate: (section: NavSection) => void;
}

function AnimatedNumber({
  value,
  suffix = '',
}: {
  value: number;
  suffix?: string;
}) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let rafId = 0;
    const duration = 650;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(value * eased));
      if (progress < 1) {
        rafId = requestAnimationFrame(tick);
      }
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [value]);

  return (
    <>
      {display.toLocaleString()}
      {suffix}
    </>
  );
}

function MiniSparkline({
  values,
  color,
}: {
  values: number[];
  color: string;
}) {
  if (values.length < 2) return null;
  const w = 96;
  const h = 28;
  const max = Math.max(1, ...values);
  const min = Math.min(...values);
  const span = Math.max(1, max - min);

  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - 3 - ((v - min) / span) * (h - 6);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const d = `M ${pts.join(' L ')}`;

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible shrink-0" aria-hidden="true">
      <path d={d} fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function DashboardView({
  analytics,
  campaigns,
  sessions,
  jobs,
  activityLogs,
  systemHealth,
  aiMode,
  onRunDemo,
  onNavigate,
}: DashboardViewProps) {
  const { kpis, series } = analytics;
  const [campaignFilter, setCampaignFilter] = useState<'All' | 'Active' | 'Paused'>('All');
  const [expandedCampaignId, setExpandedCampaignId] = useState<string | null>(null);
  const [logCategory, setLogCategory] = useState<string>('All');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [copiedLogId, setCopiedLogId] = useState<string | null>(null);

  const recentSeries = series.slice(-12);
  const replySpark = recentSeries.map((s) => s.repliesReceived);
  const accSpark = recentSeries.map((s) => s.connectionsAccepted);
  const sentSpark = recentSeries.map((s) => s.connectionsSent);

  const activeSessionsCount = sessions.filter((s) => s.status === 'Active').length;
  const rateLimitedCount = sessions.filter((s) => s.status === 'Rate Limited').length;
  const failedJobsCount = jobs.filter((j) => j.status === 'Failed').length;

  const filteredCampaigns = useMemo(() => {
    if (campaignFilter === 'All') return campaigns;
    return campaigns.filter((c) => c.status === campaignFilter);
  }, [campaigns, campaignFilter]);

  const logCategories = useMemo(() => {
    const cats = Array.from(new Set(activityLogs.map((l) => l.category)));
    return ['All', ...cats.slice(0, 4)];
  }, [activityLogs]);

  const filteredLogs = useMemo(() => {
    const list =
      logCategory === 'All'
        ? activityLogs
        : activityLogs.filter((l) => l.category === logCategory);
    return list.slice(0, 7);
  }, [activityLogs, logCategory]);

  const handleCopyLog = (log: ActivityLog) => {
    navigator.clipboard?.writeText(`[${log.category}] ${log.title} — ${log.detail}`);
    setCopiedLogId(log.id);
    window.setTimeout(() => setCopiedLogId(null), 1600);
  };

  const pipelineStages: {
    id: NavSection;
    label: string;
    metric: string;
    icon: typeof Users;
    accent: string;
  }[] = [
    {
      id: 'leads',
      label: 'Lead Intel',
      metric: `${kpis.totalLeads} prospects`,
      icon: Users,
      accent: 'text-blue-400',
    },
    {
      id: 'ai-research',
      label: 'AI Copy',
      metric: `${kpis.messagesGenerated} drafts`,
      icon: Sparkles,
      accent: 'text-indigo-400',
    },
    {
      id: 'job-queue',
      label: 'Job Queue',
      metric: `${kpis.runningJobs} active`,
      icon: Layers,
      accent: 'text-amber-400',
    },
    {
      id: 'browser-engine',
      label: 'Browser',
      metric: `${activeSessionsCount}/${sessions.length} live`,
      icon: Globe,
      accent: 'text-emerald-400',
    },
  ];

  const primaryKpis = [
    {
      label: 'Replies Received',
      numeric: kpis.repliesReceived,
      suffix: '',
      badge: `${kpis.positiveReplyRate}% positive`,
      badgeTone: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      sub: 'North-star conversion signal',
      spark: replySpark,
      sparkColor: '#10B981',
      spotlight: 'rgba(16, 185, 129, 0.16)',
      target: 'analytics' as NavSection,
    },
    {
      label: 'Accepted Connections',
      numeric: kpis.acceptedConnections,
      suffix: '',
      badge: `${kpis.acceptanceRate}% rate`,
      badgeTone: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
      sub: `${kpis.connectionRequests.toLocaleString()} sent (${analytics.rangeDays}d)`,
      spark: accSpark,
      sparkColor: '#3B82F6',
      spotlight: 'rgba(59, 130, 246, 0.16)',
      target: 'campaigns' as NavSection,
    },
    {
      label: 'Total Leads',
      numeric: kpis.totalLeads,
      suffix: '',
      badge: `${kpis.activeCampaigns} active`,
      badgeTone: 'text-indigo-300 bg-indigo-500/10 border-indigo-500/20',
      sub: `${campaigns.length} campaigns configured`,
      spark: sentSpark,
      sparkColor: '#818CF8',
      spotlight: 'rgba(129, 140, 248, 0.16)',
      target: 'leads' as NavSection,
    },
    {
      label: 'Automation Success',
      numeric: Math.round(kpis.automationSuccessRate),
      suffix: '%',
      badge: `${kpis.failedExecutions} failed`,
      badgeTone:
        kpis.failedExecutions > 0
          ? 'text-amber-300 bg-amber-500/10 border-amber-500/20'
          : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      sub: `${kpis.completedJobs} completed · ${kpis.runningJobs} running`,
      spark: accSpark,
      sparkColor: '#F59E0B',
      spotlight: 'rgba(245, 158, 11, 0.14)',
      target: 'execution-history' as NavSection,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Interactive Hero Command Deck + Live 4-Stage Pipeline */}
      <SpotlightCard className="hero-obsidian-sheen border-white/[0.1] p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/[0.05] border border-white/[0.09] text-[11px] font-mono uppercase tracking-[0.08em] text-blue-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Autonomous Outreach Engine · {aiMode === 'gemini' ? 'Gemini AI' : 'Sandbox AI'}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#F4F5F7] font-display tracking-[-0.025em]">
              Orchestrate AI research, copywriting &amp; browser dispatch
            </h2>
            <p className="text-[13px] text-[#9CA3AF] leading-relaxed">
              Launch the interactive 11-step pipeline to watch prospect intelligence, personalized messaging, Redis worker queuing, and live browser execution run end-to-end.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => onNavigate('campaigns')}
              className="h-10 rounded-xl border border-white/[0.12] bg-white/[0.04] hover:bg-white/[0.09] hover:border-white/[0.2] px-4 text-xs font-medium text-[#F4F5F7] transition-all whitespace-nowrap cursor-pointer"
            >
              Inspect Workflows
            </button>
            <button
              type="button"
              onClick={onRunDemo}
              className="btn-accent inline-flex items-center gap-2 h-10 rounded-xl px-5 text-xs font-semibold text-white whitespace-nowrap cursor-pointer"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>Run Demo Automation</span>
            </button>
          </div>
        </div>

        {/* Clickable Live 4-Stage Pipeline Bar */}
        <div className="mt-5 pt-5 border-t border-white/[0.08] grid grid-cols-2 lg:grid-cols-4 gap-3">
          {pipelineStages.map((stage, idx) => {
            const Icon = stage.icon;
            return (
              <button
                key={stage.id}
                type="button"
                onClick={() => onNavigate(stage.id)}
                className="group relative flex items-center justify-between gap-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.07] hover:border-white/[0.16] px-3.5 py-2.5 text-left transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="h-7 w-7 rounded-lg bg-[#0B0D13] border border-white/[0.08] flex items-center justify-center shrink-0">
                    <Icon className={`h-3.5 w-3.5 ${stage.accent}`} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-[#F4F5F7] truncate">
                      {idx + 1}. {stage.label}
                    </p>
                    <p className="text-[11px] font-mono text-[#9CA3AF] truncate">{stage.metric}</p>
                  </div>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-[#6B7280] group-hover:text-[#F4F5F7] group-hover:translate-x-0.5 transition-all shrink-0" />
              </button>
            );
          })}
        </div>
      </SpotlightCard>

      {/* Primary KPI Grid — Spotlight Cards + Animated Counters + Sparklines */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {primaryKpis.map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: i * 0.05 }}
          >
            <SpotlightCard
              spotlightColor={m.spotlight}
              onClick={() => onNavigate(m.target)}
              className="p-5 cursor-pointer group h-full"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-[#9CA3AF] group-hover:text-[#D1D5DB] transition-colors">
                  {m.label}
                </p>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-md border font-mono text-[10px] font-medium tabular-nums ${m.badgeTone}`}
                >
                  {m.badge}
                </span>
              </div>

              <div className="mt-3.5 flex items-end justify-between gap-3">
                <p
                  data-metric
                  className="text-3xl font-bold text-[#F4F5F7] font-mono tabular-nums tracking-[-0.03em] leading-none"
                >
                  <AnimatedNumber value={m.numeric} suffix={m.suffix} />
                </p>
                <MiniSparkline values={m.spark} color={m.sparkColor} />
              </div>

              <p className="mt-3 text-[11px] text-[#6B7280] flex items-center justify-between">
                <span>{m.sub}</span>
                <ArrowRight className="h-3 w-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-[#9CA3AF]" />
              </p>
            </SpotlightCard>
          </motion.div>
        ))}
      </section>

      {/* Main Interactive Chart + Live Operations Pulse */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
        <div className="xl:col-span-8 surface-panel p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-4 mb-5">
            <div>
              <h3 className="text-sm font-semibold text-[#F4F5F7] font-display">
                Outreach Velocity
              </h3>
              <p className="text-xs text-[#6B7280] mt-0.5">
                Click legend pills to isolate series or switch between Area and Bar views
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('analytics')}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors cursor-pointer whitespace-nowrap"
            >
              <span>Full Analytics</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
          <OutreachAreaChart data={analytics.series} height={252} />
        </div>

        <div className="xl:col-span-4 surface-panel p-5 flex flex-col justify-between space-y-5">
          {/* Worker Nodes */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.08em] text-[#9CA3AF]">
                <Cpu className="h-3.5 w-3.5 text-blue-400" />
                <span>Worker Nodes</span>
              </h3>
              <button
                type="button"
                onClick={() => onNavigate('job-queue')}
                className="text-xs text-blue-400 hover:text-blue-300 cursor-pointer"
              >
                Queue
              </button>
            </div>
            <div className="space-y-2 text-xs">
              {[
                { name: 'worker-ai-01', latency: '42ms', status: 'Active' },
                { name: 'pw-worker-01', latency: '118ms', status: 'Active' },
                {
                  name: 'queue-scheduler-01',
                  latency: failedJobsCount > 0 ? '290ms' : '24ms',
                  status: failedJobsCount > 0 ? 'Warning' : 'Active',
                },
              ].map((node) => (
                <div
                  key={node.name}
                  className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/[0.025] border border-white/[0.06]"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                    <span className="font-mono text-[#E5E7EB] truncate">{node.name}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono text-[10px] text-[#6B7280] tabular-nums">
                      {node.latency}
                    </span>
                    <StatusText status={node.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Browser Sessions with Quota Bars */}
          <div className="pt-4 border-t border-white/[0.07]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.08em] text-[#9CA3AF]">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                <span>Browser Sessions</span>
              </h3>
              <button
                type="button"
                onClick={() => onNavigate('sessions')}
                className="text-xs text-blue-400 hover:text-blue-300 cursor-pointer"
              >
                Manage ({sessions.length})
              </button>
            </div>
            <div className="space-y-3 text-xs">
              {sessions.slice(0, 3).map((s) => {
                const utilPct = Math.min(
                  100,
                  Math.round((s.dailyActionCount / Math.max(1, s.dailyActionLimit)) * 100)
                );
                return (
                  <div key={s.id} className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[#E5E7EB] font-medium truncate">{s.accountLabel}</span>
                      <StatusText status={s.status} />
                    </div>
                    <div className="flex items-center gap-2.5">
                      <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${utilPct}%` }}
                          transition={{ duration: 0.6, ease: 'easeOut' }}
                          className={`h-full rounded-full ${
                            utilPct >= 90 ? 'bg-amber-400' : 'bg-blue-500'
                          }`}
                        />
                      </div>
                      <span className="font-mono text-[10px] text-[#6B7280] tabular-nums shrink-0">
                        {s.dailyActionCount}/{s.dailyActionLimit}
                      </span>
                    </div>
                  </div>
                );
              })}
              <p className="text-[11px] font-mono text-[#6B7280] pt-0.5">
                {activeSessionsCount} active · {rateLimitedCount} rate limited
              </p>
            </div>
          </div>

          {/* AI Provider Telemetry */}
          <div className="pt-4 border-t border-white/[0.07]">
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.08em] text-[#9CA3AF]">
                <Activity className="h-3.5 w-3.5 text-indigo-400" />
                <span>AI Telemetry</span>
              </h3>
              <button
                type="button"
                onClick={() => onNavigate('system-health')}
                className="text-xs text-blue-400 hover:text-blue-300 cursor-pointer"
              >
                Inspect
              </button>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#9CA3AF]">Active Provider</span>
                <span className="font-mono text-[#F4F5F7]">
                  {systemHealth.effectiveAiMode === 'gemini' ? 'Gemini AI' : 'Mock AI'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#9CA3AF]">Status</span>
                <StatusText status={systemHealth.aiTelemetry.lastStatus} />
              </div>
              <p className="text-[11px] text-[#6B7280] font-mono tabular-nums pt-0.5">
                {systemHealth.aiTelemetry.totalRequests} reqs · {systemHealth.aiTelemetry.retryCountTotal} retries · {systemHealth.aiTelemetry.fallbackCount} fallbacks
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Split: Filterable & Expandable Campaigns + Filterable Activity Feed */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Campaigns */}
        <div className="xl:col-span-7 surface-panel overflow-hidden">
          <div className="px-6 py-4 border-b border-white/[0.07] flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-[#F4F5F7] font-display">
                Campaign Performance
              </h3>
              <p className="text-[11px] text-[#6B7280] mt-0.5">
                Click any campaign row to inspect its conversion funnel
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="inline-flex items-center p-0.5 rounded-lg bg-white/[0.04] border border-white/[0.07]">
                {(['All', 'Active', 'Paused'] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setCampaignFilter(tab)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                      campaignFilter === tab
                        ? 'bg-white/[0.1] text-[#F4F5F7]'
                        : 'text-[#6B7280] hover:text-[#D1D5DB]'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => onNavigate('campaigns')}
                className="text-xs font-medium text-blue-400 hover:text-blue-300 cursor-pointer ml-1"
              >
                Builder
              </button>
            </div>
          </div>

          <div className="divide-y divide-white/[0.06]">
            {filteredCampaigns.map((cmp) => {
              const isExpanded = expandedCampaignId === cmp.id;
              const accRate = Math.round(
                (cmp.stats.accepted / Math.max(1, cmp.stats.leadsEnrolled)) * 100
              );
              const replyRate = Math.round(
                (cmp.stats.replies / Math.max(1, cmp.stats.accepted)) * 100
              );

              return (
                <div key={cmp.id} className="transition-colors hover:bg-white/[0.02]">
                  <button
                    type="button"
                    onClick={() => setExpandedCampaignId(isExpanded ? null : cmp.id)}
                    className="w-full px-6 py-3.5 flex items-center justify-between gap-4 text-left cursor-pointer"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2.5">
                        <p className="text-xs font-semibold text-[#F4F5F7] truncate">{cmp.name}</p>
                        <StatusText status={cmp.status} />
                      </div>
                      <p className="text-[11px] text-[#6B7280] truncate mt-0.5">
                        {cmp.targetPersona}
                      </p>
                    </div>

                    <div className="flex items-center gap-5 shrink-0 font-mono text-xs tabular-nums">
                      <div className="text-right hidden sm:block">
                        <span className="block text-[#D1D5DB]">{cmp.stats.leadsEnrolled}</span>
                        <span className="text-[10px] text-[#6B7280]">enrolled</span>
                      </div>
                      <div className="text-right">
                        <span className="block text-emerald-400 font-semibold">
                          {cmp.stats.replies}
                        </span>
                        <span className="text-[10px] text-[#6B7280]">replies</span>
                      </div>
                      <ChevronDown
                        className={`h-4 w-4 text-[#6B7280] transition-transform duration-200 ${
                          isExpanded ? 'rotate-180 text-[#F4F5F7]' : ''
                        }`}
                      />
                    </div>
                  </button>

                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-4 pt-1 space-y-2.5 bg-white/[0.015] border-t border-white/[0.05]">
                          <div className="grid grid-cols-3 gap-3 text-[11px] font-mono">
                            <div className="rounded-lg bg-[#0B0D13] border border-white/[0.06] p-2.5">
                              <span className="text-[#6B7280] block">Sent</span>
                              <span className="text-sm font-semibold text-blue-400">
                                {cmp.stats.connectionsSent}
                              </span>
                            </div>
                            <div className="rounded-lg bg-[#0B0D13] border border-white/[0.06] p-2.5">
                              <span className="text-[#6B7280] block">Acceptance</span>
                              <span className="text-sm font-semibold text-emerald-400">
                                {accRate}%
                              </span>
                            </div>
                            <div className="rounded-lg bg-[#0B0D13] border border-white/[0.06] p-2.5">
                              <span className="text-[#6B7280] block">Reply Conv.</span>
                              <span className="text-sm font-semibold text-amber-300">
                                {replyRate}%
                              </span>
                            </div>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden flex">
                            <div
                              className="h-full bg-blue-500"
                              style={{ width: `${Math.min(100, accRate)}%` }}
                            />
                            <div
                              className="h-full bg-emerald-400"
                              style={{ width: `${Math.min(100 - accRate, replyRate)}%` }}
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}

            {filteredCampaigns.length === 0 && (
              <p className="py-10 text-center text-xs text-[#6B7280]">
                No campaigns match the "{campaignFilter}" filter.
              </p>
            )}
          </div>
        </div>

        {/* Interactive Activity Feed */}
        <div className="xl:col-span-5 surface-panel overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-white/[0.07] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-[#F4F5F7] font-display">
                  Recent Activity Feed
                </h3>
                <p className="text-[11px] text-[#6B7280] mt-0.5">
                  Click any event to inspect or copy payload
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('activity-logs')}
                className="text-xs font-medium text-blue-400 hover:text-blue-300 cursor-pointer"
              >
                View All
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {logCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setLogCategory(cat)}
                  className={`px-2 py-0.5 rounded-md font-mono text-[10px] border transition-colors cursor-pointer ${
                    logCategory === cat
                      ? 'bg-white/[0.1] border-white/[0.18] text-[#F4F5F7]'
                      : 'bg-white/[0.02] border-white/[0.06] text-[#6B7280] hover:text-[#D1D5DB]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-white/[0.06] flex-1">
            {filteredLogs.map((log) => {
              const isOpen = expandedLogId === log.id;
              return (
                <div
                  key={log.id}
                  className="px-6 py-3 hover:bg-white/[0.02] transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedLogId(isOpen ? null : log.id)}
                    className="w-full flex items-start justify-between gap-4 text-left cursor-pointer"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-[#F4F5F7] truncate">{log.title}</p>
                      <p
                        className={`text-[11px] text-[#9CA3AF] mt-0.5 ${
                          isOpen ? '' : 'line-clamp-1'
                        }`}
                      >
                        {log.detail}
                      </p>
                    </div>
                    <div className="text-right shrink-0 space-y-1">
                      <span className="block text-[11px] font-mono text-[#6B7280] tabular-nums">
                        {formatRelativeTime(log.timestamp)}
                      </span>
                      <span className="inline-block px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.06] font-mono text-[10px] text-[#9CA3AF]">
                        {log.category}
                      </span>
                    </div>
                  </button>

                  {isOpen && (
                    <div className="mt-2.5 pt-2 border-t border-white/[0.05] flex items-center justify-between text-[11px]">
                      <span className="font-mono text-[#6B7280] truncate">{log.id}</span>
                      <button
                        type="button"
                        onClick={() => handleCopyLog(log)}
                        className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/[0.05] hover:bg-white/[0.1] text-[#D1D5DB] transition-colors cursor-pointer"
                      >
                        {copiedLogId === log.id ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
