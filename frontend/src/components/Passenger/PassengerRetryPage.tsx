import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { conductorApi } from '../../services/api';
import type { TicketSession } from '../../types/transit';
import { Bus, IndianRupee, Loader2, ExternalLink, CheckCircle2 } from 'lucide-react';

const PassengerRetryPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('sessionId');
  const [session, setSession] = useState<TicketSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paid, setPaid] = useState(false);

  useEffect(() => {
    if (!sessionId) {
      setError('No session ID provided');
      setLoading(false);
      return;
    }
    conductorApi.getStatus(sessionId)
      .then((res) => {
        setSession(res.data.session);
        if (res.data.status === 'paid') setPaid(true);
      })
      .catch(() => setError('Could not load payment details'))
      .finally(() => setLoading(false));
  }, [sessionId]);

  const route = session?.routeId && typeof session.routeId === 'object' ? session.routeId : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4 shadow-lg shadow-blue-500/30">
            <Bus className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Complete Your Payment</h1>
          <p className="text-blue-300 mt-1 text-sm">TNSTC Bus Ticketing</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
          </div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 text-center text-red-300">
            {error}
          </div>
        ) : paid ? (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-8 text-center">
            <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
            <h2 className="text-white font-bold text-xl">Payment Complete!</h2>
            <p className="text-emerald-300 mt-2">Thank you for travelling with TNSTC</p>
          </div>
        ) : session ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
            {/* Info */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Bus Number</span>
                <span className="text-white font-mono">{session.busNumber}</span>
              </div>
              {route && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Route</span>
                  <span className="text-white">{route.from} → {route.to}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Passengers</span>
                <span className="text-white">{session.passengerCount}</span>
              </div>
              <div className="flex justify-between text-sm border-t border-white/10 pt-2 mt-2">
                <span className="text-white font-semibold">Total Amount</span>
                <span className="text-white font-black text-xl flex items-center">
                  <IndianRupee className="w-4 h-4" />{session.amount}
                </span>
              </div>
            </div>

            {/* Pay button */}
            <a
              id="payNowBtn"
              href={`https://rzp.io/pay/${session.sessionId}`}
              target="_blank"
              rel="noreferrer"
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl py-4 flex items-center justify-center gap-2 transition shadow-lg shadow-blue-600/30"
            >
              <ExternalLink className="w-4 h-4" />
              Pay Now ₹{session.amount}
            </a>

            <p className="text-slate-500 text-xs text-center">
              Secure payment powered by Razorpay · TNSTC Government Service
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default PassengerRetryPage;
