import { useState } from 'react';
import { ptpApi } from '../../services/api';
import type { TicketSession } from '../../types/transit';

interface PTPModalProps {
  session: TicketSession | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function PTPModal({ session, onClose, onSuccess }: PTPModalProps) {
  const [promisedMinutes, setPromisedMinutes] = useState<number>(10);
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const amount = session?.amount || 70;
  const busNumber = session?.busNumber || 'TN01-AB-1234';
  const sessionId = session?.sessionId || 'sess_demo';
  const routeId = typeof session?.routeId === 'object' ? session.routeId._id : session?.routeId || '';
  const passengerCount = session?.passengerCount || 1;

  // Calculate dynamic expiration time preview
  const expiryTime = new Date(Date.now() + promisedMinutes * 60000).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  async function handleRecordPromise() {
    if (!sessionId) return;
    setLoading(true);
    try {
      const res = await ptpApi.create({
        sessionId,
        busNumber,
        routeId: typeof routeId === 'string' ? routeId : '',
        amount,
        passengerCount,
        promisedMinutes,
        notes: notes.trim() || undefined,
      });

      if (res.data.success) {
        setSuccessMsg(`Promise recorded! Expires at ${expiryTime}`);
        setTimeout(() => {
          if (onSuccess) onSuccess();
          onClose();
        }, 1800);
      }
    } catch {
      alert('Failed to record Promise to Pay.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="bg-[#1E293B] border border-[#334155] text-white rounded-3xl w-full max-w-[360px] p-7 shadow-2xl relative overflow-hidden"
        style={{ boxShadow: '0 24px 64px rgba(0, 0, 0, 0.5)' }}
      >
        {/* Success Overlay */}
        {successMsg ? (
          <div className="py-8 text-center space-y-4 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-[#10B981]/20 border-2 border-[#10B981] flex items-center justify-center mx-auto text-3xl">
              ✓
            </div>
            <h3 className="text-xl font-bold text-white">Promise Recorded!</h3>
            <p className="text-sm text-[#F59E0B] font-semibold">{successMsg}</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="text-center mb-5">
              <span className="text-4xl mb-2 inline-block">🤝</span>
              <h2 className="text-xl font-bold text-white">Record Promise to Pay</h2>
              <p className="text-xs text-[#94A3B8] mt-1">Passenger agreed to pay soon</p>
            </div>

            {/* Session Info Pill */}
            <div className="bg-[#0F172A] border border-[#334155] rounded-2xl px-4 py-3 mb-5 text-center">
              <p className="text-lg font-black text-[#34D399]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                ₹{amount} <span className="text-xs font-normal text-[#94A3B8]">· Bus {busNumber}</span>
              </p>
              <p className="text-[11px] text-[#94A3B8] mt-0.5">Route 47C (Koyambedu → Tambaram)</p>
            </div>

            {/* Minutes Selector Stepper */}
            <div className="space-y-3 mb-5">
              <label className="block text-xs font-semibold text-[#94A3B8] text-center uppercase tracking-wider">
                Passenger will pay in...
              </label>

              <div className="flex items-center justify-between bg-[#0F172A] border border-[#334155] rounded-2xl p-2">
                <button
                  type="button"
                  onClick={() => setPromisedMinutes(Math.max(5, promisedMinutes - 5))}
                  className="w-11 h-11 rounded-xl bg-[#334155] hover:bg-[#475569] text-white font-bold text-xl active:scale-95 transition-all flex items-center justify-center"
                >
                  −
                </button>
                <div className="text-center">
                  <span className="text-2xl font-black text-[#F1F5F9]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                    {promisedMinutes}
                  </span>
                  <span className="text-xs text-[#94A3B8] ml-1">minutes</span>
                </div>
                <button
                  type="button"
                  onClick={() => setPromisedMinutes(Math.min(60, promisedMinutes + 5))}
                  className="w-11 h-11 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold text-xl active:scale-95 transition-all flex items-center justify-center shadow-lg"
                >
                  +
                </button>
              </div>

              {/* Quick Presets */}
              <div className="grid grid-cols-4 gap-1.5 pt-1">
                {[5, 10, 15, 30].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setPromisedMinutes(val)}
                    className={`py-1.5 rounded-xl text-xs font-bold transition-all ${
                      promisedMinutes === val
                        ? 'bg-[#3B82F6] text-white shadow-md'
                        : 'bg-[#0F172A] border border-[#334155] text-[#94A3B8] hover:text-white'
                    }`}
                  >
                    {val} min
                  </button>
                ))}
              </div>

              {/* Expiry Dynamic Preview */}
              <p className="text-[11px] font-semibold text-[#F59E0B] text-center pt-1">
                ⏰ Promise expires at <strong>{expiryTime}</strong>
              </p>
            </div>

            {/* Notes field */}
            <div className="mb-6">
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notes (e.g. Will pay at Tambaram stop)"
                className="w-full h-11 bg-[#0F172A] border border-[#334155] rounded-xl px-3.5 text-xs text-white placeholder:text-[#64748B] outline-none focus:border-[#3B82F6] transition-colors"
              />
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleRecordPromise}
                disabled={loading}
                className="w-full h-12 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold text-sm transition-all shadow-lg active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? 'Recording...' : 'Record Promise →'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2 text-xs font-semibold text-[#94A3B8] hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
