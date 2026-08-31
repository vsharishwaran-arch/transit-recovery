import { useState, useEffect } from "react";
import { conductorApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import type { TicketSession } from "../types/transit";

type ConductorView = "ticket" | "qr" | "failed";

// ── QR Code Component ─────────────────────────────────────────
function QRCodeImage({ url, payUrl }: { url?: string; payUrl?: string }) {
  const qrImage = url || `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(payUrl || 'upi://pay')}`;
  return (
    <img src={qrImage} alt="UPI QR Code" className="w-[220px] h-[220px] rounded-lg" />
  );
}

// ── Ticket Form ───────────────────────────────────────────────
function TicketForm({ onGenerate }: { onGenerate: (data: { session: TicketSession; paymentLink: string; qrCode: string }) => void }) {
  const { user } = useAuth();
  const [passengers, setPassengers] = useState(2);
  const [payMethod, setPayMethod] = useState<"upi" | "cash">("upi");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const FARE = 35;
  const total = passengers * FARE;
  const busNumber = user?.assignedBus || "TN01-AB-1234";

  async function handleCreateTicket() {
    setLoading(true);
    setError("");
    try {
      // Default to Route 47C (Koyambedu -> Tambaram) ID or fallback
      const routeId = typeof user?.assignedRoute === "string" ? user.assignedRoute : (user?.assignedRoute as any)?._id || "47C";
      const res = await conductorApi.createTicket(
        routeId,
        busNumber,
        passengers,
        payMethod,
        { vehicleSpeed: 55, networkStrength: "weak", passengerLoad: "medium" }
      );

      if (res.data.success) {
        onGenerate({
          session: res.data.session,
          paymentLink: res.data.paymentLink || `https://rzp.io/demo/${res.data.session.sessionId}`,
          qrCode: res.data.qrCode || `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(res.data.paymentLink || 'upi://pay')}`,
        });
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to create ticket session.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="h-full flex flex-col overflow-y-auto">
      {/* Page header */}
      <div className="px-8 pt-8 pb-6 border-b border-[#F1F5F9] flex-shrink-0">
        <h2 className="text-[#0F172A] text-[22px] font-black mb-1">Issue Ticket</h2>
        <p className="text-[#94A3B8] text-[13px]">Route 47C · Koyambedu → Tambaram</p>
      </div>

      <div className="flex-1 px-8 py-7 grid grid-cols-[1fr_360px] gap-7">
        {/* Left — form */}
        <div className="space-y-6">
          {/* Conductor info */}
          <div className="flex items-center gap-4 bg-[#F8FAFC] rounded-2xl px-5 py-4 border border-[#E2E8F0]">
            <div className="w-10 h-10 rounded-xl bg-[#DBEAFE] flex items-center justify-center text-[#1D4ED8] font-black text-[15px]">
              {user?.name?.[0] || "C"}
            </div>
            <div>
              <p className="text-[#0F172A] text-[14px] font-bold">{user?.name || "Rajan K"} <span className="text-[#94A3B8] font-normal text-[12px]">· Conductor</span></p>
              <p className="text-[#94A3B8] text-[12px]">ID: {user?.employeeId || "TNSTC-2891"} · Morning shift</p>
            </div>
            <div className="ml-auto bg-[#F0FDF4] border border-[#BBF7D0] rounded-full px-3 py-1">
              <p className="text-[#15803D] text-[11px] font-bold">On duty</p>
            </div>
          </div>

          {error && (
            <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-2xl p-4 text-[#B91C1C] text-[13px]">
              {error}
            </div>
          )}

          {/* Bus info */}
          <div>
            <p className="text-[#94A3B8] text-[11px] font-black uppercase tracking-widest mb-3">Bus Details</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Bus Number", value: busNumber, mono: true },
                { label: "Route", value: "47C" },
                { label: "Destination", value: "Tambaram" },
              ].map(f => (
                <div key={f.label} className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl px-4 py-3">
                  <p className="text-[#94A3B8] text-[10px] font-semibold uppercase tracking-wide mb-1">{f.label}</p>
                  <p className="text-[#0F172A] text-[14px] font-bold" style={f.mono ? { fontFamily: "JetBrains Mono, monospace" } : {}}>{f.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Passengers */}
          <div>
            <p className="text-[#94A3B8] text-[11px] font-black uppercase tracking-widest mb-3">Number of Passengers</p>
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 flex items-center gap-8" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
              <button onClick={() => setPassengers(Math.max(1, passengers - 1))}
                className="w-12 h-12 rounded-xl bg-[#F1F5F9] text-[#1E293B] text-[22px] font-light flex items-center justify-center hover:bg-[#E2E8F0] transition-colors active:scale-95">−</button>
              <div className="flex-1 text-center">
                <span className="text-[#0F172A] font-black" style={{ fontSize: 48, fontFamily: "JetBrains Mono, monospace", lineHeight: 1 }}>{passengers}</span>
                <p className="text-[#94A3B8] text-[12px] mt-1">passengers</p>
              </div>
              <button onClick={() => setPassengers(Math.min(20, passengers + 1))}
                className="w-12 h-12 rounded-xl text-white text-[22px] font-light flex items-center justify-center active:scale-95 transition-all"
                style={{ background: "linear-gradient(135deg, #3B82F6, #1D4ED8)" }}>+</button>
              <div className="ml-4 pl-6 border-l border-[#F1F5F9]">
                <p className="text-[#94A3B8] text-[12px] mb-1">Base fare</p>
                <p className="text-[#1E293B] text-[15px] font-bold" style={{ fontFamily: "JetBrains Mono, monospace" }}>₹{FARE} / person</p>
              </div>
            </div>
          </div>

          {/* Payment method */}
          <div>
            <p className="text-[#94A3B8] text-[11px] font-black uppercase tracking-widest mb-3">Payment Method</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: "upi" as const,  emoji: "📱", label: "UPI / QR Code",   sub: "GPay, PhonePe, Paytm" },
                { id: "cash" as const, emoji: "💵", label: "Cash Payment",    sub: "Collect exact fare" },
              ].map(m => (
                <button key={m.id} onClick={() => setPayMethod(m.id)}
                  className={`flex items-center gap-4 px-5 py-4 rounded-2xl border-2 text-left transition-all ${payMethod===m.id ? "border-[#1A56DB] bg-[#EFF6FF]" : "border-[#E2E8F0] hover:border-[#CBD5E1] bg-white"}`}>
                  <span className="text-2xl">{m.emoji}</span>
                  <div>
                    <p className={`text-[14px] font-bold ${payMethod===m.id ? "text-[#1D4ED8]" : "text-[#1E293B]"}`}>{m.label}</p>
                    <p className="text-[#94A3B8] text-[11px]">{m.sub}</p>
                  </div>
                  {payMethod===m.id && (
                    <div className="ml-auto w-5 h-5 rounded-full bg-[#1A56DB] flex items-center justify-center">
                      <svg width="9" height="9" fill="none" stroke="white" strokeWidth="3" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right — fare summary */}
        <div className="flex flex-col gap-5">
          {/* Fare card */}
          <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
            <p className="text-[#94A3B8] text-[11px] font-black uppercase tracking-widest mb-5">Fare Summary</p>
            <div className="space-y-3 mb-5">
              <div className="flex justify-between items-center text-[14px]">
                <span className="text-[#64748B]">Base fare</span>
                <span className="text-[#1E293B] font-semibold" style={{ fontFamily: "JetBrains Mono, monospace" }}>₹{FARE}</span>
              </div>
              <div className="flex justify-between items-center text-[14px]">
                <span className="text-[#64748B]">Passengers</span>
                <span className="text-[#1E293B] font-semibold" style={{ fontFamily: "JetBrains Mono, monospace" }}>× {passengers}</span>
              </div>
              <div className="border-t border-[#F1F5F9] pt-3 flex justify-between items-center">
                <span className="text-[#0F172A] text-[15px] font-black">Total</span>
                <span className="font-black text-[#059669]" style={{ fontSize: 32, fontFamily: "JetBrains Mono, monospace", lineHeight: 1 }}>₹{total}</span>
              </div>
            </div>

            {/* Route summary */}
            <div className="bg-[#F8FAFC] rounded-2xl p-4 space-y-2 text-[12px] text-[#64748B]">
              <div className="flex justify-between"><span>Route</span><span className="font-semibold text-[#1E293B]">47C</span></div>
              <div className="flex justify-between"><span>Bus</span><span className="font-semibold text-[#1E293B]" style={{ fontFamily: "JetBrains Mono, monospace" }}>{busNumber}</span></div>
              <div className="flex justify-between"><span>Date</span><span className="font-semibold text-[#1E293B]">Aug 28, 2026</span></div>
              <div className="flex justify-between"><span>Payment</span><span className="font-semibold text-[#1E293B] capitalize">{payMethod === "upi" ? "UPI / QR" : "Cash"}</span></div>
            </div>
          </div>

          {/* Generate button */}
          <button onClick={handleCreateTicket} disabled={loading}
            className="w-full max-w-[240px] mx-auto h-[56px] rounded-2xl text-white text-[15px] font-black transition-all hover:opacity-90 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #1A56DB, #1D4ED8)", boxShadow: "0 8px 24px rgba(26,86,219,0.35)" }}>
            {loading ? "Generating..." : "Generate Ticket"}
            <svg width="18" height="18" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </button>

          <p className="text-[#94A3B8] text-[11px] text-center">
            {payMethod === "upi" ? "A UPI QR code will be generated for the passenger to scan" : "Collect ₹" + total + " cash from the passenger"}
          </p>
        </div>
      </div>
    </div>
  );
}

// ── QR Payment Panel ──────────────────────────────────────────
function QRPanel({ ticketData, onBack, onFailed, onSuccess }: {
  ticketData: { session: TicketSession; paymentLink: string; qrCode: string } | null;
  onBack: () => void; onFailed: () => void; onSuccess: () => void;
}) {
  const [status, setStatus] = useState<"waiting" | "success" | "failed">("waiting");
  const session = ticketData?.session;
  const sessionId = session?.sessionId;
  const amount = session?.amount || 70;
  const busNumber = session?.busNumber || "TN01-AB-1234";
  const passengerCount = session?.passengerCount || 2;

  useEffect(() => {
    if (!sessionId) return;
    const interval = setInterval(async () => {
      try {
        const res = await conductorApi.getStatus(sessionId);
        if (res.data.status === "paid") {
          setStatus("success");
          clearInterval(interval);
          setTimeout(onSuccess, 1500);
        } else if (["failed", "cancelled", "expired"].includes(res.data.status)) {
          setStatus("failed");
          clearInterval(interval);
          setTimeout(onFailed, 1000);
        }
      } catch {}
    }, 3000);
    return () => clearInterval(interval);
  }, [sessionId, onSuccess, onFailed]);

  async function handleCancel() {
    if (sessionId) {
      try {
        await conductorApi.cancelTicket(sessionId);
      } catch {}
    }
    onBack();
  }

  const cfg = {
    waiting: { ring: "#3B82F6", label: "Waiting for payment…",  labelColor: "#F59E0B" },
    success: { ring: "#059669", label: "Payment received! ✓",   labelColor: "#059669" },
    failed:  { ring: "#EF4444", label: "Payment failed",         labelColor: "#EF4444" },
  }[status];

  return (
    <div className="h-full flex items-center justify-center bg-[#F0F4F8] px-8 py-8">
      <div className="flex gap-8 w-full max-w-[900px]">
        {/* QR card */}
        <div className="flex-1 bg-white rounded-3xl p-8 flex flex-col items-center" style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.08)" }}>
          <div className="mb-6 text-center">
            <p className="text-[#0F172A] text-[13px] font-bold mb-1 uppercase tracking-widest text-[#94A3B8]">Scan to Pay</p>
            <p className="font-black text-[#0F172A]" style={{ fontSize: 52, fontFamily: "JetBrains Mono, monospace", lineHeight: 1 }}>₹{amount}</p>
            <p className="text-[#94A3B8] text-[13px] mt-1">{passengerCount} passengers · Route 47C · {busNumber}</p>
          </div>

          <div className="relative">
            <div className="rounded-2xl p-4 bg-white relative" style={{
              boxShadow: `0 0 0 4px ${cfg.ring}, 0 12px 40px rgba(0,0,0,0.12)`,
              transition: "box-shadow 0.4s ease",
            }}>
              <QRCodeImage url={ticketData?.qrCode} payUrl={ticketData?.paymentLink} />
              {status !== "waiting" && (
                <div className="absolute inset-0 rounded-xl flex items-center justify-center"
                  style={{ background: status === "success" ? "rgba(240,253,244,0.92)" : "rgba(254,242,242,0.92)" }}>
                  <div className="w-20 h-20 rounded-full flex items-center justify-center"
                    style={{ background: cfg.ring }}>
                    {status === "success"
                      ? <svg width="36" height="36" fill="none" stroke="white" strokeWidth="3" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>
                      : <svg width="36" height="36" fill="none" stroke="white" strokeWidth="3" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>}
                  </div>
                </div>
              )}
            </div>
          </div>

          <p className="text-[#94A3B8] text-[12px] mt-4">Scan with any UPI app — GPay, PhonePe, Paytm</p>

          <div className="mt-4 flex items-center gap-2">
            {status === "waiting" && <span className="w-2 h-2 rounded-full bg-[#F59E0B] pulse-dot inline-block" />}
            <p className="text-[14px] font-semibold" style={{ color: cfg.labelColor }}>{cfg.label}</p>
          </div>

          {ticketData?.paymentLink && (
            <div className="mt-3 text-center">
              <a href={ticketData.paymentLink} target="_blank" rel="noreferrer" className="text-[11px] text-[#3B82F6] underline">
                Open Payment Link
              </a>
            </div>
          )}

          <button onClick={handleCancel} className="mt-6 text-[#94A3B8] text-[12px] hover:text-[#64748B] transition-colors">
            Cancel & Go Back
          </button>
        </div>

        {/* Right — info */}
        <div className="w-[300px] flex flex-col gap-5">
          <div className="bg-white rounded-3xl p-6 border border-[#E2E8F0]">
            <p className="text-[#94A3B8] text-[10px] font-black uppercase tracking-widest mb-4">Journey Details</p>
            <div className="space-y-3 text-[13px]">
              {[
                ["From", "Koyambedu"],
                ["To", "Tambaram"],
                ["Route", "47C"],
                ["Bus", busNumber],
                ["Passengers", String(passengerCount)],
                ["Amount", `₹${amount}`],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-[#94A3B8]">{k}</span>
                  <span className="text-[#1E293B] font-semibold" style={{ fontFamily: "JetBrains Mono, monospace" }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Failed Payment Card ───────────────────────────────────────
function FailedPanel({ ticketData, onRetry, onCash }: {
  ticketData: { session: TicketSession } | null;
  onRetry: () => void; onCash: () => void;
}) {
  const session = ticketData?.session;
  const amount = session?.amount || 70;
  const busNumber = session?.busNumber || "TN01-AB-1234";

  return (
    <div className="h-full flex items-center justify-center bg-[#F0F4F8] px-8 py-8">
      <div className="flex gap-8 w-full max-w-[900px]">
        {/* Main failure card */}
        <div className="flex-1 bg-white rounded-3xl p-8" style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.08)" }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-[#FEF2F2] flex items-center justify-center">
              <svg width="18" height="18" fill="none" stroke="#EF4444" strokeWidth="2.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            </div>
            <div>
              <p className="text-[#B91C1C] text-[12px] font-black uppercase tracking-wider">Payment Failed</p>
              <p className="text-[#64748B] text-[12px]">Transaction could not be completed</p>
            </div>
          </div>

          <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-2xl px-6 py-5 mb-6">
            <p className="text-[#EF4444] font-black mb-0.5" style={{ fontSize: 40, fontFamily: "JetBrains Mono, monospace", lineHeight: 1 }}>₹{amount}</p>
            <p className="text-[#94A3B8] text-[13px] mt-1">not collected from passenger</p>
          </div>

          {/* Context */}
          <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-2xl px-5 py-4 mb-6 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#FEF3C7] flex items-center justify-center flex-shrink-0">
              <svg width="14" height="14" fill="none" stroke="#D97706" strokeWidth="2" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
            <div>
              <p className="text-[#92400E] text-[13px] font-bold mb-0.5">Network Handoff Detected</p>
              <p className="text-[#B45309] text-[12px]">Bus moving at 55 km/h — tower switch interrupted transaction. Agent will recover automatically.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button onClick={onRetry} className="h-12 rounded-2xl text-white text-[14px] font-black transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #1A56DB, #1D4ED8)" }}>
              Retry UPI Payment
            </button>
            <button onClick={onCash} className="h-12 rounded-2xl text-[#1E293B] text-[14px] font-semibold border-2 border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors">
              Accept Cash Instead
            </button>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="w-[280px] space-y-4">
          <div className="bg-white rounded-3xl p-5 border border-[#E2E8F0]">
            <p className="text-[#94A3B8] text-[10px] font-black uppercase tracking-widest mb-4">AI Recovery Action</p>
            <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-2xl p-4 mb-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-5 h-5 rounded-lg bg-[#DBEAFE] flex items-center justify-center">
                  <svg width="10" height="10" fill="none" stroke="#1D4ED8" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                </div>
                <p className="text-[#1D4ED8] text-[11px] font-bold">WhatsApp Recovery</p>
              </div>
              <p className="text-[#1E293B] text-[12px] italic leading-relaxed">
                "Bus {busNumber} mein aapka ₹{amount} ka UPI payment fail ho gaya..."
              </p>
            </div>
            <p className="text-[#94A3B8] text-[11px]">Message will be sent automatically to the passenger's number.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Root Component ────────────────────────────────────────────
export default function ConductorApp({ onLogout }: { onLogout: () => void }) {
  const { user } = useAuth();
  const [view, setView] = useState<ConductorView>("ticket");
  const [ticketData, setTicketData] = useState<{ session: TicketSession; paymentLink: string; qrCode: string } | null>(null);

  const busNumber = user?.assignedBus || "TN01-AB-1234";

  return (
    <div className="h-full flex flex-col bg-[#F0F4F8]">
      {/* Top navbar */}
      <div className="bg-white border-b border-[#E2E8F0] flex-shrink-0 px-6 py-0 flex items-center" style={{ height: 56, boxShadow: "0 1px 0 #F1F5F9" }}>
        {/* Brand */}
        <div className="flex items-center gap-3 mr-8">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[11px] font-black"
            style={{ background: "linear-gradient(135deg, #3B82F6, #1D4ED8)" }}>T</div>
          <div>
            <p className="text-[#0F172A] text-[13px] font-bold leading-none">TNSTC Terminal</p>
            <p className="text-[#94A3B8] text-[10px]">Conductor Portal</p>
          </div>
        </div>

        {/* Bus badge */}
        <div className="flex items-center gap-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-2 mr-4">
          <svg width="14" height="14" fill="none" stroke="#3B82F6" strokeWidth="2" viewBox="0 0 24 24"><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h2l4 4v3h-6V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
          <span className="text-[#0F172A] text-[12px] font-bold" style={{ fontFamily: "JetBrains Mono, monospace" }}>{busNumber}</span>
        </div>
        <div className="flex items-center gap-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[#059669]" />
          <span className="text-[#64748B] text-[12px]">47C · Koyambedu → Tambaram</span>
        </div>

        {/* View tabs — 3D Glossy Animated Buttons */}
        <div className="flex items-center gap-3 ml-6">
          {([
            { id: "ticket" as ConductorView, label: "Issue Ticket" },
            { id: "qr"     as ConductorView, label: "QR Payment" },
            { id: "failed" as ConductorView, label: "Failed Card" },
          ]).map(t => (
            <button
              key={t.id}
              onClick={() => setView(t.id)}
              className={`Btn ${view === t.id ? "" : "Btn-inactive"}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        {/* Conductor info — Uiverse Styled Profile Card */}
        <div className="flex items-center px-3 py-1.5 bg-white rounded-2xl shadow-md border border-[#E2E8F0] mr-2">
          <section className="flex justify-center items-center w-9 h-9 rounded-full shadow-md bg-gradient-to-r from-[#F9C97C] to-[#A2E9C1] hover:from-[#C9A9E9] hover:to-[#7EE7FC] hover:cursor-pointer hover:scale-105 transition-all duration-300 flex-shrink-0">
            <svg viewBox="0 0 15 15" className="w-4 h-4 fill-gray-700">
              <path d="M7.5 0.875C5.49797 0.875 3.875 2.49797 3.875 4.5C3.875 6.15288 4.98124 7.54738 6.49373 7.98351C5.2997 8.12901 4.27557 8.55134 3.50407 9.31167C2.52216 10.2794 2.02502 11.72 2.02502 13.5999C2.02502 13.8623 2.23769 14.0749 2.50002 14.0749C2.76236 14.0749 2.97502 13.8623 2.97502 13.5999C2.97502 11.8799 3.42786 10.7206 4.17091 9.9883C4.91536 9.25463 6.02674 8.87499 7.49995 8.87499C8.97317 8.87499 10.0846 9.25463 10.8291 9.98831C11.5721 10.7206 12.025 11.8799 12.025 13.5999C12.025 13.8623 12.2376 14.0749 12.5 14.0749C12.7623 14.075 12.975 13.8623 12.975 13.6C12.975 11.72 12.4778 10.2794 11.4959 9.31166C10.7244 8.55135 9.70025 8.12903 8.50625 7.98352C10.0187 7.5474 11.125 6.15289 11.125 4.5C11.125 2.49797 9.50203 0.875 7.5 0.875ZM4.825 4.5C4.825 3.02264 6.02264 1.825 7.5 1.825C8.97736 1.825 10.175 3.02264 10.175 4.5C10.175 5.97736 8.97736 7.175 7.5 7.175C6.02264 7.175 4.825 5.97736 4.825 4.5Z" />
            </svg>
          </section>

          <section className="block border-l border-gray-300 ml-2.5 pl-2.5">
            <div>
              <h3 className="text-gray-800 font-extrabold text-[12px] leading-tight">{user?.name || "Rajan K"}</h3>
              <h3 className="bg-clip-text text-transparent bg-gradient-to-l from-[#005BC4] to-[#27272A] text-[10px] font-bold mt-0.5 whitespace-nowrap">
                TNSTC Conductor · On Duty
              </h3>
            </div>
          </section>
        </div>

        <button
          onClick={onLogout}
          className="group flex items-center justify-start w-11 h-11 bg-red-600 rounded-full cursor-pointer relative overflow-hidden transition-all duration-200 shadow-lg hover:w-28 hover:rounded-lg active:translate-x-1 active:translate-y-1 ml-2"
          title="Logout"
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

      {/* Main content */}
      <div className="flex-1 overflow-hidden">
        {view === "ticket" && (
          <TicketForm
            onGenerate={(data) => {
              setTicketData(data);
              setView("qr");
            }}
          />
        )}
        {view === "qr" && (
          <QRPanel
            ticketData={ticketData}
            onBack={() => setView("ticket")}
            onFailed={() => setView("failed")}
            onSuccess={() => setView("ticket")}
          />
        )}
        {view === "failed" && (
          <FailedPanel
            ticketData={ticketData}
            onRetry={() => setView("qr")}
            onCash={() => setView("ticket")}
          />
        )}
      </div>
    </div>
  );
}
