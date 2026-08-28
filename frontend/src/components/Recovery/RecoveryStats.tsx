import React from 'react';
import type { RecoveryStats } from '../../types/transit';
import { IndianRupee, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';

interface Props {
  stats: RecoveryStats | null;
  loading: boolean;
}

const StatCard: React.FC<{
  title: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  color: string;
  loading: boolean;
}> = ({ title, value, sub, icon, color, loading }) => (
  <div className={`bg-white/5 border ${color} rounded-2xl p-5 relative overflow-hidden`}>
    <div className="flex items-start justify-between mb-3">
      <p className="text-slate-400 text-sm font-medium">{title}</p>
      <div className="opacity-80">{icon}</div>
    </div>
    {loading ? (
      <div className="space-y-2">
        <div className="h-8 bg-white/10 rounded-lg animate-pulse w-3/4" />
        <div className="h-4 bg-white/5 rounded animate-pulse w-1/2" />
      </div>
    ) : (
      <>
        <p className="text-white text-3xl font-black tracking-tight">{value}</p>
        <p className="text-slate-400 text-sm mt-1">{sub}</p>
      </>
    )}
  </div>
);

const RecoveryStatsPanel: React.FC<Props> = ({ stats, loading }) => {
  const recoveryRateColor =
    !stats ? 'text-slate-400'
    : stats.recoveryRate >= 50 ? 'text-emerald-400'
    : stats.recoveryRate >= 30 ? 'text-yellow-400'
    : 'text-red-400';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <StatCard
        title="Revenue at Risk"
        value={stats ? `₹${stats.amountAtRisk.toLocaleString('en-IN')}` : '—'}
        sub={stats ? `${stats.failedSessionCount} failed sessions` : ''}
        icon={<AlertCircle className="w-5 h-5 text-red-400" />}
        color="border-red-500/20"
        loading={loading}
      />
      <StatCard
        title="Recovery Attempted"
        value={stats ? String(stats.recoveryAttempted) : '—'}
        sub="sessions processed by agent"
        icon={<TrendingUp className="w-5 h-5 text-blue-400" />}
        color="border-blue-500/20"
        loading={loading}
      />
      <StatCard
        title="Amount Recovered"
        value={stats ? `₹${stats.amountRecovered.toLocaleString('en-IN')}` : '—'}
        sub={stats ? `${stats.recoveredCount} sessions recovered` : ''}
        icon={<IndianRupee className="w-5 h-5 text-emerald-400" />}
        color="border-emerald-500/20"
        loading={loading}
      />
      <div className="bg-white/5 border border-purple-500/20 rounded-2xl p-5 relative overflow-hidden">
        <div className="flex items-start justify-between mb-3">
          <p className="text-slate-400 text-sm font-medium">Recovery Rate</p>
          <CheckCircle2 className="w-5 h-5 text-purple-400 opacity-80" />
        </div>
        {loading ? (
          <div className="space-y-2">
            <div className="h-8 bg-white/10 rounded-lg animate-pulse w-3/4" />
            <div className="h-3 bg-white/10 rounded-full animate-pulse mt-3" />
          </div>
        ) : (
          <>
            <p className={`text-3xl font-black tracking-tight ${recoveryRateColor}`}>
              {stats ? `${stats.recoveryRate}%` : '—'}
            </p>
            <div className="mt-3 h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${
                  (stats?.recoveryRate || 0) >= 50 ? 'bg-emerald-500' :
                  (stats?.recoveryRate || 0) >= 30 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${stats?.recoveryRate || 0}%` }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default RecoveryStatsPanel;

