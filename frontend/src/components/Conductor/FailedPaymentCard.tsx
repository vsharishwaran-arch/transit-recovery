import React from 'react';
import type { TicketSession } from '../../types/transit';
import { AlertTriangle, RefreshCw, Banknote, Clock } from 'lucide-react';

interface Props {
  session: TicketSession;
  onRetryUPI: () => void;
  onAcceptCash: () => void;
}

const failureLabels: Record<string, string> = {
  network_handoff: 'Network handoff — bus was moving fast',
  peak_load: 'Peak hour server congestion',
  insufficient_funds: 'Passenger low balance',
  user_cancelled: 'Passenger cancelled payment',
  timeout: 'Payment link expired',
  unknown: 'Payment could not be processed',
};

const FailedPaymentCard: React.FC<Props> = ({ session, onRetryUPI, onAcceptCash }) => {
  return (
    <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-5 space-y-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="w-5 h-5 text-red-400" />
        </div>
        <div>
          <h3 className="text-white font-bold text-lg">Payment Failed</h3>
          <p className="text-red-300 text-sm mt-0.5">
            {failureLabels[session.providerStatus || 'unknown'] || failureLabels.unknown}
          </p>
        </div>
      </div>

      {/* Amount */}
      <div className="bg-white/5 rounded-xl p-3 flex justify-between items-center">
        <span className="text-blue-200 text-sm">Amount</span>
        <span className="text-white font-bold text-xl">₹{session.amount}</span>
      </div>

      {/* Recovery message */}
      <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
        <Clock className="w-4 h-4 text-blue-400 flex-shrink-0" />
        <p className="text-blue-200 text-xs">
          Recovery agent will send a follow-up message to the passenger automatically.
        </p>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3">
        <button
          id="retryUPI"
          onClick={onRetryUPI}
          className="flex flex-col items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl py-3 transition shadow-lg shadow-blue-600/30"
        >
          <RefreshCw className="w-5 h-5" />
          <span className="text-sm font-medium">Retry UPI</span>
        </button>
        <button
          id="acceptCash"
          onClick={onAcceptCash}
          className="flex flex-col items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl py-3 transition shadow-lg shadow-emerald-600/30"
        >
          <Banknote className="w-5 h-5" />
          <span className="text-sm font-medium">Accept Cash</span>
        </button>
      </div>
    </div>
  );
};

export default FailedPaymentCard;
