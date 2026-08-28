import React from 'react';
import type { RecoveryLog } from '../../types/transit';
import { recoveryApi } from '../../services/api';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

interface Props {
  escalated: RecoveryLog[];
  loading: boolean;
  onRefresh: () => void;
}

const EscalatedQueue: React.FC<Props> = ({ escalated, loading, onRefresh }) => {
  const handleMarkRecovered = async (logId: string) => {
    try {
      await recoveryApi.markAsRecovered(logId);
      onRefresh();
    } catch {
      alert('Failed to mark as recovered');
    }
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2].map((i) => (
          <div key={i} className="h-14 bg-white/5 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (escalated.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <CheckCircle2 className="w-12 h-12 text-emerald-400" />
        <p className="text-slate-400 text-center">
          No escalations — agent handled everything ✅
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-xl px-4 py-3 mb-4">
        <AlertTriangle className="w-4 h-4 text-orange-400 flex-shrink-0" />
        <p className="text-orange-300 text-sm">
          These sessions need manual follow-up — 3 automated attempts failed.
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/5 border-b border-white/10">
              {['Bus', 'Route', 'Amount', 'Attempts', 'Last Message', 'Action'].map((h) => (
                <th key={h} className="text-left text-slate-400 font-medium px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {escalated.map((log) => {
              const routeObj = typeof log.routeId === 'object' ? log.routeId : null;
              return (
                <tr key={log._id} className="border-b border-white/5 hover:bg-white/5 transition">
                  <td className="px-4 py-3 text-white font-mono text-xs">{log.busNumber}</td>
                  <td className="px-4 py-3 text-slate-300">
                    {routeObj ? `${routeObj.routeNumber}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-white font-semibold">₹{log.amount}</td>
                  <td className="px-4 py-3 text-orange-300">{log.attemptNumber}</td>
                  <td className="px-4 py-3 text-slate-400 max-w-xs">
                    <p className="truncate text-xs italic">{log.aiMessage}</p>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      id={`markRecovered-${log._id}`}
                      onClick={() => handleMarkRecovered(log._id)}
                      className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg px-3 py-1.5 transition"
                    >
                      Mark Recovered
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EscalatedQueue;
