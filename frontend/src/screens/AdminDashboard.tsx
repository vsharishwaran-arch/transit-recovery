import { useState, useEffect, useCallback, Fragment } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import { recoveryApi, agentApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import type { RecoveryStats, TicketSession, RecoveryLog, BatchRun } from "../types/transit";

const FAILURE_COLORS: Record<string, string> = {
  network_handoff: "#3B82F6",
  peak_load: "#F97316",
  insufficient_funds: "#EF4444",
  user_cancelled: "#8B5CF6",
  webhook_dropout: "#06B6D4",
  timeout: "#EAB308",
  unknown: "#6B7280",
};

const FAILURE_LABELS: Record<string, string> = {
  network_handoff: "Network Handoff",
  peak_load: "Peak Load",
  insufficient_funds: "Low Balance",
  user_cancelled: "Cancelled",
  webhook_dropout: "Ticket Lost",
  timeout: "Timeout",
  unknown: "Unknown",
};

// ── Shared Badges ─────────────────────────────────────────────
function Badge({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span className="inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold" style={{ color, background: bg }}>
      {label}
    </span>
  );
}

function FailureBadge({ type }: { type: string }) {
  const map: Record<string, [string, string, string]> = {
    network_handoff: ["Network Handoff", "#1D4ED8", "#EFF6FF"],
    peak_load: ["Peak Load", "#C2410C", "#FFF7ED"],
    insufficient_funds: ["Low Balance", "#B91C1C", "#FEF2F2"],
    user_cancelled: ["Cancelled", "#6D28D9", "#F5F3FF"],
    webhook_dropout: ["Ticket Lost", "#0E7490", "#ECFEFF"],
    timeout: ["Timeout", "#A16207", "#FEFCE8"],
    unknown: ["Unknown", "#475569", "#F1F5F9"],
  };
  const [label, color, bg] = map[type] || [type, "#475569", "#F1F5F9"];
  return <Badge label={label} color={color} bg={bg} />;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, [string, string, string]> = {
    failed: ["Failed", "#B91C1C", "#FEF2F2"],
    escalated: ["Escalated", "#B45309", "#FFFBEB"],
    recovered: ["Recovered ✓", "#15803D", "#F0FDF4"],
    pending: ["AI Sent", "#1D4ED8", "#EFF6FF"],
    cancelled: ["Cancelled", "#6D28D9", "#F5F3FF"],
    completed: ["Completed", "#15803D", "#F0FDF4"],
  };
  const [label, color, bg] = map[status] || [status, "#475569", "#F1F5F9"];
  return <Badge label={label} color={color} bg={bg} />;
}

function LangBadge({ lang }: { lang?: string }) {
  if (!lang) return null;
  const map: Record<string, [string, string, string]> = {
    hinglish: ["HI/EN", "#C2410C", "#FFF7ED"],
    english: ["EN", "#1D4ED8", "#EFF6FF"],
    tamil: ["தமிழ்", "#15803D", "#F0FDF4"],
    HI: ["HI/EN", "#C2410C", "#FFF7ED"],
    EN: ["EN", "#1D4ED8", "#EFF6FF"],
    TA: ["தமிழ்", "#15803D", "#F0FDF4"],
  };
  const [label, color, bg] = map[lang] || [lang.toUpperCase(), "#475569", "#F1F5F9"];
  return <Badge label={label} color={color} bg={bg} />;
}

// ── Chart Tooltip ─────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] px-3 py-2 shadow-lg text-[12px]">
      <p className="font-semibold text-[#1E293B] mb-0.5">{label}</p>
      <p className="text-[#3B82F6]">{payload[0].value} sessions</p>
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────
function StatCard({ icon, iconGrad, label, value, valueColor, sub, progress }: {
  icon: React.ReactNode; iconGrad: [string, string]; label: string;
  value: string; valueColor: string; sub: string; progress?: number;
}) {
  return (
    <div className="bg-white rounded-2xl p-5" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06), 0 0 0 1px #F1F5F9" }}>
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ background: `linear-gradient(135deg, ${iconGrad[0]}, ${iconGrad[1]})` }}>
          {icon}
        </div>
        <span className="text-[11px] text-[#94A3B8] font-medium">Live</span>
      </div>
      <p className="text-[#94A3B8] text-[11px] uppercase tracking-wider font-semibold mb-1">{label}</p>
      <p className="font-bold mb-1" style={{ fontSize: 26, color: valueColor, fontFamily: "JetBrains Mono, monospace", lineHeight: 1.15 }}>{value}</p>
      {progress !== undefined && (
        <div className="my-2 h-1.5 rounded-full overflow-hidden" style={{ background: "#F1F5F9" }}>
          <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${progress}%`, background: progress >= 50 ? "#059669" : progress >= 20 ? "#F59E0B" : "#EF4444" }} />
        </div>
      )}
      <p className="text-[#94A3B8] text-[12px]">{sub}</p>
    </div>
  );
}

// ── Agent Config Modal ────────────────────────────────────────
function AgentConfigModal({ onClose, onRun }: { onClose: () => void; onRun: (config: { batchSize: number; language: string; routeFilter: string }) => void }) {
  const [batchSize, setBatchSize] = useState(20);
  const [lang, setLang] = useState<"hinglish" | "tamil" | "english">("hinglish");
  const [route, setRoute] = useState("all");

  const routes = [
    { id: "all", label: "All Routes" },
    { id: "47C", label: "47C — Koyambedu → Tambaram" },
    { id: "21B", label: "21B — Central → Guindy" },
    { id: "108", label: "108 — Madurai → Dindigul" },
    { id: "78A", label: "78A — Coimbatore → Tiruppur" },
    { id: "15C", label: "15C — Salem → Namakkal" },
  ];

  const langConfig = {
    english: { label: "EN", name: "English", color: "#1D4ED8" },
    hinglish: { label: "HI/EN", name: "Hinglish", color: "#C2410C" },
    tamil: { label: "தமிழ்", name: "Tamil", color: "#15803D" },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)" }}>
      <div className="bg-white rounded-3xl w-full max-w-[500px] max-h-[90vh] overflow-hidden flex flex-col" style={{ boxShadow: "0 24px 64px rgba(0,0,0,0.18)" }}>
        {/* Sticky Header */}
        <div className="px-7 pt-6 pb-4 border-b border-[#F1F5F9] flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-[#0F172A] text-xl font-bold">Configure Recovery Agent</h2>
            <p className="text-[#94A3B8] text-[12px] mt-0.5">Set parameters for this batch run</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-[#F1F5F9] flex items-center justify-center text-[#64748B] hover:bg-[#E2E8F0] transition-colors text-[13px]">✕</button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto flex-1 px-7 py-5 space-y-5">
          {/* Enhanced Batch Size Increaser UI */}
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-4 space-y-3.5" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
            <div className="flex items-center justify-between">
              <label className="text-[#0F172A] text-[13px] font-bold">Batch Size</label>
              <div className="flex items-center gap-1.5 bg-[#EFF6FF] border border-[#BFDBFE] rounded-full px-3 py-1">
                <span className="text-[#1D4ED8] text-[13px] font-black" style={{ fontFamily: "JetBrains Mono, monospace" }}>{batchSize}</span>
                <span className="text-[#3B82F6] text-[11px] font-medium">sessions</span>
              </div>
            </div>

            {/* Stepper controls + Styled Range slider */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setBatchSize(Math.max(5, batchSize - 5))}
                className="w-9 h-9 rounded-xl bg-white border border-[#CBD5E1] text-[#1E293B] font-bold text-[16px] hover:bg-[#F1F5F9] active:scale-95 transition-all flex items-center justify-center shadow-sm"
                title="Decrease batch size by 5"
              >
                −
              </button>

              <div className="flex-1 relative flex items-center">
                <input
                  type="range"
                  min={5}
                  max={50}
                  step={5}
                  value={batchSize}
                  onChange={e => setBatchSize(+e.target.value)}
                  className="w-full h-2 rounded-lg bg-[#E2E8F0] appearance-none cursor-pointer accent-[#3B82F6]"
                />
              </div>

              <button
                type="button"
                onClick={() => setBatchSize(Math.min(50, batchSize + 5))}
                className="w-9 h-9 rounded-xl bg-[#3B82F6] text-white font-bold text-[16px] hover:bg-[#2563EB] active:scale-95 transition-all flex items-center justify-center shadow-sm"
                title="Increase batch size by 5"
              >
                +
              </button>
            </div>

            {/* Quick preset selector pills */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#E2E8F0]">
              <span className="text-[#94A3B8] text-[10px] uppercase font-bold tracking-wider">Quick Presets:</span>
              <div className="flex gap-1.5">
                {[10, 20, 30, 50].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setBatchSize(val)}
                    className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${batchSize === val ? "bg-[#3B82F6] text-white shadow-sm" : "bg-white border border-[#E2E8F0] text-[#64748B] hover:text-[#1E293B] hover:border-[#CBD5E1]"}`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[#0F172A] text-[13px] font-semibold mb-2">Recovery Language</label>
            <div className="grid grid-cols-3 gap-2">
              {(["hinglish", "tamil", "english"] as const).map(l => (
                <button key={l} onClick={() => setLang(l)} className={`py-3 rounded-xl border-2 text-center transition-all ${lang === l ? "border-[#3B82F6] bg-[#EFF6FF]" : "border-[#E2E8F0]"}`}>
                  <p className="text-[15px] font-bold" style={{ color: lang === l ? langConfig[l].color : "#94A3B8" }}>{langConfig[l].label}</p>
                  <p className="text-[10px] text-[#94A3B8] mt-0.5">{langConfig[l].name}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[#0F172A] text-[13px] font-semibold mb-2">Route Filter</label>
            <select value={route} onChange={e => setRoute(e.target.value)} className="w-full h-11 border border-[#E2E8F0] rounded-xl px-4 text-[#0F172A] text-[13px] bg-white outline-none focus:border-[#3B82F6] transition-colors">
              {routes.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
            </select>
          </div>

          <div className="rounded-xl px-4 py-3.5" style={{ background: "linear-gradient(135deg, #EFF6FF, #F0FDF4)" }}>
            <p className="text-[#1E293B] text-[12px] leading-relaxed">
              Agent will scan up to <strong>{batchSize}</strong> sessions on <strong>{route === "all" ? "All Routes" : `Route ${route}`}</strong>, send <strong>{langConfig[lang].name}</strong> messages via Gemini, and apply 5 compliance safeguards.
            </p>
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="px-7 py-4 border-t border-[#F1F5F9] flex gap-3 flex-shrink-0 bg-white">
          <button onClick={onClose} className="h-11 px-5 rounded-xl text-[#64748B] text-[13px] font-semibold bg-[#F8FAFC] hover:bg-[#F1F5F9] transition-colors">Cancel</button>
          <button onClick={() => onRun({ batchSize, language: lang, routeFilter: route })} className="btn-run-agent flex-1 h-11">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
            Run Recovery Agent
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Batch Results Modal ───────────────────────────────────────
function BatchResultsModal({ batchData, onClose }: { batchData: { batch: BatchRun; logs: RecoveryLog[] } | null; onClose: () => void }) {
  const [auditOpen, setAuditOpen] = useState(false);
  const b = batchData?.batch;
  const logs = batchData?.logs || [];

  const scanned = b?.sessionsScanned || 0;
  const attempted = b?.sessionsAttempted || 0;
  const skipped = b?.sessionsSkipped || 0;
  const escalated = b?.sessionsEscalated || 0;
  const recovered = b?.sessionsRecovered || 0;
  const amountRecovered = b?.amountRecovered || 0;
  const rate = scanned > 0 ? Math.round((recovered / scanned) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)" }}>
      <div className="bg-white rounded-3xl w-full max-w-[640px] max-h-[88vh] overflow-hidden flex flex-col" style={{ boxShadow: "0 24px 64px rgba(0,0,0,0.18)" }}>
        <div className="px-7 pt-7 pb-4 border-b border-[#F1F5F9] flex items-start justify-between flex-shrink-0">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <h2 className="text-[#0F172A] text-xl font-bold">Batch Run Complete</h2>
              <span className="bg-[#F0FDF4] text-[#15803D] text-[11px] font-bold px-2.5 py-0.5 rounded-full">✓ Done</span>
            </div>
            <p className="text-[#94A3B8] text-[11px]" style={{ fontFamily: "JetBrains Mono, monospace" }}>
              {b?.batchRunId || "batch_run"} · {b?.language || "hinglish"} · {b?.routeFilter || "all"}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-[#F1F5F9] flex items-center justify-center text-[#64748B] hover:bg-[#E2E8F0] transition-colors text-[13px]">✕</button>
        </div>

        <div className="overflow-y-auto flex-1 px-7 py-5 space-y-5">
          <div className="grid grid-cols-5 gap-2">
            {[["Scanned", scanned], ["Attempted", attempted], ["Skipped", skipped], ["Escalated", escalated], ["Recovered", recovered]].map(([l, v]) => (
              <div key={l as string} className="bg-[#F8FAFC] rounded-2xl py-3 px-2 text-center">
                <p className="text-[#94A3B8] text-[10px] font-medium mb-1">{l}</p>
                <p className="text-[#0F172A] text-xl font-bold" style={{ fontFamily: "JetBrains Mono, monospace" }}>{v}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl px-6 py-5 flex items-center justify-between" style={{ background: "linear-gradient(135deg, #F0FDF4, #DCFCE7)", border: "1px solid #BBF7D0" }}>
            <div>
              <p className="text-[#059669] font-bold" style={{ fontSize: 36, fontFamily: "JetBrains Mono, monospace", lineHeight: 1 }}>₹{amountRecovered}</p>
              <p className="text-[#15803D] text-[13px] mt-1">recovered from {recovered} sessions</p>
            </div>
            <div className="text-right">
              <div className="bg-white rounded-xl px-3 py-2 inline-block" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                <p className="text-[#15803D] text-[18px] font-bold">{rate}%</p>
                <p className="text-[#94A3B8] text-[10px]">Recovery rate</p>
              </div>
            </div>
          </div>

          <div>
            <p className="text-[#94A3B8] text-[11px] uppercase tracking-widest font-semibold mb-3">Compliance Safeguards</p>
            <div className="bg-[#F8FAFC] rounded-2xl overflow-hidden text-[13px]">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#F1F5F9]">
                <span>Automated attempt limit (max 3)</span>
                <span className="text-[#94A3B8]">Active</span>
              </div>
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#F1F5F9]">
                <span>Session age limit (&lt; 30 days)</span>
                <span className="text-[#94A3B8]">Active</span>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <span>Minimum fare threshold (&gt;= ₹50)</span>
                <span className="text-[#94A3B8]">Active</span>
              </div>
            </div>
          </div>

          {logs.length > 0 && (
            <div>
              <button onClick={() => setAuditOpen(!auditOpen)} className="flex items-center gap-2 text-[#3B82F6] text-[13px] font-semibold hover:underline">
                {auditOpen ? "▾ Hide Audit Log" : "▸ Show Full Audit Log (" + logs.length + " logs)"}
              </button>
              {auditOpen && (
                <div className="mt-3 border border-[#E2E8F0] rounded-2xl overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-[#F8FAFC]">
                        {["Bus No", "Amount", "Reason", "Lang", "Status"].map(h => (
                          <th key={h} className="px-3 py-2 text-left text-[10px] uppercase tracking-widest text-[#94A3B8] font-semibold">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((log) => (
                        <tr key={log._id} className="border-t border-[#F1F5F9]">
                          <td className="px-3 py-2.5 text-[12px] font-semibold text-[#0F172A]" style={{ fontFamily: "JetBrains Mono, monospace" }}>{log.busNumber}</td>
                          <td className="px-3 py-2.5 text-[12px] font-bold" style={{ fontFamily: "JetBrains Mono, monospace" }}>₹{log.amount}</td>
                          <td className="px-3 py-2.5 text-[12px] text-[#64748B]">{FAILURE_LABELS[log.failureReason] || log.failureReason}</td>
                          <td className="px-3 py-2.5"><LangBadge lang={log.messageLanguage} /></td>
                          <td className="px-3 py-2.5"><StatusBadge status={log.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-7 pb-6 pt-3 border-t border-[#F1F5F9] flex gap-3 flex-shrink-0">
          <button onClick={onClose} className="flex-1 h-10 rounded-xl text-white text-[13px] font-bold" style={{ background: "linear-gradient(135deg, #3B82F6, #1D4ED8)" }}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Tab: Failed Sessions ──────────────────────────────────────
function FailedSessionsTab({ sessions }: { sessions: TicketSession[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filtered = sessions.filter(s =>
    s.busNumber?.toLowerCase().includes(search.toLowerCase()) ||
    (typeof s.routeId === "object" && s.routeId?.routeNumber?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-[#0F172A] text-[14px] font-bold">{sessions.length} failed / unpaid sessions</p>
        <div className="flex items-center gap-2">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="13" height="13" fill="none" stroke="#94A3B8" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search bus or route…" className="h-9 border border-[#E2E8F0] rounded-xl pl-8 pr-3 text-[12px] outline-none focus:border-[#3B82F6] text-[#0F172A] placeholder:text-[#94A3B8] w-48 transition-colors" />
          </div>
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden bg-white" style={{ border: "1px solid #E2E8F0" }}>
        <table className="w-full">
          <thead>
            <tr style={{ background: "#F8FAFC" }}>
              {["Bus No", "Route", "Amount", "Failure", "Load", "Status", "Action"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-[10px] uppercase tracking-widest text-[#94A3B8] font-semibold whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-[#94A3B8] text-[13px]">
                  No failed sessions found.
                </td>
              </tr>
            ) : (
              filtered.map(s => {
                const routeObj = typeof s.routeId === "object" ? s.routeId : null;
                const routeNum = routeObj?.routeNumber || "47C";
                const from = routeObj?.from || "Koyambedu";
                const to = routeObj?.to || "Tambaram";
                const failureType = s.providerStatus === "timeout" ? (s.vehicleSpeed > 40 ? "network_handoff" : "peak_load") : (s.providerStatus || "user_cancelled");
                const isExpanded = expanded === s._id;
                const aiMsg = s.latestLog?.aiMessage || `Arre passenger, aapki ₹${s.amount} ki payment Bus ${s.busNumber} (Route ${routeNum}) mein retry karein: https://pay.tnstc.in/retry/${s.sessionId}`;
                const aiLang = s.latestLog?.messageLanguage || "hinglish";

                return (
                  <Fragment key={s._id}>
                    <tr className="border-t border-[#F8FAFC] hover:bg-[#FAFBFF] transition-colors">
                      <td className="px-4 py-3.5 text-[12px] font-bold text-[#0F172A] whitespace-nowrap" style={{ fontFamily: "JetBrains Mono, monospace" }}>{s.busNumber}</td>
                      <td className="px-4 py-3.5">
                        <p className="text-[12px] text-[#1E293B] font-medium">{from} → {to}</p>
                        <p className="text-[10px] text-[#94A3B8] mt-0.5">Route {routeNum} · {s.vehicleSpeed || 0} km/h</p>
                      </td>
                      <td className="px-4 py-3.5 text-[14px] font-bold text-[#0F172A]" style={{ fontFamily: "JetBrains Mono, monospace" }}>₹{s.amount}</td>
                      <td className="px-4 py-3.5"><FailureBadge type={failureType} /></td>
                      <td className="px-4 py-3.5">
                        <span className={`text-[11px] font-semibold capitalize ${s.passengerLoad === "overcrowded" ? "text-red-500" : s.passengerLoad === "high" ? "text-orange-500" : "text-[#94A3B8]"}`}>{s.passengerLoad || "medium"}</span>
                      </td>
                      <td className="px-4 py-3.5"><StatusBadge status={s.upiStatus} /></td>
                      <td className="px-4 py-3.5">
                        <button onClick={() => setExpanded(isExpanded ? null : s._id)} className="text-[#3B82F6] text-[12px] font-semibold hover:underline whitespace-nowrap flex items-center gap-1">
                          <span>AI Msg</span>
                          <span>{isExpanded ? "▲" : "▾"}</span>
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="border-t border-[#F1F5F9] bg-[#F0F7FF]">
                        <td colSpan={7} className="px-6 py-4">
                          <div className="bg-white border border-[#BFDBFE] rounded-2xl p-4 space-y-3 shadow-sm">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="bg-[#1D4ED8] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">Gemini AI Prompt</span>
                                <LangBadge lang={aiLang} />
                              </div>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(aiMsg);
                                  alert("Copied AI Message to clipboard!");
                                }}
                                className="text-[11px] text-[#3B82F6] font-semibold hover:underline flex items-center gap-1"
                              >
                                📋 Copy Message
                              </button>
                            </div>

                            <p className="text-[#1E293B] text-[13px] italic font-medium leading-relaxed bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3">
                              "{aiMsg}"
                            </p>

                            <div className="flex items-center justify-between text-[11px] text-[#64748B]">
                              <span>Detected Reason: <strong>{FAILURE_LABELS[failureType] || failureType}</strong></span>
                              <span>Session Ref: <strong style={{ fontFamily: "JetBrains Mono, monospace" }}>{s.sessionId}</strong></span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Tab: Escalated ────────────────────────────────────────────
function EscalatedTab({ escalated, onRefresh }: { escalated: RecoveryLog[]; onRefresh: () => void }) {
  async function handleMarkRecovered(logId: string) {
    try {
      await recoveryApi.markAsRecovered(logId);
      onRefresh();
    } catch {}
  }

  if (!escalated.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-[#E2E8F0]">
        <div className="w-16 h-16 rounded-2xl bg-[#F0FDF4] flex items-center justify-center mb-4">
          <svg width="28" height="28" fill="none" stroke="#059669" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/></svg>
        </div>
        <p className="text-[#0F172A] text-[16px] font-bold mb-1">All clear — no escalated items</p>
        <p className="text-[#94A3B8] text-[13px]">The recovery agent is handling automated follow-ups</p>
      </div>
    );
  }

  return (
    <div>
      <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-2xl px-4 py-3.5 mb-5 flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-[#FEF3C7] flex items-center justify-center flex-shrink-0">
          <svg width="15" height="15" fill="none" stroke="#D97706" strokeWidth="2" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        </div>
        <p className="text-[#92400E] text-[13px] font-medium"><strong>{escalated.length} sessions</strong> need manual follow-up — 3 automated attempts failed</p>
      </div>
      <div className="rounded-2xl overflow-hidden bg-white" style={{ border: "1px solid #E2E8F0" }}>
        <table className="w-full">
          <thead>
            <tr style={{ background: "#F8FAFC" }}>
              {["Bus", "Amount", "Failure Reason", "Attempts", "AI Message", "Action"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-[10px] uppercase tracking-widest text-[#94A3B8] font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {escalated.map(log => (
              <tr key={log._id} className="border-t border-[#F8FAFC] hover:bg-[#FAFBFF] transition-colors">
                <td className="px-4 py-3.5 text-[12px] font-bold text-[#0F172A]" style={{ fontFamily: "JetBrains Mono, monospace" }}>{log.busNumber}</td>
                <td className="px-4 py-3.5 text-[13px] font-bold text-[#0F172A]" style={{ fontFamily: "JetBrains Mono, monospace" }}>₹{log.amount}</td>
                <td className="px-4 py-3.5"><FailureBadge type={log.failureReason} /></td>
                <td className="px-4 py-3.5 text-[12px] text-[#64748B]">3 / 3</td>
                <td className="px-4 py-3.5 text-[12px] text-[#94A3B8] truncate max-w-[200px]">{log.aiMessage}</td>
                <td className="px-4 py-3.5">
                  <button onClick={() => handleMarkRecovered(log._id)} className="h-8 px-3 rounded-xl border border-[#059669] text-[#059669] text-[11px] font-semibold hover:bg-[#F0FDF4] transition-colors">
                    Mark Recovered
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Tab: Batch History ────────────────────────────────────────
function BatchHistoryTab({ batches }: { batches: BatchRun[] }) {
  if (!batches.length) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-[#E2E8F0] text-center text-[#94A3B8] text-[13px]">
        No batch runs executed yet. Click "Run Recovery Agent" to launch a batch.
      </div>
    );
  }

  return (
    <div className="rounded-2xl overflow-hidden bg-white" style={{ border: "1px solid #E2E8F0" }}>
      <table className="w-full">
        <thead>
          <tr style={{ background: "#F8FAFC" }}>
            {["Run ID", "Date", "Language", "Route", "Scanned", "Recovered", "₹ Recovered", "Rate", "Status"].map(h => (
              <th key={h} className="px-4 py-3 text-left text-[10px] uppercase tracking-widest text-[#94A3B8] font-semibold whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {batches.map(r => {
            const scanned = r.sessionsScanned || 0;
            const rec = r.sessionsRecovered || 0;
            const rate = scanned > 0 ? Math.round((rec / scanned) * 100) : 0;

            return (
              <tr key={r._id} className="border-t border-[#F8FAFC] hover:bg-[#FAFBFF] transition-colors">
                <td className="px-4 py-3.5 text-[11px] text-[#64748B]" style={{ fontFamily: "JetBrains Mono, monospace" }}>{r.batchRunId}</td>
                <td className="px-4 py-3.5 text-[12px] text-[#94A3B8]">{new Date(r.createdAt || Date.now()).toLocaleTimeString()}</td>
                <td className="px-4 py-3.5"><LangBadge lang={r.language} /></td>
                <td className="px-4 py-3.5 text-[12px] text-[#64748B]">{r.routeFilter || "All"}</td>
                <td className="px-4 py-3.5 text-[12px] text-[#0F172A] font-semibold" style={{ fontFamily: "JetBrains Mono, monospace" }}>{scanned}</td>
                <td className="px-4 py-3.5 text-[12px] text-[#0F172A] font-semibold" style={{ fontFamily: "JetBrains Mono, monospace" }}>{rec}</td>
                <td className="px-4 py-3.5 text-[13px] font-bold text-[#059669]" style={{ fontFamily: "JetBrains Mono, monospace" }}>₹{r.amountRecovered || 0}</td>
                <td className="px-4 py-3.5 text-[13px] font-bold" style={{ color: rate >= 50 ? "#059669" : rate >= 20 ? "#D97706" : "#EF4444", fontFamily: "JetBrains Mono, monospace" }}>{rate}%</td>
                <td className="px-4 py-3.5"><StatusBadge status={r.status} /></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Root Admin Dashboard ──────────────────────────────────────
export default function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const { user } = useAuth();
  const [activeNav, setActiveNav] = useState<"dashboard" | "failed" | "agent" | "escalated" | "history">("dashboard");
  const [showConfig, setShowConfig] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [running, setRunning] = useState(false);

  const [stats, setStats] = useState<RecoveryStats | null>(null);
  const [sessions, setSessions] = useState<TicketSession[]>([]);
  const [escalated, setEscalated] = useState<RecoveryLog[]>([]);
  const [batches, setBatches] = useState<BatchRun[]>([]);
  const [batchData, setBatchData] = useState<{ batch: BatchRun; logs: RecoveryLog[] } | null>(null);

  const loadAllData = useCallback(async () => {
    try {
      const [statsRes, sessRes, escRes, batchRes] = await Promise.all([
        recoveryApi.getStats(),
        recoveryApi.getFailedSessions({ page: 1, limit: 50 }),
        recoveryApi.getEscalated(),
        recoveryApi.getBatchHistory(),
      ]);

      setStats(statsRes.data.stats);
      setSessions(sessRes.data.sessions || []);
      setEscalated(escRes.data.escalated || []);
      setBatches(batchRes.data.batches || []);
    } catch {}
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  async function handleRunAgent(config: { batchSize: number; language: string; routeFilter: string }) {
    setShowConfig(false);
    setRunning(true);
    try {
      const res = await agentApi.runAgent(config.batchSize, config.language, config.routeFilter);
      if (res.data.success) {
        setBatchData({ batch: res.data.batchRun, logs: res.data.logs || [] });
        setShowResults(true);
        await loadAllData();
      }
    } catch {
      alert("Failed to run recovery agent.");
    } finally {
      setRunning(false);
    }
  }

  // Map backend failure breakdown to chart
  const chartData = (stats?.reasonBreakdown || []).map(b => ({
    name: FAILURE_LABELS[b._id] || b._id || "Unknown",
    count: b.count,
    key: b._id,
  }));

  const navItems = [
    { id: "dashboard" as const, icon: <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>, label: "Dashboard" },
    { id: "failed" as const, icon: <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>, label: "Failed Sessions" },
    { id: "escalated" as const, icon: <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>, label: "Escalated Queue", badge: escalated.length || undefined },
    { id: "history" as const, icon: <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>, label: "Batch History" },
  ];

  return (
    <div className="h-full flex overflow-hidden bg-[#F0F4F8] relative">
      {/* Top Floating Pop-up Notification Banner when Agent is Running */}
      {running && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-[#0F172A] border border-[#3B82F6] text-white rounded-2xl px-6 py-4 flex items-center gap-4 shadow-2xl"
          style={{ boxShadow: "0 16px 40px rgba(59,130,246,0.4), 0 0 0 1px rgba(59,130,246,0.5)" }}>
          <div className="w-10 h-10 rounded-xl bg-[#1D4ED8] flex items-center justify-center text-xl flex-shrink-0">
            <span className="spin inline-block">🤖</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse" />
              <p className="text-[14px] font-bold text-white">AI Recovery Agent is Running</p>
            </div>
            <p className="text-[12px] text-[#94A3B8] mt-0.5">Scanning failed sessions & generating Gemini LLM recovery messages...</p>
          </div>
          <div className="ml-4 pl-4 border-l border-white/10 flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-[#38BDF8] border-t-transparent rounded-full spin" />
            <span className="text-[12px] font-bold text-[#38BDF8]" style={{ fontFamily: "JetBrains Mono, monospace" }}>Processing</span>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <div className="w-[230px] bg-white flex flex-col flex-shrink-0 border-r border-[#E2E8F0]">
        <div className="px-5 py-5 border-b border-[#F1F5F9]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-[12px] font-black" style={{ background: "linear-gradient(135deg, #3B82F6, #1D4ED8)" }}>T</div>
            <div>
              <p className="text-[#0F172A] text-[13px] font-bold leading-tight">Transit Recovery</p>
              <p className="text-[#94A3B8] text-[10px]">TNSTC Admin Portal</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map(item => (
            <button key={item.id} onClick={() => setActiveNav(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${activeNav===item.id ? "bg-[#EFF6FF] text-[#1D4ED8]" : "text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#1E293B]"}`}>
              <span className={activeNav===item.id ? "text-[#3B82F6]" : "text-[#94A3B8]"}>{item.icon}</span>
              <span className="text-[12px] font-semibold flex-1">{item.label}</span>
              {item.badge ? <span className="bg-[#EF4444] text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">{item.badge}</span> : null}
            </button>
          ))}
          <div className="my-3 border-t border-[#F1F5F9]" />
          <div className="pt-2 flex justify-center">
            <button
              onClick={onLogout}
              className="group flex items-center justify-start w-11 h-11 bg-red-600 rounded-full cursor-pointer relative overflow-hidden transition-all duration-200 shadow-lg hover:w-28 hover:rounded-lg active:translate-x-1 active:translate-y-1"
              title={`Logout (${user?.name || "Admin"})`}
            >
              <div className="flex items-center justify-center w-full transition-all duration-300 group-hover:justify-start group-hover:px-3">
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 512 512" fill="white">
                  <path d="M377.9 105.9L500.7 228.7c7.2 7.2 11.3 17.1 11.3 27.3s-4.1 20.1-11.3 27.3L377.9 406.1c-6.4 6.4-15 9.9-24 9.9c-18.7 0-33.9-15.2-33.9-33.9l0-62.1-128 0c-17.7 0-32-14.3-32-32l0-64c0-17.7 14.3-32 32-32l128 0 0-62.1c0-18.7 15.2-33.9 33.9-33.9c9 0 17.6 3.6 24 9.9zM160 96L96 96c-17.7 0-32 14.3-32 32l0 256c0 17.7 14.3 32 32 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-64 0c-53 0-96-43-96-96L0 128C0 75 43 32 96 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32z" />
                </svg>
              </div>
              <div className="absolute right-3 transform translate-x-full opacity-0 text-white text-xs font-semibold transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 whitespace-nowrap">
                Logout
              </div>
            </button>
          </div>
        </nav>

        {/* Last batch card — Uiverse Expanding Circle Card */}
        {batches.length > 0 && (
          <div className="mx-3 mb-4">
            <div className="batch-notice-card">
              <div className="batch-number">
                <span className="badge-text">✓ AI</span>
              </div>
              <p className="batch-heading">Last Batch Run</p>
              <div className="batch-content">
                <p className="font-bold text-[#34D399] transition-colors duration-500 batch-content-amount" style={{ fontSize: 22, fontFamily: "JetBrains Mono, monospace" }}>
                  ₹{batches[0].amountRecovered || 0}
                </p>
                <p className="text-[#94A3B8] text-[10px] mt-0.5 transition-colors duration-500 batch-content-sub">
                  recovered from {batches[0].sessionsRecovered || 0} sessions
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[1020px] mx-auto px-7 py-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-[#0F172A] text-[22px] font-black mb-0.5">Revenue Recovery Dashboard</h1>
              <p className="text-[#94A3B8] text-[13px]">AI-powered UPI failure recovery · TNSTC Tamil Nadu</p>
            </div>
            <button onClick={() => setShowConfig(true)} disabled={running} className={`btn-run-agent ${running ? "is-loading opacity-85" : ""}`}>
              <svg viewBox="0 0 24 24" fill={running ? "none" : "currentColor"} stroke={running ? "currentColor" : "none"} strokeWidth={running ? "2.5" : "0"}>
                {running ? (
                  <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/>
                ) : (
                  <polygon points="5 3 19 12 5 21 5 3"/>
                )}
              </svg>
              {running ? "Running Agent..." : "Run Recovery Agent"}
            </button>
          </div>

          {activeNav === "dashboard" && (
            <>
              {/* Stat Cards */}
              <div className="grid grid-cols-4 gap-4">
                <StatCard
                  icon={<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/></svg>}
                  iconGrad={["#EF4444", "#DC2626"]}
                  label="Revenue at Risk"
                  value={`₹${(stats?.amountAtRisk || 0).toLocaleString("en-IN")}`}
                  valueColor="#EF4444"
                  sub={`${stats?.failedSessionCount || 0} failed / unpaid sessions`}
                />
                <StatCard
                  icon={<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>}
                  iconGrad={["#3B82F6", "#1D4ED8"]}
                  label="Recovery Attempted"
                  value={String(stats?.recoveryAttempted || 0)}
                  valueColor="#1D4ED8"
                  sub="sessions processed by agent"
                />
                <StatCard
                  icon={<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>}
                  iconGrad={["#10B981", "#059669"]}
                  label="Amount Recovered"
                  value={`₹${(stats?.amountRecovered || 0).toLocaleString("en-IN")}`}
                  valueColor="#059669"
                  sub={`${stats?.recoveredCount || 0} sessions recovered`}
                />
                <StatCard
                  icon={<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>}
                  iconGrad={["#8B5CF6", "#6D28D9"]}
                  label="Recovery Rate"
                  value={`${stats?.recoveryRate || 0}%`}
                  valueColor="#6D28D9"
                  sub="overall efficiency score"
                  progress={stats?.recoveryRate || 0}
                />
              </div>

              {/* Failure Breakdown Chart */}
              {chartData.length > 0 && (
                <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0]" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                  <p className="text-[#0F172A] text-[15px] font-bold mb-1">Failures by Root Cause</p>
                  <p className="text-[#94A3B8] text-[12px] mb-5">Telemetry-classified payment failure breakdown</p>
                  <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
                        <Tooltip content={<ChartTooltip />} />
                        <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={FAILURE_COLORS[entry.key] || "#3B82F6"} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Recent Sessions Table */}
              <FailedSessionsTab sessions={sessions} />
            </>
          )}

          {activeNav === "failed" && <FailedSessionsTab sessions={sessions} />}
          {activeNav === "escalated" && <EscalatedTab escalated={escalated} onRefresh={loadAllData} />}
          {activeNav === "history" && <BatchHistoryTab batches={batches} />}
        </div>
      </div>

      {/* Modals */}
      {showConfig && <AgentConfigModal onClose={() => setShowConfig(false)} onRun={handleRunAgent} />}
      {showResults && <BatchResultsModal batchData={batchData} onClose={() => setShowResults(false)} />}
    </div>
  );
}
