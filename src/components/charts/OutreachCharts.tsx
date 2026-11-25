import { useState } from 'react';
import type { AnalyticsDayPoint } from '../../types/outreach';

interface OutreachAreaChartProps {
  data: AnalyticsDayPoint[];
  height?: number;
}

type SeriesKey = 'sent' | 'accepted' | 'replies';

export function OutreachAreaChart({ data, height = 250 }: OutreachAreaChartProps) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [chartMode, setChartMode] = useState<'area' | 'bars'>('area');
  const [visible, setVisible] = useState<Record<SeriesKey, boolean>>({
    sent: true,
    accepted: true,
    replies: true,
  });

  if (!data || data.length === 0) {
    return (
      <div className="h-56 flex items-center justify-center text-xs text-[#6B7280]">
        No outreach telemetry available for this range.
      </div>
    );
  }

  const toggleSeries = (key: SeriesKey) => {
    setVisible((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      if (!next.sent && !next.accepted && !next.replies) return prev;
      return next;
    });
  };

  const width = 760;
  const padLeft = 36;
  const padRight = 16;
  const padTop = 20;
  const padBottom = 28;
  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  const maxVal = Math.max(
    10,
    ...data.map((d) =>
      Math.max(
        visible.sent ? d.connectionsSent : 0,
        visible.accepted ? d.connectionsAccepted : 0,
        visible.replies ? d.repliesReceived : 0
      )
    )
  );
  const yMax = Math.ceil(maxVal / 5) * 5;

  const xFor = (i: number) =>
    data.length === 1 ? padLeft + chartW / 2 : padLeft + (i / (data.length - 1)) * chartW;
  const yFor = (val: number) => padTop + chartH - (val / yMax) * chartH;

  const buildSmoothPath = (accessor: (d: AnalyticsDayPoint) => number) => {
    const pts = data.map((d, i) => ({ x: xFor(i), y: yFor(accessor(d)) }));
    if (pts.length === 1) return `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
    let path = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i];
      const p1 = pts[i + 1];
      const cx = ((p0.x + p1.x) / 2).toFixed(1);
      path += ` C ${cx} ${p0.y.toFixed(1)}, ${cx} ${p1.y.toFixed(1)}, ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`;
    }
    return path;
  };

  const sentPath = buildSmoothPath((d) => d.connectionsSent);
  const acceptedPath = buildSmoothPath((d) => d.connectionsAccepted);
  const replyPath = buildSmoothPath((d) => d.repliesReceived);

  const sentArea = `${sentPath} L ${xFor(data.length - 1).toFixed(1)} ${(padTop + chartH).toFixed(1)} L ${xFor(0).toFixed(1)} ${(padTop + chartH).toFixed(1)} Z`;
  const acceptedArea = `${acceptedPath} L ${xFor(data.length - 1).toFixed(1)} ${(padTop + chartH).toFixed(1)} L ${xFor(0).toFixed(1)} ${(padTop + chartH).toFixed(1)} Z`;

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => Math.round(yMax * t));
  const labelStep = Math.max(1, Math.floor(data.length / 6));
  const hovered = hoverIdx !== null ? data[hoverIdx] : null;
  const tooltipLeftPct =
    hoverIdx !== null ? Math.min(82, Math.max(14, (xFor(hoverIdx) / width) * 100)) : 50;

  return (
    <div className="relative w-full">
      {/* Interactive Legend Toggles + Chart Mode Switch */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => toggleSeries('sent')}
            className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-all cursor-pointer ${
              visible.sent
                ? 'bg-blue-500/10 border-blue-500/30 text-blue-300'
                : 'bg-white/[0.02] border-white/[0.06] text-[#6B7280] opacity-60 hover:opacity-100'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            <span>Connections Sent</span>
          </button>

          <button
            type="button"
            onClick={() => toggleSeries('accepted')}
            className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-all cursor-pointer ${
              visible.accepted
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-white/[0.02] border-white/[0.06] text-[#6B7280] opacity-60 hover:opacity-100'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span>Accepted</span>
          </button>

          <button
            type="button"
            onClick={() => toggleSeries('replies')}
            className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-all cursor-pointer ${
              visible.replies
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                : 'bg-white/[0.02] border-white/[0.06] text-[#6B7280] opacity-60 hover:opacity-100'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            <span>Replies</span>
          </button>
        </div>

        <div className="inline-flex items-center p-0.5 rounded-lg bg-white/[0.04] border border-white/[0.07]">
          <button
            type="button"
            onClick={() => setChartMode('area')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
              chartMode === 'area'
                ? 'bg-white/[0.1] text-[#F4F5F7]'
                : 'text-[#6B7280] hover:text-[#D1D5DB]'
            }`}
          >
            Area
          </button>
          <button
            type="button"
            onClick={() => setChartMode('bars')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
              chartMode === 'bars'
                ? 'bg-white/[0.1] text-[#F4F5F7]'
                : 'text-[#6B7280] hover:text-[#D1D5DB]'
            }`}
          >
            Bars
          </button>
        </div>
      </div>

      {/* Chart Canvas + Floating Glass Tooltip */}
      <div className="relative">
        {hovered && (
          <div
            className="pointer-events-none absolute top-1 z-20 -translate-x-1/2 rounded-xl border border-white/[0.14] bg-[#10131C]/95 backdrop-blur-md px-3 py-2 shadow-2xl shadow-black/80 transition-[left] duration-75"
            style={{ left: `${tooltipLeftPct}%` }}
          >
            <p className="text-[10px] font-mono uppercase tracking-[0.06em] text-[#9CA3AF] mb-1">
              {hovered.date}
            </p>
            <div className="flex items-center gap-3 font-mono text-[11px] tabular-nums">
              {visible.sent && (
                <span className="text-blue-400">Sent {hovered.connectionsSent}</span>
              )}
              {visible.accepted && (
                <span className="text-emerald-400">Acc {hovered.connectionsAccepted}</span>
              )}
              {visible.replies && (
                <span className="text-amber-300">Rep {hovered.repliesReceived}</span>
              )}
            </div>
          </div>
        )}

        <svg
          role="img"
          aria-label="Interactive outreach performance chart"
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible select-none"
          onMouseLeave={() => setHoverIdx(null)}
        >
          <defs>
            <linearGradient id="sentGradV2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="acceptedGradV2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {yTicks.map((tick) => {
            const y = yFor(tick);
            return (
              <g key={tick}>
                <line
                  x1={padLeft}
                  x2={width - padRight}
                  y1={y}
                  y2={y}
                  stroke="rgba(255,255,255,0.055)"
                  strokeDasharray="2 4"
                />
                <text
                  x={padLeft - 8}
                  y={y + 3.5}
                  textAnchor="end"
                  className="fill-[#6B7280] text-[10px] font-mono tabular-nums"
                >
                  {tick}
                </text>
              </g>
            );
          })}

          {data.map((d, i) => {
            if (i % labelStep !== 0 && i !== data.length - 1) return null;
            return (
              <text
                key={d.date}
                x={xFor(i)}
                y={height - 6}
                textAnchor="middle"
                className="fill-[#6B7280] text-[10px] font-mono tabular-nums"
              >
                {d.date.slice(5)}
              </text>
            );
          })}

          {chartMode === 'area' ? (
            <>
              {visible.sent && <path d={sentArea} fill="url(#sentGradV2)" />}
              {visible.accepted && <path d={acceptedArea} fill="url(#acceptedGradV2)" />}
              {visible.sent && (
                <path d={sentPath} fill="none" stroke="#3B82F6" strokeWidth="2.2" strokeLinecap="round" />
              )}
              {visible.accepted && (
                <path d={acceptedPath} fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" />
              )}
              {visible.replies && (
                <path
                  d={replyPath}
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth="1.9"
                  strokeDasharray="4 3"
                  strokeLinecap="round"
                />
              )}
            </>
          ) : (
            data.map((d, i) => {
              const cx = xFor(i);
              const bw = Math.max(3, Math.min(10, chartW / data.length / 3.4));
              const isHovered = hoverIdx === i;
              return (
                <g key={d.date} opacity={hoverIdx === null || isHovered ? 1 : 0.45}>
                  {visible.sent && (
                    <rect
                      x={cx - bw * 1.1}
                      y={yFor(d.connectionsSent)}
                      width={bw}
                      height={Math.max(0, padTop + chartH - yFor(d.connectionsSent))}
                      rx={2}
                      fill="#3B82F6"
                    />
                  )}
                  {visible.accepted && (
                    <rect
                      x={cx}
                      y={yFor(d.connectionsAccepted)}
                      width={bw}
                      height={Math.max(0, padTop + chartH - yFor(d.connectionsAccepted))}
                      rx={2}
                      fill="#10B981"
                    />
                  )}
                  {visible.replies && (
                    <rect
                      x={cx + bw * 1.1}
                      y={yFor(d.repliesReceived)}
                      width={bw}
                      height={Math.max(0, padTop + chartH - yFor(d.repliesReceived))}
                      rx={2}
                      fill="#F59E0B"
                    />
                  )}
                </g>
              );
            })
          )}

          {hoverIdx !== null && chartMode === 'area' && (
            <g>
              <line
                x1={xFor(hoverIdx)}
                x2={xFor(hoverIdx)}
                y1={padTop}
                y2={padTop + chartH}
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="1"
              />
              {visible.sent && (
                <circle
                  cx={xFor(hoverIdx)}
                  cy={yFor(data[hoverIdx].connectionsSent)}
                  r="5"
                  fill="#07080B"
                  stroke="#3B82F6"
                  strokeWidth="2.5"
                />
              )}
              {visible.accepted && (
                <circle
                  cx={xFor(hoverIdx)}
                  cy={yFor(data[hoverIdx].connectionsAccepted)}
                  r="4.5"
                  fill="#07080B"
                  stroke="#10B981"
                  strokeWidth="2.5"
                />
              )}
              {visible.replies && (
                <circle
                  cx={xFor(hoverIdx)}
                  cy={yFor(data[hoverIdx].repliesReceived)}
                  r="4.5"
                  fill="#07080B"
                  stroke="#F59E0B"
                  strokeWidth="2.5"
                />
              )}
            </g>
          )}

          {data.map((d, i) => {
            const sliceW = chartW / Math.max(1, data.length);
            return (
              <rect
                key={d.date}
                x={xFor(i) - sliceW / 2}
                y={padTop}
                width={Math.max(6, sliceW)}
                height={chartH}
                fill="transparent"
                className="cursor-crosshair"
                onMouseEnter={() => setHoverIdx(i)}
              />
            );
          })}
        </svg>
      </div>
    </div>
  );
}

export function WorkerThroughputBars({
  items,
}: {
  items: { label: string; completed: number; failed: number; latencyMs: number }[];
}) {
  const maxVal = Math.max(10, ...items.map((i) => i.completed + i.failed));

  return (
    <div className="space-y-4">
      {items.map((item) => {
        const pct = Math.round((item.completed / maxVal) * 100);
        const failPct = Math.round((item.failed / maxVal) * 100);
        return (
          <div key={item.label} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono text-[#F4F5F7]">{item.label}</span>
              <span className="text-[#9CA3AF] font-mono text-[11px] tabular-nums">
                <span className="text-emerald-400">{item.completed} ok</span>
                <span className="text-white/20 mx-1.5">·</span>
                <span className={item.failed > 0 ? 'text-rose-400' : 'text-[#6B7280]'}>
                  {item.failed} err
                </span>
                <span className="text-white/20 mx-1.5">·</span>
                <span>{item.latencyMs}ms</span>
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-white/[0.06] overflow-hidden flex">
              <div
                className="h-full bg-blue-500 transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
              {failPct > 0 && (
                <div
                  className="h-full bg-rose-500 transition-all duration-500"
                  style={{ width: `${failPct}%` }}
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
