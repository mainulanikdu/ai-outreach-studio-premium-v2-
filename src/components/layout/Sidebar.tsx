import { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Sparkles,
  GitBranch,
  Globe,
  ShieldCheck,
  Layers,
  Bot,
  BarChart3,
  History,
  Activity,
  ScrollText,
  Settings,
  X,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { motion } from 'motion/react';
import type { NavSection } from '../../types/outreach';

interface SidebarProps {
  activeSection: NavSection;
  onSelect: (section: NavSection) => void;
  pendingApprovalsCount: number;
  runningJobsCount: number;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

type AccentKey = 'cobalt' | 'emerald' | 'violet' | 'amber';

const ACCENT_SWATCHES: { id: AccentKey; label: string; dot: string }[] = [
  { id: 'cobalt', label: 'Cobalt', dot: 'bg-blue-500' },
  { id: 'emerald', label: 'Emerald', dot: 'bg-emerald-500' },
  { id: 'violet', label: 'Violet', dot: 'bg-violet-500' },
  { id: 'amber', label: 'Amber', dot: 'bg-amber-500' },
];

const NAV_GROUPS: {
  label: string;
  items: { id: NavSection; label: string; icon: typeof LayoutDashboard }[];
}[] = [
  {
    label: 'Workspace',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'leads', label: 'Leads', icon: Users },
      { id: 'ai-research', label: 'AI Research', icon: Sparkles },
      { id: 'campaigns', label: 'Campaigns', icon: GitBranch },
    ],
  },
  {
    label: 'Execution Engine',
    items: [
      { id: 'browser-engine', label: 'Browser Engine', icon: Globe },
      { id: 'sessions', label: 'Sessions', icon: ShieldCheck },
      { id: 'job-queue', label: 'Job Queue', icon: Layers },
      { id: 'ai-agent', label: 'AI Agent', icon: Bot },
    ],
  },
  {
    label: 'Observability',
    items: [
      { id: 'analytics', label: 'Analytics', icon: BarChart3 },
      { id: 'execution-history', label: 'Execution History', icon: History },
      { id: 'system-health', label: 'System Health', icon: Activity },
      { id: 'activity-logs', label: 'Activity Logs', icon: ScrollText },
      { id: 'settings', label: 'Settings', icon: Settings },
    ],
  },
];

