import { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, Play, ArrowRight, Users, GitBranch, Sparkles } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { api } from './lib/api';
import { ToastProvider } from './components/ui/ToastProvider';
import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { DemoAutomationRunner } from './components/demo/DemoAutomationRunner';
import { DashboardView } from './views/DashboardView';
import { LeadsView } from './views/LeadsView';
import { AiResearchView } from './views/AiResearchView';
import { CampaignsView } from './views/CampaignsView';
import { BrowserEngineView } from './views/BrowserEngineView';
import { SessionsView } from './views/SessionsView';
import { JobQueueView } from './views/JobQueueView';
import { AiAgentView } from './views/AiAgentView';
import { AnalyticsView } from './views/AnalyticsView';
import { ExecutionHistoryView } from './views/ExecutionHistoryView';
import { SystemHealthView } from './views/SystemHealthView';
import { ActivityLogsView } from './views/ActivityLogsView';
import { SettingsView } from './views/SettingsView';
import type { BootstrapResponse, NavSection } from './types/outreach';

const COMMAND_VIEWS: { id: NavSection; label: string; group: string }[] = [
  { id: 'dashboard', label: 'Dashboard Overview', group: 'Workspace' },
  { id: 'leads', label: 'Lead Management', group: 'Workspace' },
  { id: 'ai-research', label: 'AI Research & Personalization', group: 'Workspace' },
  { id: 'campaigns', label: 'Campaign Builder', group: 'Workspace' },
  { id: 'browser-engine', label: 'Browser Automation Engine', group: 'Execution Engine' },
  { id: 'sessions', label: 'Session Management', group: 'Execution Engine' },
  { id: 'job-queue', label: 'Background Job Queue', group: 'Execution Engine' },
  { id: 'ai-agent', label: 'AI Agent Control Center', group: 'Execution Engine' },
  { id: 'analytics', label: 'Analytics & Reports', group: 'Observability' },
  { id: 'execution-history', label: 'Execution History', group: 'Observability' },
  { id: 'system-health', label: 'System Health & Observability', group: 'Observability' },
  { id: 'activity-logs', label: 'Activity Logs', group: 'Observability' },
  { id: 'settings', label: 'Settings & Integrations', group: 'Observability' },
];

interface PaletteAction {
  key: string;
  label: string;
  sub: string;
  kind: 'action' | 'view' | 'lead' | 'campaign';
  onRun: () => void;
}

