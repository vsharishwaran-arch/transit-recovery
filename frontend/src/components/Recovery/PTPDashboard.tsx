import { useState, useEffect, useCallback } from 'react';
import { ptpApi } from '../../services/api';
import type { PromiseToPay, PTPStats } from '../../types/transit';
import Spinner from '../Common/Spinner';

export default function PTPDashboard() {
  const [activePtps, setActivePtps] = useState<PromiseToPay[]>([]);
  const [historyPtps, setHistoryPtps] = useState<PromiseToPay[]>([]);
  const [stats, setStats] = useState<PTPStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [now, setNow] = useState<number>(Date.now());

  const loadData = useCallback(async () => {
    try {
      const [activeRes, historyRes, statsRes] = await Promise.all([
        ptpApi.getActive(),
        ptpApi.getHistory(),
        ptpApi.getStats(),
      ]);

      setActivePtps(activeRes.data.ptps || []);
      setHistoryPtps(historyRes.data.ptps || []);
      setStats(statsRes.data.stats || null);
    } catch (err) {
      console.error('Failed to load PTP dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    // Live countdown timer update every 1 second
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    // Refresh API data every 15 seconds
    const interval = setInterval(loadData, 15000);

    return () => {
      clearInterval(timer);
      clearInterval(interval);
    };
  }, [loadData]);

  async function handleMarkPaid(ptpId: string) {
    try {
      const res = await ptpApi.markPaid(ptpId);
      if (res.data.success) {
        await loadData();
      }
    } catch {
      alert('Failed to mark PTP as paid.');
    }
  }

  function getCountdownDisplay(expiresAtStr: string) {
    const diffMs = new Date(expiresAtStr).getTime() - now;
    if (diffMs <= 0) {
      return <span className="bg-[#FEF2F2] text-[#EF4444] text-[11px] font-bold px-2.5 py-1 rounded-full animate-pulse">EXPIRED</span>;
    }
    const minutes = Math.floor(diffMs / 60000);
    const seconds = Math.floor((diffMs % 60000) / 1000);
    const formatted = `${minutes}m ${seconds < 10 ? '0' : ''}${seconds}s`;

    if (minutes < 2) {
      return <span className="text-[#EF4444] font-bold text-[12px] animate-pulse" style={{ fontFamily: 'JetBrains Mono, monospace' }}>⏳ {formatted}</span>;
    }
    if (minutes < 5) {
      return <span className="text-[#D97706] font-bold text-[12px]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>⏱️ {formatted}</span>;
    }
    return <span className="text-[#059669] font-bold text-[12px]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>🟢 {formatted}</span>;
  }

  if (loading) {
    return (
      <div className="py-12 text-center text-[#94A3B8] text-sm flex items-center justify-center gap-3">
        <Spinner size={22} color="#3B82F6" />
        Loading Promise-to-Pay Tracker...
      </div>
    );
  }

  const successRate = stats?.successRate || 0;
  const successColor = successRate >= 50 ? '#059669' : successRate >= 20 ? '#D97706' : '#EF4444';

  return (
    <div className="space-y-6">
      {/* Stats Row (3 Cards) */}
      <div className="grid grid-cols-3 gap-4">
        {/* Card 1 — Active Promises */}
        <div className="bg-white rounded-2xl p-5 border border-[#E2E8F0] shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FEF3C7] flex items-center justify-center text-xl">
              ⏰
            </div>
            <div>
              <p className="text-[#94A3B8] text-[11px] font-bold uppercase tracking-wider">Active Promises</p>
              <h3 className="text-[#0F172A] text-2xl font-black" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                {stats?.activePTPs || 0}
              </h3>
            </div>
          </div>
          <p className="text-[#D97706] text-[12px] font-semibold">
            ₹{stats?.amountPending || 0} pending collection
          </p>
        </div>

        {/* Card 2 — PTP Success Rate */}
        <div className="bg-white rounded-2xl p-5 border border-[#E2E8F0] shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-2xl bg-[#F0FDF4] flex items-center justify-center text-xl">
              📈
            </div>
            <div>
              <p className="text-[#94A3B8] text-[11px] font-bold uppercase tracking-wider">PTP Success Rate</p>
              <h3 className="text-2xl font-black" style={{ color: successColor, fontFamily: 'JetBrains Mono, monospace' }}>
                {successRate}%
              </h3>
            </div>
          </div>
          <p className="text-[#64748B] text-[12px]">
            {stats?.totalResolved || 0} collected after promise
          </p>
        </div>

        {/* Card 3 — Expired/Escalated */}
        <div className="bg-white rounded-2xl p-5 border border-[#E2E8F0] shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FEF2F2] flex items-center justify-center text-xl">
              ⚠️
            </div>
            <div>
              <p className="text-[#94A3B8] text-[11px] font-bold uppercase tracking-wider">Expired / Escalated</p>
              <h3 className="text-[#EF4444] text-2xl font-black" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                {stats?.totalExpired || 0}
              </h3>
            </div>
          </div>
          <p className="text-[#64748B] text-[12px]">moved to escalated queue</p>
        </div>
      </div>

      {/* Active Promises Table */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-[#F1F5F9] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-[#0F172A] text-sm font-bold">Active Promises</h3>
            <span className="text-[#94A3B8] text-xs font-normal">• Most Urgent First</span>
          </div>
          <span className="bg-[#FEF3C7] text-[#D97706] text-[11px] font-bold px-2.5 py-0.5 rounded-full">
            {activePtps.length} Active
          </span>
        </div>

        {activePtps.length === 0 ? (
          <div className="py-12 text-center text-[#94A3B8] text-xs space-y-1">
            <span className="text-3xl block mb-2">⏰</span>
            <p className="font-bold text-[#64748B]">No Active Promises</p>
            <p>Conductors can record passenger promises from the terminal</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ background: '#F8FAFC' }}>
                {['Bus No', 'Route', 'Amount', 'Promised', 'Expires In', 'Notes', 'Action'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] uppercase tracking-widest text-[#94A3B8] font-semibold whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activePtps.map((ptp) => {
                const route = ptp.routeId;
                const routeLabel = typeof route === 'object' && route ? `${route.from} → ${route.to}` : 'Route 47C';
                const minutesAgo = Math.max(0, Math.floor((now - new Date(ptp.promisedAt).getTime()) / 60000));

                return (
                  <tr key={ptp._id} className="border-t border-[#F8FAFC] hover:bg-[#FAFBFF] transition-colors">
                    <td className="px-4 py-3.5 text-[12px] font-bold text-[#0F172A]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                      {ptp.busNumber}
                    </td>
                    <td className="px-4 py-3.5 text-[12px] text-[#64748B]">{routeLabel}</td>
                    <td className="px-4 py-3.5 text-[13px] font-extrabold text-[#0F172A]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                      ₹{ptp.amount}
                    </td>
                    <td className="px-4 py-3.5 text-[12px] text-[#94A3B8]">{minutesAgo}m ago ({ptp.promisedMinutes}m set)</td>
                    <td className="px-4 py-3.5">{getCountdownDisplay(ptp.expiresAt)}</td>
                    <td className="px-4 py-3.5 text-[12px] text-[#64748B] max-w-[160px] truncate" title={ptp.notes || ''}>
                      {ptp.notes || '—'}
                    </td>
                    <td className="px-4 py-3.5">
                      <button
                        onClick={() => handleMarkPaid(ptp._id)}
                        className="bg-[#10B981] hover:bg-[#059669] text-white text-[11px] font-bold px-3 py-1.5 rounded-xl transition-all shadow-sm active:scale-95 flex items-center gap-1"
                      >
                        ✓ Mark Paid
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* PTP History Table */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-[#F1F5F9]">
          <h3 className="text-[#0F172A] text-sm font-bold">Promise History</h3>
        </div>

        {historyPtps.length === 0 ? (
          <div className="py-8 text-center text-[#94A3B8] text-xs">No PTP history recorded yet.</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ background: '#F8FAFC' }}>
                {['Bus No', 'Amount', 'Promised At', 'Minutes Given', 'Status', 'Resolved At'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] uppercase tracking-widest text-[#94A3B8] font-semibold whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {historyPtps.map((ptp) => (
                <tr key={ptp._id} className="border-t border-[#F8FAFC] hover:bg-[#FAFBFF] transition-colors">
                  <td className="px-4 py-3 text-[12px] font-semibold text-[#64748B]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                    {ptp.busNumber}
                  </td>
                  <td className="px-4 py-3 text-[12px] font-bold text-[#0F172A]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                    ₹{ptp.amount}
                  </td>
                  <td className="px-4 py-3 text-[12px] text-[#94A3B8]">
                    {new Date(ptp.promisedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-4 py-3 text-[12px] text-[#64748B]">{ptp.promisedMinutes} mins</td>
                  <td className="px-4 py-3">
                    {ptp.status === 'paid' && <span className="bg-[#F0FDF4] text-[#15803D] text-[11px] font-bold px-2.5 py-0.5 rounded-full">Paid ✓</span>}
                    {ptp.status === 'expired' && <span className="bg-[#FEF2F2] text-[#EF4444] text-[11px] font-bold px-2.5 py-0.5 rounded-full">Expired</span>}
                    {ptp.status === 'escalated' && <span className="bg-[#FEF3C7] text-[#D97706] text-[11px] font-bold px-2.5 py-0.5 rounded-full">Escalated</span>}
                    {ptp.status === 'active' && <span className="bg-[#EFF6FF] text-[#1D4ED8] text-[11px] font-bold px-2.5 py-0.5 rounded-full animate-pulse">Active</span>}
                  </td>
                  <td className="px-4 py-3 text-[12px] text-[#94A3B8]">
                    {ptp.paidAt
                      ? new Date(ptp.paidAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : ptp.escalatedAt
                      ? new Date(ptp.escalatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
