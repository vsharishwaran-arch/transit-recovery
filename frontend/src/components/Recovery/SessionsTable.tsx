import React, { useState } from 'react';
import type { TicketSession } from '../../types/transit';
import { ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  sent: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  recovered: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  failed: 'bg-red-500/20 text-red-300 border-red-500/30',
  escalated: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  skipped: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  pending: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
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

const LANG_BADGE: Record<string, string> = {
  english: 'EN',
  hinglish: 'HI/EN',
  tamil: 'தமிழ்',
};

interface Props {
  sessions: TicketSession[];
  loading: boolean;
  total: number;
  page: number;
  onPageChange: (p: number) => void;
}

const SessionsTable: React.FC<Props> = ({ sessions, loading, total, page, onPageChange }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-14 bg-white/5 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        No failed sessions found. Great job! 🎉
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/5">
              {['Bus No', 'Route', 'Amount', 'Failure', 'Speed', 'Network', 'Load', 'Status', 'Action'].map((h) => (
                <th key={h} className="text-left text-slate-400 font-medium px-4 py-3 whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sessions.map((session) => {
              const log = session.latestLog;
              const routeObj = typeof session.routeId === 'object' ? session.routeId : null;
              const isExpanded = expandedId === session._id;

              return (
                <React.Fragment key={session._id}>
                  <tr className="border-b border-white/5 hover:bg-white/5 transition">
                    <td className="px-4 py-3 text-white font-mono text-xs">{session.busNumber}</td>
                    <td className="px-4 py-3 text-slate-300 whitespace-nowrap">
                      {routeObj ? `${routeObj.routeNumber}: ${routeObj.from}→${routeObj.to}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-white font-semibold">₹{session.amount}</td>
                    <td className="px-4 py-3 text-slate-300 whitespace-nowrap">
                      {log ? FAILURE_LABELS[log.failureReason] || log.failureReason : '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-300">{session.vehicleSpeed} km/h</td>
                    <td className="px-4 py-3 text-slate-300 capitalize">{session.networkStrength}</td>
                    <td className="px-4 py-3 text-slate-300 capitalize">{session.passengerLoad}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs border rounded-full px-2 py-0.5 ${
                          STATUS_COLORS[log?.status || 'pending']
                        }`}
                      >
                        {log?.status || 'unprocessed'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {log?.aiMessage && (
                        <button
                          id={`viewMsg-${session._id}`}
                          onClick={() => setExpandedId(isExpanded ? null : session._id)}
                          className="text-blue-400 hover:text-blue-300 flex items-center gap-1 text-xs"
                        >
                          AI Msg {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                      )}
                    </td>
                  </tr>

                  {/* Expanded AI message */}
                  {isExpanded && log?.aiMessage && (
                    <tr className="border-b border-white/5 bg-blue-950/30">
                      <td colSpan={9} className="px-4 py-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2 flex-1">
                            <span className="text-xs border border-blue-500/30 text-blue-300 rounded px-1.5 py-0.5 flex-shrink-0">
                              {LANG_BADGE[log.messageLanguage] || log.messageLanguage}
                            </span>
                            <p className="text-slate-300 text-sm italic">{log.aiMessage}</p>
                          </div>
                          <button
                            onClick={() => handleCopy(log.aiMessage, session._id)}
                            className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition flex-shrink-0"
                          >
                            {copied === session._id ? (
                              <><Check className="w-3 h-3 text-emerald-400" /> Copied</>
                            ) : (
                              <><Copy className="w-3 h-3" /> Copy</>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4 text-sm text-slate-400">
        <span>{total} sessions total</span>
        <div className="flex gap-2">
          <button
            id="prevPage"
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg disabled:opacity-40 text-white transition"
          >
            Prev
          </button>
          <span className="px-3 py-1.5 text-white">Page {page}</span>
          <button
            id="nextPage"
            onClick={() => onPageChange(page + 1)}
            disabled={sessions.length < 20}
            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg disabled:opacity-40 text-white transition"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionsTable;