function WorkspaceApp() {
  const [activeSection, setActiveSection] = useState<NavSection>('dashboard');
  const [rangeDays, setRangeDays] = useState<7 | 30 | 90>(30);
  const [data, setData] = useState<BootstrapResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [demoRunnerOpen, setDemoRunnerOpen] = useState(false);
  const [focusedLeadId, setFocusedLeadId] = useState<string | null>(null);
  const [commandOpen, setCommandOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState('');
  const [selectedCmdIdx, setSelectedCmdIdx] = useState(0);

  const loadWorkspace = useCallback(
    async (range: 7 | 30 | 90 = rangeDays) => {
      try {
        const res = await api.bootstrap(range);
        setData(res);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load workspace data.');
      } finally {
        setLoading(false);
      }
    },
    [rangeDays]
  );

  useEffect(() => {
    loadWorkspace(rangeDays);
  }, [loadWorkspace, rangeDays]);

  const handleOpenAiResearch = useCallback((leadId: string) => {
    setFocusedLeadId(leadId);
    setActiveSection('ai-research');
  }, []);

  const paletteResults = useMemo<PaletteAction[]>(() => {
    const q = commandQuery.trim().toLowerCase();
    const list: PaletteAction[] = [];

    if (!q || 'run demo automation pipeline'.includes(q)) {
      list.push({
        key: 'action-demo',
        label: 'Run Demo Automation Pipeline',
        sub: 'Execute 11-step interactive sandbox workflow',
        kind: 'action',
        onRun: () => {
          setCommandOpen(false);
          setDemoRunnerOpen(true);
        },
      });
    }

    for (const item of COMMAND_VIEWS) {
      if (!q || item.label.toLowerCase().includes(q) || item.group.toLowerCase().includes(q)) {
        list.push({
          key: `view-${item.id}`,
          label: item.label,
          sub: item.group,
          kind: 'view',
          onRun: () => {
            setActiveSection(item.id);
            setCommandOpen(false);
          },
        });
      }
    }

    if (data) {
      const matchedLeads = data.leads
        .filter(
          (l) =>
            !q ||
            l.name.toLowerCase().includes(q) ||
            l.company.toLowerCase().includes(q) ||
            l.jobTitle.toLowerCase().includes(q)
        )
        .slice(0, q ? 6 : 3);

      for (const lead of matchedLeads) {
        list.push({
          key: `lead-${lead.id}`,
          label: `${lead.name} — ${lead.company}`,
          sub: `Open AI Research · ${lead.jobTitle} · Score ${lead.leadScore}`,
          kind: 'lead',
          onRun: () => {
            handleOpenAiResearch(lead.id);
            setCommandOpen(false);
          },
        });
      }

      const matchedCampaigns = data.campaigns
        .filter((c) => !q || c.name.toLowerCase().includes(q) || c.targetPersona.toLowerCase().includes(q))
        .slice(0, q ? 4 : 2);

      for (const cmp of matchedCampaigns) {
        list.push({
          key: `cmp-${cmp.id}`,
          label: cmp.name,
          sub: `Campaign · ${cmp.status} · ${cmp.stats.leadsEnrolled} enrolled`,
          kind: 'campaign',
          onRun: () => {
            setActiveSection('campaigns');
            setCommandOpen(false);
          },
        });
      }
    }

    return list;
  }, [commandQuery, data, handleOpenAiResearch]);

  useEffect(() => {
    setSelectedCmdIdx(0);
  }, [commandQuery, commandOpen]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandOpen((prev) => !prev);
        setCommandQuery('');
        return;
      }
      if (!commandOpen) return;
      if (e.key === 'Escape') {
        setCommandOpen(false);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedCmdIdx((i) => Math.min(paletteResults.length - 1, i + 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedCmdIdx((i) => Math.max(0, i - 1));
      } else if (e.key === 'Enter' && paletteResults[selectedCmdIdx]) {
        e.preventDefault();
        paletteResults[selectedCmdIdx].onRun();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [commandOpen, paletteResults, selectedCmdIdx]);

  const handleChangeRange = async (nextRange: 7 | 30 | 90) => {
    setRangeDays(nextRange);
    try {
      const analytics = await api.getAnalytics(nextRange);
      setData((prev) => (prev ? { ...prev, analytics } : prev));
    } catch {
      await loadWorkspace(nextRange);
    }
  };

  if (loading && !data) {
    return (
      <div className="min-h-screen studio-canvas-bg flex">
        <div className="hidden lg:block w-[258px] border-r border-white/[0.075] bg-[#0A0C11] p-4 space-y-5">
          <div className="h-9 w-40 rounded-xl bg-white/[0.05] animate-pulse" />
          <div className="space-y-2 pt-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-8 rounded-xl bg-white/[0.03] animate-pulse" />
            ))}
          </div>
        </div>
        <div className="flex-1 p-6 space-y-6 max-w-[1440px] mx-auto">
          <div className="h-28 rounded-2xl bg-[#0E1016] border border-white/[0.07] animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-32 rounded-2xl bg-[#0E1016] border border-white/[0.07] animate-pulse"
              />
            ))}
          </div>
          <div className="h-72 rounded-2xl bg-[#0E1016] border border-white/[0.07] animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen studio-canvas-bg flex items-center justify-center p-6">
        <div className="max-w-md w-full surface-elevated p-6 text-center space-y-4">
          <div className="mx-auto h-10 w-10 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-sm font-semibold text-[#F4F5F7]">
              Unable to connect to Outreach Studio backend
            </h1>
            <p className="text-xs text-[#9CA3AF] leading-relaxed">
              {error || 'Unexpected workspace state.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              loadWorkspace(rangeDays);
            }}
            className="btn-accent inline-flex items-center justify-center h-9 rounded-xl px-4 text-xs font-semibold text-white cursor-pointer"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const pendingApprovalsCount = data.agentDecisions.filter((d) => d.status === 'Pending').length;
  const runningJobsCount = data.jobs.filter(
    (j) => j.status === 'Running' || j.status === 'Queued'
  ).length;
  const activeSessionsCount = data.sessions.filter((s) => s.status === 'Active').length;

  return (
    <div className="min-h-screen studio-canvas-bg text-[#F4F5F7] flex selection:bg-blue-500/30 selection:text-white">
      <Sidebar
        activeSection={activeSection}
        onSelect={setActiveSection}
        pendingApprovalsCount={pendingApprovalsCount}
        runningJobsCount={runningJobsCount}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        <TopBar
          activeSection={activeSection}
          aiMode={data.environment.aiMode}
          fallbackActive={
            data.systemHealth.aiTelemetry.providerPreference === 'gemini' &&
            data.systemHealth.aiTelemetry.lastStatus === 'Mock Mode'
          }
          onSelectSection={setActiveSection}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onRunDemoAutomation={() => setDemoRunnerOpen(true)}
          onOpenCommandPalette={() => {
            setCommandOpen(true);
            setCommandQuery('');
          }}
          pendingApprovalsCount={pendingApprovalsCount}
          runningJobsCount={runningJobsCount}
          activeSessionsCount={activeSessionsCount}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-7 max-w-[1440px] w-full mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            >
              {activeSection === 'dashboard' && (
                <DashboardView
                  analytics={data.analytics}
                  campaigns={data.campaigns}
                  sessions={data.sessions}
                  jobs={data.jobs}
                  activityLogs={data.activityLogs}
                  systemHealth={data.systemHealth}
                  aiMode={data.environment.aiMode}
                  onRunDemo={() => setDemoRunnerOpen(true)}
                  onNavigate={setActiveSection}
                />
              )}

              {activeSection === 'leads' && (
                <LeadsView
                  leads={data.leads}
                  campaigns={data.campaigns}
                  onRefresh={() => loadWorkspace(rangeDays)}
                  onOpenAiResearch={handleOpenAiResearch}
                />
              )}

              {activeSection === 'ai-research' && (
                <AiResearchView
                  leads={data.leads}
                  initialLeadId={focusedLeadId}
                  aiMode={data.environment.aiMode}
                  onRefresh={() => loadWorkspace(rangeDays)}
                  onNavigate={setActiveSection}
                />
              )}

              {activeSection === 'campaigns' && (
                <CampaignsView
                  campaigns={data.campaigns}
                  automationRuns={data.automationRuns}
                  onRefresh={() => loadWorkspace(rangeDays)}
                />
              )}

              {activeSection === 'browser-engine' && (
                <BrowserEngineView
                  executions={data.executions}
                  sessions={data.sessions}
                  leads={data.leads}
                  onRefresh={() => loadWorkspace(rangeDays)}
                />
              )}

              {activeSection === 'sessions' && (
                <SessionsView
                  sessions={data.sessions}
                  onRefresh={() => loadWorkspace(rangeDays)}
                />
              )}

              {activeSection === 'job-queue' && (
                <JobQueueView
                  jobs={data.jobs}
                  leads={data.leads}
                  onRefresh={() => loadWorkspace(rangeDays)}
                />
              )}

              {activeSection === 'ai-agent' && (
                <AiAgentView
                  decisions={data.agentDecisions}
                  leads={data.leads}
                  onRefresh={() => loadWorkspace(rangeDays)}
                />
              )}

              {activeSection === 'analytics' && (
                <AnalyticsView
                  analytics={data.analytics}
                  rangeDays={rangeDays}
                  onChangeRange={handleChangeRange}
                  campaigns={data.campaigns}
                  jobs={data.jobs}
                />
              )}

              {activeSection === 'execution-history' && (
                <ExecutionHistoryView
                  automationRuns={data.automationRuns}
                  jobs={data.jobs}
                  executions={data.executions}
                  onRefresh={() => loadWorkspace(rangeDays)}
                  onOpenManualDemo={() => setDemoRunnerOpen(true)}
                />
              )}

              {activeSection === 'system-health' && (
                <SystemHealthView
                  systemHealth={data.systemHealth}
                  automationRuns={data.automationRuns}
                  leads={data.leads}
                  onRefresh={() => loadWorkspace(rangeDays)}
                  onNavigate={setActiveSection}
                />
              )}

              {activeSection === 'activity-logs' && (
                <ActivityLogsView logs={data.activityLogs} />
              )}

              {activeSection === 'settings' && (
                <SettingsView
                  integrations={data.integrations}
                  postgresDdl={data.postgresDdl}
                  onRefresh={() => loadWorkspace(rangeDays)}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Supercharged Command Palette (Cmd+K) */}
      <AnimatePresence>
        {commandOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.14 }}
            className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] px-4"
            role="dialog"
            aria-modal="true"
            aria-label="Global command palette"
          >
            <div
              className="fixed inset-0 bg-black/75 backdrop-blur-md"
              onClick={() => setCommandOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: -8 }}
              transition={{ type: 'spring', stiffness: 460, damping: 34 }}
              className="relative z-10 w-full max-w-xl rounded-2xl bg-[#10131B]/95 backdrop-blur-xl border border-white/[0.14] shadow-2xl shadow-black/90 overflow-hidden"
            >
              <div className="flex items-center gap-3 px-4 h-13 border-b border-white/[0.08]">
                <Search className="h-4 w-4 text-[#9CA3AF] shrink-0" />
                <input
                  type="text"
                  autoFocus
                  value={commandQuery}
                  onChange={(e) => setCommandQuery(e.target.value)}
                  placeholder="Search views, leads, campaigns, or actions..."
                  className="flex-1 bg-transparent text-sm text-[#F4F5F7] placeholder:text-[#6B7280] focus:outline-none"
                />
                <kbd className="font-mono text-[10px] text-[#9CA3AF] bg-white/[0.06] border border-white/[0.1] rounded px-1.5 py-0.5">
                  ESC
                </kbd>
              </div>

              <div className="max-h-[360px] overflow-y-auto p-2 space-y-0.5">
                {paletteResults.map((item, idx) => {
                  const isSelected = idx === selectedCmdIdx;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onMouseEnter={() => setSelectedCmdIdx(idx)}
                      onClick={item.onRun}
                      className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-left transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-white/[0.09] text-[#F4F5F7]'
                          : 'text-[#D1D5DB] hover:bg-white/[0.05]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 border ${
                            item.kind === 'action'
                              ? 'bg-blue-500/15 border-blue-500/30 text-blue-400'
                              : item.kind === 'lead'
                              ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-400'
                              : item.kind === 'campaign'
                              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                              : 'bg-white/[0.04] border-white/[0.08] text-[#9CA3AF]'
                          }`}
                        >
                          {item.kind === 'action' && <Play className="h-3.5 w-3.5 fill-current" />}
                          {item.kind === 'lead' && <Sparkles className="h-3.5 w-3.5" />}
                          {item.kind === 'campaign' && <GitBranch className="h-3.5 w-3.5" />}
                          {item.kind === 'view' && <ArrowRight className="h-3.5 w-3.5" />}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-medium truncate">{item.label}</p>
                          <p className="text-[11px] text-[#6B7280] truncate">{item.sub}</p>
                        </div>
                      </div>
                      <span className="font-mono text-[10px] uppercase tracking-wider text-[#6B7280] shrink-0">
                        {item.kind}
                      </span>
                    </button>
                  );
                })}

                {paletteResults.length === 0 && (
                  <p className="py-8 text-center text-xs text-[#6B7280]">
                    No matching views, leads, or campaigns found.
                  </p>
                )}
              </div>

              <div className="px-4 py-2.5 border-t border-white/[0.07] bg-white/[0.015] flex items-center justify-between text-[11px] text-[#6B7280] font-mono">
                <span className="flex items-center gap-3">
                  <span>↑↓ Navigate</span>
                  <span>↵ Select</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Users className="h-3 w-3" />
                  {data.leads.length} leads indexed
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <DemoAutomationRunner
        open={demoRunnerOpen}
        onClose={() => setDemoRunnerOpen(false)}
        leads={data.leads}
        onRefreshWorkspace={() => loadWorkspace(rangeDays)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <WorkspaceApp />
    </ToastProvider>
  );
}