export function Sidebar({
  activeSection,
  onSelect,
  pendingApprovalsCount,
  runningJobsCount,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const [avatarError, setAvatarError] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [accent, setAccent] = useState<AccentKey>(() => {
    try {
      const saved = window.localStorage.getItem('studio-accent') as AccentKey | null;
      return saved && ['cobalt', 'emerald', 'violet', 'amber'].includes(saved) ? saved : 'cobalt';
    } catch {
      return 'cobalt';
    }
  });

  useEffect(() => {
    if (accent === 'cobalt') {
      document.documentElement.removeAttribute('data-accent');
    } else {
      document.documentElement.setAttribute('data-accent', accent);
    }
    try {
      window.localStorage.setItem('studio-accent', accent);
    } catch {
      // ignore storage errors
    }
  }, [accent]);

  const renderNavContent = (isCompact: boolean) => (
    <div
      className={`flex flex-col h-full bg-[#0A0C11]/95 backdrop-blur-xl border-r border-white/[0.075] select-none transition-[width] duration-200 ease-out ${
        isCompact ? 'w-[74px]' : 'w-[258px]'
      }`}
    >
      {/* Brand Header */}
      <div
        className={`flex items-center h-14 border-b border-white/[0.075] shrink-0 ${
          isCompact ? 'justify-center px-2' : 'justify-between px-4'
        }`}
      >
        <button
          type="button"
          onClick={() => {
            onSelect('dashboard');
            onCloseMobile();
          }}
          className="flex items-center gap-2.5 text-left group cursor-pointer min-w-0"
          title="AI Outreach Studio"
        >
          <div
            className="h-8 w-8 rounded-xl border border-white/[0.12] flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105"
            style={{
              background:
                'linear-gradient(135deg, rgba(var(--accent-rgb), 0.25) 0%, rgba(22, 25, 34, 0.9) 100%)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.16)',
            }}
          >
            <svg
              viewBox="0 0 20 20"
              fill="none"
              className="h-4 w-4"
              style={{ color: 'var(--accent-primary)' }}
              aria-hidden="true"
            >
              <path
                d="M3.5 10L8.5 5L13.5 10L8.5 15L3.5 10Z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
              <path
                d="M11.5 5L16.5 10L11.5 15"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.6"
              />
            </svg>
          </div>
          {!isCompact && (
            <div className="min-w-0">
              <span className="block text-[13px] font-bold font-display tracking-[-0.02em] text-[#F4F5F7] leading-none truncate">
                Outreach Studio
              </span>
              <span className="block text-[10px] font-mono uppercase tracking-[0.1em] text-[#6B7280] mt-1 leading-none">
                Autonomous Ops
              </span>
            </div>
          )}
        </button>

        {!isCompact && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setCollapsed(true)}
              className="hidden lg:inline-flex p-1.5 rounded-lg text-[#6B7280] hover:text-[#F4F5F7] hover:bg-white/[0.06] transition-colors cursor-pointer"
              aria-label="Collapse sidebar"
              title="Collapse sidebar"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-lg text-[#9CA3AF] hover:text-[#F4F5F7] hover:bg-white/[0.06] transition-colors"
              aria-label="Close navigation"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Expand button when collapsed */}
      {isCompact && (
        <div className="flex justify-center pt-2.5 pb-1">
          <button
            type="button"
            onClick={() => setCollapsed(false)}
            className="p-1.5 rounded-lg text-[#6B7280] hover:text-[#F4F5F7] hover:bg-white/[0.06] transition-colors cursor-pointer"
            aria-label="Expand sidebar"
            title="Expand sidebar"
          >
            <PanelLeftOpen className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Grouped Navigation with Sliding Framer Motion Active Pill */}
      <nav
        className={`flex-1 overflow-y-auto py-4 space-y-5 ${isCompact ? 'px-2' : 'px-3'}`}
        aria-label="Primary"
      >
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            {!isCompact ? (
              <div className="px-2.5 mb-1.5 text-[10px] font-mono font-medium uppercase tracking-[0.1em] text-[#6B7280]">
                {group.label}
              </div>
            ) : (
              <div className="mx-2 mb-2 h-px bg-white/[0.06]" />
            )}

            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = activeSection === item.id;
                const isAgent = item.id === 'ai-agent';
                const isQueue = item.id === 'job-queue';
                const count = isAgent
                  ? pendingApprovalsCount
                  : isQueue
                  ? runningJobsCount
                  : 0;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onSelect(item.id);
                      onCloseMobile();
                    }}
                    title={isCompact ? item.label : undefined}
                    aria-current={active ? 'page' : undefined}
                    className={`relative w-full flex items-center ${
                      isCompact ? 'justify-center px-0 py-2.5' : 'justify-between gap-2.5 px-2.5 py-[8px]'
                    } rounded-xl text-[13px] transition-colors cursor-pointer group ${
                      active ? 'text-[#F4F5F7] font-medium' : 'text-[#9CA3AF] hover:text-[#F4F5F7]'
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="studio-active-nav-pill"
                        transition={{ type: 'spring', stiffness: 460, damping: 34 }}
                        className="absolute inset-0 rounded-xl bg-white/[0.07] border border-white/[0.1] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                        aria-hidden="true"
                      />
                    )}
                    {!active && (
                      <span
                        className="absolute inset-0 rounded-xl bg-white/0 group-hover:bg-white/[0.035] transition-colors"
                        aria-hidden="true"
                      />
                    )}

                    {active && !isCompact && (
                      <motion.span
                        layoutId="studio-active-nav-rail"
                        transition={{ type: 'spring', stiffness: 460, damping: 34 }}
                        className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-[2.5px] rounded-r-full"
                        style={{ backgroundColor: 'var(--accent-primary)' }}
                        aria-hidden="true"
                      />
                    )}

                    <span className="relative z-10 flex items-center gap-2.5 min-w-0">
                      <Icon
                        className={`h-[16px] w-[16px] shrink-0 transition-colors ${
                          active
                            ? ''
                            : 'text-[#6B7280] group-hover:text-[#D1D5DB]'
                        }`}
                        style={
                          active
                            ? {
                                color:
                                  item.id === 'ai-research' || isAgent
                                    ? '#818CF8'
                                    : 'var(--accent-primary)',
                              }
                            : undefined
                        }
                      />
                      {!isCompact && <span className="truncate">{item.label}</span>}
                    </span>

                    {count > 0 && !isCompact && (
                      <span
                        className={`relative z-10 inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded-md font-mono text-[10px] font-medium tabular-nums ${
                          isQueue
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                        }`}
                      >
                        {isQueue && (
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        )}
                        {count}
                      </span>
                    )}

                    {count > 0 && isCompact && (
                      <span
                        className={`absolute top-1.5 right-2.5 h-2 w-2 rounded-full ${
                          isQueue ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Interactive Theme Accent Picker + Operator Footer */}
      <div className={`border-t border-white/[0.075] shrink-0 ${isCompact ? 'p-2' : 'p-3'}`}>
        {!isCompact ? (
          <div className="rounded-xl bg-[#10131B] border border-white/[0.07] p-3 space-y-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-[0.08em] text-[#6B7280]">
                Accent Theme
              </span>
              <div className="flex items-center gap-1.5">
                {ACCENT_SWATCHES.map((sw) => (
                  <button
                    key={sw.id}
                    type="button"
                    onClick={() => setAccent(sw.id)}
                    title={`Switch accent to ${sw.label}`}
                    aria-label={`Switch accent to ${sw.label}`}
                    className={`h-4 w-4 rounded-full ${sw.dot} transition-transform cursor-pointer flex items-center justify-center ${
                      accent === sw.id
                        ? 'ring-2 ring-white/80 ring-offset-2 ring-offset-[#10131B] scale-110'
                        : 'opacity-55 hover:opacity-100 hover:scale-110'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2.5 pt-2.5 border-t border-white/[0.06]">
              <div className="relative shrink-0">
                {!avatarError ? (
                  <img
                    src="/src/assets/images/avatar_operator_1795540651815.jpg"
                    alt="Claire Vance operator avatar"
                    referrerPolicy="no-referrer"
                    onError={() => setAvatarError(true)}
                    className="h-8 w-8 rounded-lg object-cover border border-white/[0.12]"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-[11px] font-mono font-semibold text-blue-300">
                    CV
                  </div>
                )}
                <span
                  className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-[#10131B]"
                  title="Operator Online"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-medium text-[#F4F5F7] truncate leading-tight">
                  Claire Vance
                </p>
                <p className="text-[10px] font-mono text-amber-300/80 truncate mt-0.5 leading-tight">
                  DEMO · SANDBOX
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-1">
            {!avatarError ? (
              <img
                src="/src/assets/images/avatar_operator_1795540651815.jpg"
                alt="Claire Vance"
                referrerPolicy="no-referrer"
                onError={() => setAvatarError(true)}
                className="h-8 w-8 rounded-lg object-cover border border-white/[0.12]"
              />
            ) : (
              <div className="h-8 w-8 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-[11px] font-mono font-semibold text-blue-300">
                CV
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block shrink-0 sticky top-0 h-screen">
        {renderNavContent(collapsed)}
      </aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative z-10 h-full">{renderNavContent(false)}</div>
        </div>
      )}
    </>
  );
}
