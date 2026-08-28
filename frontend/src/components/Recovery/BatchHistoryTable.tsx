import React from 'react';
import type { BatchRun } from '../../types/transit';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

interface Props {
  batches: BatchRun[];
  loading: boolean;
  onSelectBatch: (batchRunId: string) => void;
}

const LANG_LABELS: Record<string, string> = {
  hinglish: 'Hinglish',
  english: 'English',
  tamil: 'Tamil',
};

const BatchHistoryTable: React.FC<Props> = ({ batches, loading, onSelectBatch }) => {
  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 bg-white/5 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (batches.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        No batch runs yet — run the recovery agent to see history here.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-white/10">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-white/5 border-b border-white/10">
            {['Run ID', 'Date', 'Language', 'Scanned', 'Recovered', '₹ Recovered', 'Rate', 'Status'].map((h) => (
              <th key={h} className="text-left text-slate-400 font-medium px-4 py-3 whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {batches.map((batch) => {
            const rate =
              batch.sessionsAttempted > 0
                ? Math.round((batch.sessionsRecovered / batch.sessionsAttempted) * 100)
                : 0;

            return (
              <tr
                key={batch._id}
                id={`batchRow-${batch.batchRunId}`}
                className="border-b border-white/5 hover:bg-white/5 transition cursor-pointer"
                onClick={() => onSelectBatch(batch.batchRunId)}
              >
                <td className="px-4 py-3 font-mono text-xs text-blue-400">{batch.batchRunId.slice(-14)}</td>
                <td className="px-4 py-3 text-slate-300 whitespace-nowrap">
                  {new Date(batch.startedAt).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                  })}
                </td>
                <td className="px-4 py-3 text-slate-300">{LANG_LABELS[batch.language] || batch.language}</td>
                <td className="px-4 py-3 text-white">{batch.sessionsScanned}</td>
                <td className="px-4 py-3 text-emerald-300">{batch.sessionsRecovered}</td>
                <td className="px-4 py-3 text-emerald-400 font-semibold">
                  ₹{batch.amountRecovered.toLocaleString('en-IN')}
                </td>
                <td className="px-4 py-3">
                  <span className={`font-bold ${rate >= 50 ? 'text-emerald-400' : rate >= 30 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {rate}%
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`flex items-center gap-1 text-xs ${
                    batch.status === 'completed' ? 'text-emerald-400' :
                    batch.status === 'running' ? 'text-blue-400' :
                    'text-red-400'
                  }`}>
                    {batch.status === 'completed' ? <CheckCircle2 className="w-3 h-3" /> :
                     batch.status === 'running' ? <Loader2 className="w-3 h-3 animate-spin" /> :
                     <XCircle className="w-3 h-3" />}
                    {batch.status}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default BatchHistoryTable;
