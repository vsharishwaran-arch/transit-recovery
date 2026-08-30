import { useState } from "react";
import { useAuth } from "../context/AuthContext";

type Role = "admin" | "conductor" | null;

interface Props { onLogin: (role: "admin" | "conductor") => void; }

const DEMO = {
  admin:     { id: "TNSTC-ADMIN", pass: "admin123" },
  conductor: { id: "TNSTC-2891",  pass: "conductor123" },
};

function AnimatedBusIllustration() {
  return (
    <div className="relative w-full max-w-[520px] flex flex-col items-center">
      {/* Headlight beam blur ambient glow */}
      <div className="absolute -right-12 top-1/2 -translate-y-1/2 w-48 h-32 pointer-events-none opacity-40 blur-xl"
        style={{ background: "radial-gradient(ellipse at left, rgba(253, 224, 71, 0.9), transparent 70%)" }} />

      {/* Floating Animated Bus SVG */}
      <div className="relative w-full animate-bus-float">
        <svg viewBox="0 0 520 220" className="w-full h-auto drop-shadow-[0_20px_35px_rgba(0,0,0,0.5)]">
          <defs>
            <linearGradient id="busBody" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="50%" stopColor="#0284C7" />
              <stop offset="100%" stopColor="#0369A1" />
            </linearGradient>
            <linearGradient id="busRoof" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#E0F2FE" />
              <stop offset="100%" stopColor="#BAE6FD" />
            </linearGradient>
            <linearGradient id="glassGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1E293B" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#0F172A" stopOpacity="0.95" />
            </linearGradient>
            <linearGradient id="headlightBeam" x1="0%" y1="50%" x2="100%" y2="50%">
              <stop offset="0%" stopColor="#FEF08A" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#FEF08A" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Headlight Beam Cone */}
          <polygon points="460,130 520,100 520,165" fill="url(#headlightBeam)" className="animate-headlight" />

          {/* Bus Roof AC Unit */}
          <rect x="120" y="20" width="180" height="14" rx="5" fill="#E2E8F0" />
          <rect x="140" y="23" width="140" height="8" rx="3" fill="#64748B" opacity="0.3" />

          {/* Main Bus Chassis Body */}
          <rect x="40" y="30" width="430" height="125" rx="24" fill="url(#busBody)" />
          
          {/* Top White Roof Strip */}
          <path d="M40,54 C40,40 54,30 70,30 L440,30 C454,30 470,40 470,54 L470,66 L40,66 Z" fill="url(#busRoof)" />

          {/* Destination LED Board (Clean Minimalist LED Glass) */}
          <rect x="355" y="38" width="100" height="20" rx="4" fill="#0F172A" stroke="#38BDF8" strokeWidth="1.5" />

          {/* Side Passenger Windows */}
          <rect x="65" y="72" width="60" height="42" rx="6" fill="url(#glassGrad)" stroke="#38BDF8" strokeWidth="1" />
          <rect x="135" y="72" width="60" height="42" rx="6" fill="url(#glassGrad)" stroke="#38BDF8" strokeWidth="1" />
          <rect x="205" y="72" width="60" height="42" rx="6" fill="url(#glassGrad)" stroke="#38BDF8" strokeWidth="1" />
          <rect x="275" y="72" width="60" height="42" rx="6" fill="url(#glassGrad)" stroke="#38BDF8" strokeWidth="1" />
          
          {/* Conductor & Passenger Door */}
          <rect x="345" y="72" width="50" height="75" rx="6" fill="url(#glassGrad)" stroke="#38BDF8" strokeWidth="1.5" />
          <line x1="370" y1="72" x2="370" y2="147" stroke="#38BDF8" strokeWidth="1" opacity="0.6" />
          
          {/* Front Curved Windshield */}
          <path d="M405,72 L452,72 C462,72 468,80 468,93 L468,114 L405,114 Z" fill="url(#glassGrad)" stroke="#38BDF8" strokeWidth="1.5" />

          {/* Clean Accent Stripe */}
          <rect x="40" y="122" width="430" height="12" fill="#F59E0B" />

          {/* Front Headlights */}
          <rect x="460" y="126" width="10" height="18" rx="4" fill="#FEF08A" className="animate-headlight" />
          <circle cx="45" cy="136" r="5" fill="#EF4444" />

          {/* Wheel Arch Rear */}
          <path d="M98,155 A 28 28 0 0 1 154,155 Z" fill="#0F172A" />
          {/* Wheel Arch Front */}
          <path d="M348,155 A 28 28 0 0 1 404,155 Z" fill="#0F172A" />

          {/* Rear Wheel (Spinning) */}
          <g transform="translate(126, 155)">
            <circle cx="0" cy="0" r="22" fill="#1E293B" stroke="#475569" strokeWidth="3" />
            <circle cx="0" cy="0" r="14" fill="#94A3B8" />
            <g className="animate-wheel-spin">
              <line x1="0" y1="-14" x2="0" y2="14" stroke="#0F172A" strokeWidth="3" />
              <line x1="-14" y1="0" x2="14" y2="0" stroke="#0F172A" strokeWidth="3" />
            </g>
            <circle cx="0" cy="0" r="5" fill="#38BDF8" />
          </g>

          {/* Front Wheel (Spinning) */}
          <g transform="translate(376, 155)">
            <circle cx="0" cy="0" r="22" fill="#1E293B" stroke="#475569" strokeWidth="3" />
            <circle cx="0" cy="0" r="14" fill="#94A3B8" />
            <g className="animate-wheel-spin">
              <line x1="0" y1="-14" x2="0" y2="14" stroke="#0F172A" strokeWidth="3" />
              <line x1="-14" y1="0" x2="14" y2="0" stroke="#0F172A" strokeWidth="3" />
            </g>
            <circle cx="0" cy="0" r="5" fill="#38BDF8" />
          </g>
        </svg>
      </div>

      {/* Animated Dash Road Lines */}
      <div className="w-full max-w-[480px] mt-1 flex justify-center">
        <svg viewBox="0 0 480 20" className="w-full h-5">
          <line x1="0" y1="10" x2="480" y2="10" stroke="#475569" strokeWidth="4" />
          <line x1="0" y1="10" x2="480" y2="10" stroke="#38BDF8" strokeWidth="4" className="animate-road" />
        </svg>
      </div>
    </div>
  );
}

