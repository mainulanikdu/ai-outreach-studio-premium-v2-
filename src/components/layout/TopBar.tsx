import { useEffect, useRef, useState } from 'react';
import {
  Menu,
  Play,
  Search,
  Bell,
  ChevronDown,
  Activity,
  Bot,
  Layers,
  ShieldCheck,
  ArrowUpRight,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type { NavSection } from '../../types/outreach';

interface TopBarProps {
  activeSection: NavSection;
  aiMode: 'gemini' | 'mock';
  fallbackActive?: boolean;
  onSelectSection: (section: NavSection) => void;
  onOpenMobileMenu: () => void;
  onRunDemoAutomation: () => void;
  onOpenCommandPalette?: () => void;
  pendingApprovalsCount?: number;
  runningJobsCount?: number;
  activeSessionsCount?: number;
}

const SECTION_META: Record<NavSection, { group: string; title: string }> = {
  dashboard: { group: 'Workspace', title: 'Overview' },
  leads: { group: 'Workspace', title: 'Lead Management' },
  'ai-research': { group: 'Workspace', title: 'AI Research & Personalization' },
  campaigns: { group: 'Workspace', title: 'Campaign Builder' },
  'browser-engine': { group: 'Execution Engine', title: 'Browser Automation Engine' },
  sessions: { group: 'Execution Engine', title: 'Session Management' },
  'job-queue': { group: 'Execution Engine', title: 'Background Job Queue' },
  'ai-agent': { group: 'Execution Engine', title: 'AI Agent Control Center' },
  analytics: { group: 'Observability', title: 'Analytics & Reports' },
  'execution-history': { group: 'Observability', title: 'Automation Execution History' },
  'system-health': { group: 'Observability', title: 'System Health & Observability' },
  'activity-logs': { group: 'Observability', title: 'Activity Logs' },
  settings: { group: 'Observability', title: 'Settings & Integrations' },
};

export function TopBar({
  activeSection,
  aiMode,
  fallbackActive,
  onSelectSection,
  onOpenMobileMenu,
  onRunDemoAutomation,
  onOpenCommandPalette,
  pendingApprovalsCount = 0,
  runningJobsCount = 0,
  activeSessionsCount = 0,
}: TopBarProps) {
  const [telemetryOpen, setTelemetryOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const meta = SECTION_META[activeSection];
  const isHealthyGemini = aiMode === 'gemini' && !fallbackActive;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setTelemetryOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 h-14 shrink-0 border-b border-white/[0.075] bg-[#07080B]/80 backdrop-blur-xl px-4 sm:px-6 flex items-center justify-between gap-4">
      {/* Left: Mobile Trigger + Context Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="lg:hidden p-1.5 rounded-lg text-[#9CA3AF] hover:text-[#F4F5F7] hover:bg-white/[0.06] transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2 text-[13px] min-w-0 truncate">
          <span className="text-[#6B7280] hidden sm:inline whitespace-nowrap">
            {meta.group}
          </span>
          <span className="text-white/20 hidden sm:inline">/</span>
          <h1 className="font-display font-semibold tracking-[-0.02em] text-[#F4F5F7] truncate">
            {meta.title}
          </h1>
        </div>
      </div>

      {/* Right: Command Palette + Interactive Telemetry Popover + Approvals Bell + Primary CTA */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        {onOpenCommandPalette && (
          <button
            type="button"
            onClick={onOpenCommandPalette}
            className="hidden md:inline-flex items-center gap-2.5 h-8 px-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.08] hover:border-white/[0.15] text-xs text-[#9CA3AF] hover:text-[#F4F5F7] transition-all cursor-pointer"
            title="Search views, leads & campaigns (Cmd+K)"
          >
            <Search className="h-3.5 w-3.5 text-[#6B7280]" />
            <span className="hidden xl:inline">Search leads, views...</span>
            <kbd className="font-mono text-[10px] text-[#9CA3AF] bg-white/[0.06] border border-white/[0.1] rounded px-1.5 py-0.5">
              ⌘K
            </kbd>
          </button>
        )}

        {/* Interactive Live Telemetry Popover */}
        <div className="relative hidden md:block" ref={popoverRef}>
          <button
            type="button"
            onClick={() => setTelemetryOpen((prev) => !prev)}
            className="inline-flex items-center gap-2 h-8 px-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.08] hover:border-white/[0.15] text-[11px] text-[#9CA3AF] hover:text-[#F4F5F7] transition-all whitespace-nowrap cursor-pointer"
            aria-expanded={telemetryOpen}
          >
            <span className="relative flex h-2 w-2">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-70 ${
                  isHealthyGemini ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  isHealthyGemini ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
              />
            </span>
            <span className="font-mono text-[#F4F5F7]">
              {aiMode === 'gemini'
                ? fallbackActive
                  ? 'Gemini Fallback'
                  : 'Gemini Live'
                : 'Mock Engine'}
            </span>
            <ChevronDown
              className={`h-3 w-3 text-[#6B7280] transition-transform duration-150 ${
                telemetryOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          <AnimatePresence>
            {telemetryOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.96 }}
                transition={{ duration: 0.14 }}
                className="absolute right-0 mt-2 w-72 rounded-2xl border border-white/[0.12] bg-[#10131B]/95 backdrop-blur-xl p-3.5 shadow-2xl shadow-black/80 space-y-3"
              >
                <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.07]">
                  <span className="text-[11px] font-mono uppercase tracking-[0.08em] text-[#9CA3AF]">
                    Live Engine Status
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                    NOMINAL
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setTelemetryOpen(false);
                      onSelectSection('sessions');
                    }}
                    className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-white/[0.05] transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-2 text-[#D1D5DB]">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                      Active Sessions
                    </span>
                    <span className="font-mono tabular-nums text-[#F4F5F7]">
                      {activeSessionsCount}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setTelemetryOpen(false);
                      onSelectSection('job-queue');
                    }}
                    className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-white/[0.05] transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-2 text-[#D1D5DB]">
                      <Layers className="h-3.5 w-3.5 text-blue-400" />
                      Active / Queued Jobs
                    </span>
                    <span className="font-mono tabular-nums text-[#F4F5F7]">
                      {runningJobsCount}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setTelemetryOpen(false);
                      onSelectSection('ai-agent');
                    }}
                    className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-white/[0.05] transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-2 text-[#D1D5DB]">
                      <Bot className="h-3.5 w-3.5 text-amber-400" />
                      Pending Approvals
                    </span>
                    <span className="font-mono tabular-nums text-amber-300">
                      {pendingApprovalsCount}
                    </span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setTelemetryOpen(false);
                    onSelectSection('system-health');
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.07] text-xs font-medium text-[#F4F5F7] transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Activity className="h-3.5 w-3.5 text-blue-400" />
                    Open System Health
                  </span>
                  <ArrowUpRight className="h-3.5 w-3.5 text-[#9CA3AF]" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Pending Approvals Quick Button */}
        <button
          type="button"
          onClick={() => onSelectSection('ai-agent')}
          className="relative inline-flex items-center justify-center h-8 w-8 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] text-[#9CA3AF] hover:text-[#F4F5F7] transition-colors cursor-pointer"
          title={
            pendingApprovalsCount > 0
              ? `${pendingApprovalsCount} pending AI agent approvals`
              : 'AI Agent Control Center'
          }
          aria-label="Open AI Agent approvals"
        >
          <Bell className="h-3.5 w-3.5" />
          {pendingApprovalsCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-amber-500 text-[9px] font-mono font-bold text-black flex items-center justify-center">
              {pendingApprovalsCount}
            </span>
          )}
        </button>

        {/* Primary CTA */}
        <button
          type="button"
          onClick={onRunDemoAutomation}
          className="btn-accent inline-flex items-center gap-2 h-8 rounded-xl px-3.5 text-xs font-semibold text-white whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Play className="h-3 w-3 fill-current" />
          <span>Run Demo</span>
        </button>
      </div>
    </header>
  );
}
