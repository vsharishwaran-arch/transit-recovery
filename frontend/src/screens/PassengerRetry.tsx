import { useState, useEffect } from "react";
import { conductorApi } from "../services/api";

export default function PassengerRetry() {
  const [amount, setAmount] = useState(70);
  const [passengers, setPassengers] = useState(2);
  const [busNumber, setBusNumber] = useState("TN01-AB-1234");
  const [routeNum] = useState("47C");
  const [from] = useState("Koyambedu");
  const [to] = useState("Tambaram");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("sessionId");
    const amt = params.get("amount");
    if (amt) setAmount(Number(amt));

    if (sessionId) {
      conductorApi.getStatus(sessionId).then((res) => {
        if (res.data.session) {
          setAmount(res.data.session.amount || 70);
          setPassengers(res.data.session.passengerCount || 2);
          setBusNumber(res.data.session.busNumber || "TN01-AB-1234");
        }
      }).catch(() => { });
    }
  }, []);

  function handlePay() {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
    }, 1500);
  }

  return (
    <div className="min-h-full flex flex-col bg-[#F0F4F8]">
      {/* Top bar */}
      <div className="bg-white border-b border-[#E2E8F0] px-8 py-4 flex items-center gap-3" style={{ boxShadow: "0 1px 0 #F1F5F9" }}>
        <div className="w-9 h-9 rounded-xl bg-[#FEF2F2] flex items-center justify-center">
          <span className="text-xl">🚍</span>
        </div>
        <div>
          <p className="text-[#C0392B] text-[15px] font-black">TNSTC Tamil Nadu</p>
          <p className="text-[#94A3B8] text-[11px]">Digital Ticketing</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-[#F0FDF4] border border-[#BBF7D0] rounded-full px-3 py-1.5">
            <svg width="11" height="11" fill="none" stroke="#059669" strokeWidth="2.5" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
            <span className="text-[#15803D] text-[11px] font-bold">Secured by Razorpay</span>
          </div>
          <div className="flex items-center gap-1.5 bg-[#EFF6FF] border border-[#BFDBFE] rounded-full px-3 py-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]" />
            <span className="text-[#1D4ED8] text-[11px] font-bold">Govt. Verified</span>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-start justify-center px-6 py-10 gap-8">
        {/* Left — journey details */}
        <div className="w-[500px] space-y-5">
          {/* Journey card */}
          <div className="rounded-3xl overflow-hidden" style={{ background: "linear-gradient(145deg, #0F172A, #1E3A8A)", boxShadow: "0 8px 32px rgba(15,23,42,0.2)" }}>
            <div className="px-8 pt-8 pb-6">
              <p className="text-[#64748B] text-[10px] font-black uppercase tracking-widest mb-5">Your Journey</p>

              {/* Route */}
              <div className="flex items-center gap-4 mb-8">
                <div className="flex-1">
                  <p className="text-white text-[24px] font-black">{from}</p>
                  <p className="text-[#64748B] text-[12px] mt-0.5">Origin</p>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-[#3B82F6]/20 border border-[#3B82F6]/30 flex items-center justify-center">
                    <svg width="16" height="16" fill="none" stroke="#3B82F6" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                  </div>
                  <span className="bg-[#3B82F6] text-white text-[10px] font-black px-2.5 py-0.5 rounded-full">{routeNum}</span>
                </div>
                <div className="flex-1 text-right">
                  <p className="text-white text-[24px] font-black">{to}</p>
                  <p className="text-[#64748B] text-[12px] mt-0.5">Destination</p>
                </div>
              </div>

              {/* Detail row */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: "🚌", label: "Bus", value: busNumber, mono: true },
                  { icon: "👥", label: "Passengers", value: String(passengers) },
                  { icon: "📅", label: "Date", value: "Today" },
                ].map(d => (
                  <div key={d.label} className="rounded-2xl px-4 py-3" style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
                    <p className="text-[#64748B] text-[10px] mb-1">{d.label}</p>
                    <p className="text-white text-[13px] font-bold" style={d.mono ? { fontFamily: "JetBrains Mono, monospace" } : {}}>{d.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Amount strip */}
            <div className="px-8 py-5 flex items-center justify-between" style={{ background: "rgba(255,255,255,0.05)", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
              <div>
                <p className="text-[#64748B] text-[11px] font-semibold uppercase tracking-wide mb-1">Total Fare</p>
                <p className="text-white font-black" style={{ fontSize: 44, fontFamily: "JetBrains Mono, monospace", lineHeight: 1 }}>₹{amount}</p>
              </div>
              <div className="text-right">
                <div className="bg-[#059669]/20 border border-[#059669]/30 rounded-2xl px-4 py-3">
                  <p className="text-[#34D399] text-[13px] font-bold">₹{Math.round(amount / passengers)} / person</p>
                  <p className="text-[#64748B] text-[10px] mt-0.5">Government Rate</p>
                </div>
              </div>
            </div>
          </div>

          {/* Warning notice */}
          <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-2xl px-5 py-4 flex items-start gap-4">
            <div className="w-9 h-9 rounded-xl bg-[#FEF3C7] flex items-center justify-center flex-shrink-0">
              <svg width="16" height="16" fill="none" stroke="#D97706" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
            </div>
            <div>
              <p className="text-[#92400E] text-[14px] font-bold mb-0.5">Payment Incomplete</p>
              <p className="text-[#B45309] text-[13px]">Your previous payment could not be completed. Please retry to confirm your ticket and continue your journey.</p>
            </div>
          </div>
        </div>

        {/* Right — payment panel */}
        <div className="w-[380px] space-y-4">
          <div className="bg-white rounded-3xl p-7" style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
            <p className="text-[#94A3B8] text-[11px] font-black uppercase tracking-widest mb-5">Complete Payment</p>

            {success ? (
              <div className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-2xl p-6 text-center space-y-2">
                <div className="w-16 h-16 rounded-full bg-[#10B981] text-white flex items-center justify-center mx-auto text-2xl">✓</div>
                <p className="text-[#15803D] text-[18px] font-black">Payment Successful!</p>
                <p className="text-[#059669] text-[13px]">Your ticket for Bus {busNumber} is confirmed.</p>
              </div>
            ) : (
              <>
                <div className="bg-[#F8FAFC] rounded-2xl px-5 py-4 mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-[#94A3B8] text-[11px] mb-1">Amount due</p>
                    <p className="text-[#0F172A] font-black" style={{ fontSize: 36, fontFamily: "JetBrains Mono, monospace", lineHeight: 1 }}>₹{amount}</p>
                  </div>
                  <div className="text-right text-[12px] text-[#94A3B8] space-y-1">
                    <p>{passengers} passengers</p>
                    <p>Route {routeNum}</p>
                    <p style={{ fontFamily: "JetBrains Mono, monospace" }}>{busNumber}</p>
                  </div>
                </div>

                <button onClick={handlePay} disabled={loading}
                  className="w-full h-[58px] rounded-2xl text-white text-[17px] font-black flex items-center justify-center gap-3 mb-3 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg, #1A56DB, #1D4ED8)", boxShadow: "0 8px 28px rgba(26,86,219,0.38)" }}>
                  {loading ? "Processing..." : `Pay ₹${amount} Now`}
                  <svg width="18" height="18" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                </button>

                <div className="flex items-center justify-center gap-2">
                  <svg width="12" height="12" fill="none" stroke="#94A3B8" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
                  <span className="text-[#94A3B8] text-[12px]">Secured by <span className="font-semibold text-[#64748B]">Razorpay</span></span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
