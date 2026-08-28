import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import type { RecoveryStats } from '../../types/transit';

const FAILURE_COLORS: Record<string, string> = {
  network_handoff: '#3b82f6',
  peak_load: '#f97316',
  insufficient_funds: '#ef4444',
  user_cancelled: '#8b5cf6',
  timeout: '#eab308',
  webhook_dropout: '#06b6d4',
  unknown: '#6b7280',
};

const FAILURE_LABELS: Record<string, string> = {
  network_handoff: 'Network Handoff',
  peak_load: 'Peak Load',
  insufficient_funds: 'Low Balance',
  user_cancelled: 'Cancelled',
  timeout: 'Timeout',
  webhook_dropout: 'Webhook Dropout',
  unknown: 'Unknown',
};

interface Props {
  stats: RecoveryStats | null;
  loading: boolean;
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-3 shadow-2xl">
        <p className="text-white font-semibold text-sm">{label}</p>
        <p className="text-blue-300 text-sm">{payload[0].value} sessions</p>
      </div>
    );
  }
  return null;
};

const FailureBreakdown: React.FC<Props> = ({ stats, loading }) => {
  const data = stats?.reasonBreakdown?.map((item) => ({
    name: FAILURE_LABELS[item._id] || item._id,
    count: item.count,
    key: item._id,
    amount: item.amount,
  })) || [];

  if (loading) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
        <div className="h-5 bg-white/10 rounded animate-pulse w-1/2 mb-4" />
        <div className="h-48 bg-white/5 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
      <h3 className="text-white font-semibold mb-4">Failures by Root Cause</h3>

      {data.length === 0 ? (
        <div className="flex items-center justify-center h-48 text-slate-500 text-sm">
          No data yet — run the recovery agent first
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="name"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {data.map((entry) => (
                  <Cell key={entry.key} fill={FAILURE_COLORS[entry.key] || '#6b7280'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Legend */}
          <div className="flex flex-wrap gap-2 mt-3">
            {data.map((d) => (
              <span
                key={d.key}
                className="flex items-center gap-1.5 text-xs text-slate-400"
              >
                <span
                  className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                  style={{ background: FAILURE_COLORS[d.key] || '#6b7280' }}
                />
                {d.name}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default FailureBreakdown;
