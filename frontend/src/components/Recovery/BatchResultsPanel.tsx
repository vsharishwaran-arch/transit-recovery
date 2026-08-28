import React, { useState } from 'react';
import type { BatchRun, RecoveryLog } from '../../types/transit';
import { CheckCircle2, ChevronDown, ChevronUp, RotateCcw, IndianRupee, Shield } from 'lucide-react';

interface Props {
  batchRun: BatchRun | null;
  logs: RecoveryLog[];
  onRunAnother: () => void;
}

const SKIP_REASON_LABELS: Record<string, string> = {
  already_recovered: 'Already Recovered',
  max_attempts: 'Max Attempts (3)',
  below_threshold: 'Below ₹50 Threshold',
  too_old: 'Older than 30 Days',
  escalated: 'Already Escalated',
};

const BatchResultsPanel: React.FC<Props> = ({ batchRun, logs, onRunAnother }) => {
  const [showAudit, setShowAudit] = useState(false);

  if (!batchRun) return null;

  const recoveryRate =
    batchRun.sessionsAttempted > 0
      ? Math.round((batchRun.sessionsRecovered / batchRun.sessionsAttempted) * 100)
      : 0;

  const skipEntries = Object.entries(batchRun.skipReasons || {}).filter(([, v]) => (v as number) > 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
          <CheckCircle2 className="w-6 h-6 text-emerald-400" />
        </div>
        <div>
          <h2 className="text-white font-bold text-xl">Batch Run Complete ✓</h2>
          <p className="text-slate-400 text-sm">{batchRun.batchRunId} · {new Date(batchRun.startedAt).toLocaleString()}</p>
        </div>
      </div>

      {/* 5 metrics */}
      <div className="grid grid-cols-5 gap-2">
        {[
          { label: 'Scanned', value: batchRun.sessionsScanned, color: 'text-slate-300' },
          { label: 'Attempted', value: batchRun.sessionsAttempted, color: 'text-blue-300' },
          { label: 'Skipped', value: batchRun.sessionsSkipped, color: 'text-yellow-300' },
          { label: 'Escalated', value: batchRun.sessionsEscalated, color: 'text-orange-300' },
          { label: 'Recovered', value: batchRun.sessionsRecovered, color: 'text-emerald-300' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
            <p className={`text-2xl font-black ${color}`}>{value}</p>
            <p className="text-slate-500 text-xs mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Big recovery box */}
      <div className="bg-gradient-to-r from-emerald-600/20 to-teal-600/20 border border-emerald-500/30 rounded-2xl p-6 flex items-center justify-between">
        <div>
          <p className="text-emerald-300 text-sm font-medium mb-1">Amount Recovered</p>
          <div className="flex items-center text-5xl font-black text-white">
            <IndianRupee className="w-9 h-9" />
            {batchRun.amountRecovered.toLocaleString('en-IN')}
          </div>
          <p className="text-emerald-400 text-sm mt-1">
            out of ₹{batchRun.amountAtRisk.toLocaleString('en-IN')} at risk
          </p>
        </div>
        <div className="text-right">
          <p className="text-slate-400 text-sm mb-1">Recovery Rate</p>
          <p className={`text-5xl font-black ${recoveryRate >= 50 ? 'text-emerald-400' : recoveryRate >= 30 ? 'text-yellow-400' : 'text-red-400'}`}>
            {recoveryRate}%
          </p>
        </div>
      </div>

      {/* Compliance safeguards */}
      {skipEntries.length > 0 && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-blue-400" />
            <h3 className="text-white font-semibold text-sm">Compliance Safeguards Applied</h3>
          </div>
          <div className="space-y-2">
            {skipEntries.map(([reason, count]) => (
              <div key={reason} className="flex items-center justify-between text-sm">
                <span className="text-slate-400">{SKIP_REASON_LABELS[reason] || reason}</span>
                <span className="text-yellow-300 font-semibold">{count as number} sessions skipped</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Audit log toggle */}
      <div>
        <button
          id="toggleAuditLog"
          onClick={() => setShowAudit(!showAudit)}
          className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm transition"
        >
          {showAudit ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          View Full Audit Log ({logs.length} entries)
        </button>

        {showAudit && (
          <div className="mt-3 overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-white/5 border-b border-white/10">
                  {['Session', 'Bus', 'Amount', 'Reason', 'Status', 'Message'].map((h) => (
                    <th key={h} className="text-left text-slate-400 px-3 py-2">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log._id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="px-3 py-2 font-mono text-slate-400">{log.sessionId.slice(-8)}</td>
                    <td className="px-3 py-2 text-slate-300">{log.busNumber}</td>
                    <td className="px-3 py-2 text-white">₹{log.amount}</td>
                    <td className="px-3 py-2 text-slate-300">{log.failureReason}</td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-0.5 rounded-full ${
                        log.status === 'recovered' ? 'bg-emerald-500/20 text-emerald-300' :
                        log.status === 'sent' ? 'bg-blue-500/20 text-blue-300' :
                        log.status === 'skipped' ? 'bg-slate-500/20 text-slate-400' :
                        log.status === 'escalated' ? 'bg-orange-500/20 text-orange-300' :
                        'bg-red-500/20 text-red-300'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-slate-400 max-w-xs truncate">{log.aiMessage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Run another button */}
      <button
        id="runAnotherBatch"
        onClick={onRunAnother}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl px-5 py-3 transition shadow-lg shadow-blue-600/30"
      >
        <RotateCcw className="w-4 h-4" />
        Run Another Batch
      </button>
    </div>
  );
};

export default BatchResultsPanel;
