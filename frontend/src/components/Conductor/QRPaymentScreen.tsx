import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { conductorApi } from '../../services/api';
import type { TicketSession } from '../../types/transit';
import { CheckCircle2, XCircle, Loader2, IndianRupee, X } from 'lucide-react';

const QRPaymentScreen: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as { session: TicketSession; paymentLink: string; qrCode: string } | null;

  const [status, setStatus] = useState<string>(state?.session?.upiStatus || 'pending');
  const [polling, setPolling] = useState(true);

  const amount = state?.session?.amount || 0;
  const payUrl = state?.paymentLink || `upi://pay?pa=tnstc@upi&am=${amount}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(payUrl)}`;

  useEffect(() => {
    if (!sessionId || !polling) return;
    const interval = setInterval(async () => {
      try {
        const res = await conductorApi.getStatus(sessionId);
        setStatus(res.data.status);
        if (['paid', 'failed', 'cancelled', 'expired'].includes(res.data.status)) {
          setPolling(false);
          clearInterval(interval);
        }
      } catch {
        // silently continue polling
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [sessionId, polling]);


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Amount */}
        <div className="text-center mb-6">
          <p className="text-blue-300 text-sm uppercase tracking-widest mb-2">Amount Due</p>
          <div className="flex items-center justify-center text-6xl font-black text-white">
            <IndianRupee className="w-10 h-10" />
            {amount}
          </div>
        </div>

        {/* QR + status ring */}
        <div className="relative flex items-center justify-center mb-6">
          {/* Status ring */}
          <div
            className={`absolute inset-0 rounded-2xl transition-all duration-700 ${
              status === 'pending'
                ? 'shadow-[0_0_40px_8px_rgba(59,130,246,0.4)] animate-pulse'
                : status === 'paid'
                ? 'shadow-[0_0_40px_8px_rgba(34,197,94,0.5)]'
                : 'shadow-[0_0_40px_8px_rgba(239,68,68,0.4)]'
            }`}
          />

          {status === 'paid' ? (
            <div className="bg-emerald-500/20 border border-emerald-500/40 rounded-2xl p-12 flex flex-col items-center gap-4">
              <CheckCircle2 className="w-24 h-24 text-emerald-400 animate-bounce" />
              <p className="text-emerald-300 font-bold text-xl">Payment Successful!</p>
            </div>
          ) : status === 'failed' || status === 'cancelled' || status === 'expired' ? (
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-12 flex flex-col items-center gap-4">
              <XCircle className="w-24 h-24 text-red-400" />
              <p className="text-red-300 font-bold text-xl capitalize">{status.replace('_', ' ')}</p>
              <p className="text-red-200 text-sm text-center">Recovery agent will follow up</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-3 shadow-2xl">
              <img
                src={qrUrl}
                alt="UPI QR Code"
                className="w-64 h-64"
              />
            </div>
          )}
        </div>

        {/* Status indicator */}
        {status === 'pending' && (
          <div className="flex items-center justify-center gap-2 text-blue-300 mb-4">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Waiting for payment...</span>
          </div>
        )}

        {/* Payment link */}
        {status === 'pending' && state?.paymentLink && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 mb-4 text-center">
            <p className="text-blue-300 text-xs mb-1">Or share this link</p>
            <a
              href={state.paymentLink}
              target="_blank"
              rel="noreferrer"
              className="text-blue-400 text-xs underline break-all"
            >
              {state.paymentLink}
            </a>
          </div>
        )}

        {/* Cancel button */}
        <button
          id="cancelPayment"
          onClick={() => navigate('/conductor')}
          className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl py-3 transition"
        >
          <X className="w-4 h-4" />
          {status === 'paid' ? 'New Ticket' : 'Cancel & Go Back'}
        </button>
      </div>
    </div>
  );
};

export default QRPaymentScreen;