export default function LoginPage({ onLogin }: Props) {
  const { login } = useAuth();
  const [role,     setRole]     = useState<Role>(null);
  const [empId,    setEmpId]    = useState("");
  const [pass,     setPass]     = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  function pick(r: "admin" | "conductor") {
    setRole(r); setEmpId(DEMO[r].id); setPass(DEMO[r].pass); setError("");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(empId.trim(), pass);
      onLogin(role || (empId.toUpperCase().includes("ADMIN") ? "admin" : "conductor"));
    } catch (err: any) {
      setError(err?.response?.data?.message || "Incorrect Employee ID or password.");
    } finally {
      setLoading(false);
    }
  }

  const violet = "#6C5CE7";

  return (
    <div className="w-screen h-screen min-h-screen flex overflow-hidden bg-[#0F172A]">
      {/* ── LEFT COLUMN — Form & Login Controls (Full Screen Height) ──────────── */}
      <div className="w-full lg:w-[480px] xl:w-[540px] h-full bg-white flex flex-col justify-between px-8 xl:px-12 py-8 z-10 overflow-y-auto flex-shrink-0">
        <div>
          {/* Brand */}
          <div className="w-full mb-8 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md"
              style={{ background: `linear-gradient(135deg, ${violet}, #4F46E5)` }}>
              <svg width="20" height="20" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24">
                <rect x="1" y="3" width="15" height="13" rx="2"/>
                <path d="M16 8h2l4 4v3h-6V8z"/>
                <circle cx="5.5" cy="18.5" r="2.5"/>
                <circle cx="18.5" cy="18.5" r="2.5"/>
              </svg>
            </div>
            <div>
              <p className="text-[#1E1B4B] text-[16px] font-black leading-none">TNSTC</p>
              <p className="text-[11px] mt-0.5 font-bold tracking-wide" style={{ color: "#A78BFA" }}>Transit Recovery Agent</p>
            </div>
          </div>

          {/* Heading */}
          <div className="w-full mb-6">
            <h1 className="text-[#1E1B4B] text-[34px] font-black tracking-tight leading-none mb-2">LOGIN</h1>
            <p className="text-[#64748B] text-[13px]">Sign in to the TNSTC digital operations portal</p>
          </div>

          {/* Form */}
          <form onSubmit={submit} className="w-full space-y-3.5">
            {/* Employee ID */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#A78BFA" }}>
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <input value={empId} onChange={e => { setEmpId(e.target.value); setError(""); }}
                placeholder="Employee / Admin ID"
                className="w-full h-[54px] rounded-2xl pl-12 pr-4 text-[#1E1B4B] text-[14px] outline-none transition-all placeholder:text-[#C4B5FD] border-2 border-transparent font-medium"
                style={{ background: "#F3F0FF", fontFamily: "JetBrains Mono, monospace" }}
                onFocus={e => { e.target.style.borderColor = violet; e.target.style.background = "#EDE8FB"; }}
                onBlur={e => { e.target.style.borderColor = "transparent"; e.target.style.background = "#F3F0FF"; }}
              />
            </div>

            {/* Password */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#A78BFA" }}>
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <rect x="3" y="11" width="18" height="11" rx="2"/>
                  <path d="M7 11V7a5 5 0 0110 0v4"/>
                </svg>
              </div>
              <input type={showPass ? "text" : "password"} value={pass}
                onChange={e => { setPass(e.target.value); setError(""); }}
                placeholder="Password"
                className="w-full h-[54px] rounded-2xl pl-12 pr-12 text-[#1E1B4B] text-[14px] outline-none transition-all placeholder:text-[#C4B5FD] border-2 border-transparent"
                style={{ background: "#F3F0FF" }}
                onFocus={e => { e.target.style.borderColor = violet; e.target.style.background = "#EDE8FB"; }}
                onBlur={e => { e.target.style.borderColor = "transparent"; e.target.style.background = "#F3F0FF"; }}
              />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors" style={{ color: "#C4B5FD" }}>
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  {showPass
                    ? <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
                    : <><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></>}
                </svg>
              </button>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2.5 rounded-xl px-4 py-3"
                style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}>
                <svg width="14" height="14" fill="none" stroke="#EF4444" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <p className="text-[#B91C1C] text-[12px] font-medium">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button type="submit" disabled={loading}
              className="w-full h-[54px] rounded-2xl text-white text-[15px] font-bold tracking-wide transition-all shadow-lg hover:shadow-xl active:scale-[0.98] disabled:opacity-60"
              style={{ background: `linear-gradient(135deg, ${violet}, #4F46E5)`, boxShadow: "0 8px 24px rgba(108,92,231,0.35)" }}>
              {loading ? "Signing in..." : "SIGN IN"}
            </button>
          </form>

          {/* Divider */}
          <div className="w-full flex items-center gap-3 my-5">
            <div className="flex-1 h-px" style={{ background: "#EDE8FB" }} />
            <span className="text-[12px] text-[#94A3B8]">
              <span className="font-bold text-[#1E1B4B]">Quick Login</span> with Role
            </span>
            <div className="flex-1 h-px" style={{ background: "#EDE8FB" }} />
          </div>

          {/* Role rows */}
          <div className="w-full space-y-3">
            {(["admin", "conductor"] as const).map((r) => {
              const active = role === r;
              const cfg = r === "admin"
                ? {
                    label: "Login as Admin",
                    sub: "Dashboard · Analytics · Batch Control",
                    icon: (
                      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <rect x="3" y="3" width="7" height="7" rx="1"/>
                        <rect x="14" y="3" width="7" height="7" rx="1"/>
                        <rect x="3" y="14" width="7" height="7" rx="1"/>
                        <rect x="14" y="14" width="7" height="7" rx="1"/>
                      </svg>
                    ),
                  }
                : {
                    label: "Login as Conductor",
                    sub: "Ticketing · QR Payments · Recovery",
                    icon: (
                      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <rect x="1" y="3" width="15" height="13" rx="2"/>
                        <path d="M16 8h2l4 4v3h-6V8z"/>
                        <circle cx="5.5" cy="18.5" r="2.5"/>
                        <circle cx="18.5" cy="18.5" r="2.5"/>
                      </svg>
                    ),
                  };
              return (
                <button key={r} onClick={() => pick(r)}
                  className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-left transition-all border-2"
                  style={{
                    borderColor: active ? violet : "#EDE8FB",
                    background: active ? "#F3F0FF" : "white",
                    boxShadow: active ? `0 0 0 3px rgba(108,92,231,0.10)` : "none",
                  }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: active ? violet : "#F3F0FF", color: active ? "white" : "#A78BFA" }}>
                    {cfg.icon}
                  </div>
                  <div className="flex-1">
                    <p className="text-[13px] font-bold" style={{ color: active ? "#1E1B4B" : "#475569" }}>{cfg.label}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: active ? "#7C6FCD" : "#94A3B8" }}>{cfg.sub}</p>
                  </div>
                  {active && (
                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: violet }}>
                      <svg width="9" height="9" fill="none" stroke="white" strokeWidth="3" viewBox="0 0 24 24">
                        <path d="M20 6L9 17l-5-5"/>
                      </svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <p className="pt-6 text-[#94A3B8] text-[11px] text-center">© 2026 Tamil Nadu State Transport Corporation</p>
      </div>

      {/* ── RIGHT COLUMN — Full Screen Hero with Animated Bus Graphic ───────────────── */}
      <div className="flex-1 relative hidden lg:flex flex-col items-center justify-between p-12 overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #1E1B4B 0%, #312E81 40%, #4C3C9E 100%)",
        }}>

        {/* Ambient background glows */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full pointer-events-none opacity-30 blur-3xl"
          style={{ background: "#6C5CE7" }} />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full pointer-events-none opacity-20 blur-3xl"
          style={{ background: "#38BDF8" }} />

        {/* Central Graphic Area — Animated Bus */}
        <div className="relative z-10 my-auto flex flex-col items-center justify-center w-full">
          <AnimatedBusIllustration />

          {/* Stats Glassmorphic Panel */}
          <div className="w-full max-w-[500px] mt-8 rounded-3xl p-6"
            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", backdropFilter: "blur(16px)" }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-white text-[17px] font-black">AI-Powered Revenue Recovery</p>
                <p className="text-[12px] text-[#C4B5FD] mt-0.5">Automated UPI failure resolution for Tamil Nadu state transit</p>
              </div>
              <span className="bg-[#10B981]/20 text-[#34D399] border border-[#10B981]/30 text-[11px] font-bold px-3 py-1 rounded-full">
                Active
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-3 border-t border-white/10">
              {[
                { val: "₹4.2L+", label: "Recovered" },
                { val: "85%",    label: "Dropout Fixed" },
                { val: "28",     label: "Routes Active" },
              ].map((s) => (
                <div key={s.label} className="bg-white/5 rounded-2xl p-3 text-center border border-white/5">
                  <p className="text-white font-black text-[18px]" style={{ fontFamily: "JetBrains Mono, monospace" }}>{s.val}</p>
                  <p className="text-[10px] text-[#A78BFA] font-semibold uppercase mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Tagline */}
        <div className="relative z-10 w-full text-center">
          <p className="text-white/80 text-[13px] font-medium">
            Powering smart digital transit for <span className="text-[#38BDF8] font-bold">4.2 Crore daily commuters</span>
          </p>
        </div>
      </div>
    </div>
  );
}
