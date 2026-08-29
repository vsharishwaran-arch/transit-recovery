import { useState } from "react";
import { useAuth } from "../context/AuthContext";

type Role = "admin" | "conductor" | null;

interface Props { onLogin: (role: "admin" | "conductor") => void; }

const DEMO = {
  admin:     { id: "TNSTC-ADMIN", pass: "admin123" },
  conductor: { id: "TNSTC-2891",  pass: "conductor123" },
};

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
    <div className="min-h-full overflow-auto flex items-center justify-center p-6"
      style={{ background: "linear-gradient(135deg, #EDE8FB 0%, #E4DDF5 50%, #EAE4F7 100%)" }}>

      {/* Background blobs */}
      <div className="fixed top-0 left-0 w-80 h-80 rounded-full pointer-events-none"
        style={{ background: "rgba(108,92,231,0.12)", filter: "blur(80px)", transform: "translate(-40%, -40%)" }} />
      <div className="fixed bottom-0 right-0 w-72 h-72 rounded-full pointer-events-none"
        style={{ background: "rgba(108,92,231,0.10)", filter: "blur(60px)", transform: "translate(40%, 40%)" }} />

      {/* Card */}
      <div className="relative flex w-full max-w-[960px] rounded-3xl overflow-hidden"
        style={{ boxShadow: "0 32px 80px rgba(108,92,231,0.22), 0 4px 20px rgba(0,0,0,0.08)" }}>

        {/* ── LEFT — white form ───────────────────────────────── */}
        <div className="flex-1 bg-white flex flex-col items-center justify-center px-10 py-10">

          {/* Brand */}
          <div className="w-full mb-6 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${violet}, #4F46E5)` }}>
              <svg width="18" height="18" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="1" y="3" width="15" height="13" rx="2"/>
                <path d="M16 8h2l4 4v3h-6V8z"/>
                <circle cx="5.5" cy="18.5" r="2.5"/>
                <circle cx="18.5" cy="18.5" r="2.5"/>
              </svg>
            </div>
            <div>
              <p className="text-[#1E1B4B] text-[15px] font-black leading-none">TNSTC</p>
              <p className="text-[10px] mt-0.5 font-medium" style={{ color: "#A78BFA" }}>Transit Recovery Agent</p>
            </div>
          </div>

          {/* Heading */}
          <div className="w-full mb-5">
            <h1 className="text-[#1E1B4B] text-[32px] font-black tracking-tight leading-none mb-1.5">LOGIN</h1>
            <p className="text-[#94A3B8] text-[13px]">Sign in to the TNSTC digital operations portal</p>
          </div>

          {/* Form */}
          <form onSubmit={submit} className="w-full space-y-3">
            {/* Employee ID */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#A78BFA" }}>
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <input value={empId} onChange={e => { setEmpId(e.target.value); setError(""); }}
                placeholder="Employee / Admin ID"
                className="w-full h-[52px] rounded-2xl pl-11 pr-4 text-[#1E1B4B] text-[14px] outline-none transition-all placeholder:text-[#C4B5FD] border-2 border-transparent font-medium"
                style={{ background: "#F3F0FF", fontFamily: "JetBrains Mono, monospace" }}
                onFocus={e => { e.target.style.borderColor = violet; e.target.style.background = "#EDE8FB"; }}
                onBlur={e => { e.target.style.borderColor = "transparent"; e.target.style.background = "#F3F0FF"; }}
              />
            </div>

            {/* Password */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#A78BFA" }}>
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <rect x="3" y="11" width="18" height="11" rx="2"/>
                  <path d="M7 11V7a5 5 0 0110 0v4"/>
                </svg>
              </div>
              <input type={showPass ? "text" : "password"} value={pass}
                onChange={e => { setPass(e.target.value); setError(""); }}
                placeholder="Password"
                className="w-full h-[52px] rounded-2xl pl-11 pr-12 text-[#1E1B4B] text-[14px] outline-none transition-all placeholder:text-[#C4B5FD] border-2 border-transparent"
                style={{ background: "#F3F0FF" }}
                onFocus={e => { e.target.style.borderColor = violet; e.target.style.background = "#EDE8FB"; }}
                onBlur={e => { e.target.style.borderColor = "transparent"; e.target.style.background = "#F3F0FF"; }}
              />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors" style={{ color: "#C4B5FD" }}>
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
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
              className="w-full h-[52px] rounded-2xl text-white text-[15px] font-bold tracking-wide transition-all shadow-lg hover:shadow-xl active:scale-[0.98] disabled:opacity-60"
              style={{ background: `linear-gradient(135deg, ${violet}, #4F46E5)`, boxShadow: "0 8px 24px rgba(108,92,231,0.32)" }}>
              {loading ? "Signing in..." : "SIGN IN"}
            </button>
          </form>

          {/* Divider */}
          <div className="w-full flex items-center gap-3 my-4">
            <div className="flex-1 h-px" style={{ background: "#EDE8FB" }} />
            <span className="text-[12px] text-[#94A3B8]">
              <span className="font-bold text-[#1E1B4B]">Login</span> with Role
            </span>
            <div className="flex-1 h-px" style={{ background: "#EDE8FB" }} />
          </div>

          {/* Role rows — mirrors "Login with google / Login with Facebook" from reference */}
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

          <p className="mt-6 text-[#CBD5E1] text-[10px] text-center">© 2026 Tamil Nadu State Transport Corporation</p>
        </div>

        {/* ── RIGHT — bus photo + violet overlay ──────────────── */}
        <div className="relative overflow-hidden flex flex-col items-center justify-center"
          style={{
            width: 420,
            flexShrink: 0,
            backgroundImage: `linear-gradient(145deg, rgba(108,92,231,0.88) 0%, rgba(76,60,158,0.92) 50%, rgba(30,27,75,0.96) 100%), url(https://images.unsplash.com/photo-1632276536839-84cad7fd03b0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800)`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}>

          {/* Subtle wave overlay */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 420 580" preserveAspectRatio="xMidYMid slice">
            <path d="M-40 160 Q120 50 280 160 Q440 270 600 160" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="65"/>
            <path d="M-40 310 Q120 200 280 310 Q440 420 600 310" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="50"/>
            <path d="M-40 460 Q120 350 280 460 Q440 570 600 460" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="40"/>
          </svg>

          {/* Floating accent dots */}
          <div className="absolute top-8 right-8 w-3 h-3 rounded-full"   style={{ background: "rgba(255,255,255,0.22)" }} />
          <div className="absolute top-20 right-24 w-2 h-2 rounded-full" style={{ background: "rgba(255,255,255,0.16)" }} />
          <div className="absolute bottom-20 left-10 w-4 h-4 rounded-full" style={{ background: "rgba(255,255,255,0.15)" }} />
          <div className="absolute top-1/3 right-4 w-1.5 h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.20)" }} />

          {/* TNSTC top badge */}
          <div className="absolute top-7 left-0 right-0 flex justify-center">
            <div className="flex items-center gap-2 rounded-full px-4 py-1.5"
              style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.20)", backdropFilter: "blur(8px)" }}>
              <div className="w-2 h-2 rounded-full" style={{ background: "#A7F3D0" }} />
              <span className="text-white text-[11px] font-bold tracking-wide">TNSTC Digital Operations</span>
            </div>
          </div>

          {/* Central glass card */}
          <div className="relative z-10 mx-8 w-full mt-6">

            {/* Lightning badge on left edge */}
            <div className="absolute -left-5 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white flex items-center justify-center z-20"
              style={{ boxShadow: "0 6px 20px rgba(0,0,0,0.30)" }}>
              <svg width="20" height="20" fill="#F59E0B" viewBox="0 0 24 24">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
            </div>

            <div className="rounded-3xl overflow-hidden"
              style={{ background: "rgba(255,255,255,0.11)", border: "1px solid rgba(255,255,255,0.22)", backdropFilter: "blur(20px)" }}>

              {/* Bus photo inside card */}
              <div className="relative h-[170px] overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1557223562-6c77ef16210f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600"
                  alt="TNSTC Bus"
                  className="w-full h-full object-cover"
                  style={{ filter: "brightness(0.75) saturate(1.1)" }}
                />
                {/* Gradient fade into card */}
                <div className="absolute inset-0"
                  style={{ background: "linear-gradient(to bottom, transparent 40%, rgba(60,46,120,0.85) 100%)" }} />
                {/* Overlay text */}
                <div className="absolute bottom-4 left-5 right-5">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-black uppercase tracking-widest"
                      style={{ color: "#A7F3D0" }}>Live Route</span>
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#A7F3D0" }} />
                    <span className="text-[10px] text-white/70">Koyambedu → Tambaram</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-white/20 text-white text-[11px] font-black px-2.5 py-0.5 rounded-full border border-white/25">47C</span>
                    <span className="text-white/60 text-[11px]">TN01-AB-1234</span>
                  </div>
                </div>
              </div>

              {/* Text content */}
              <div className="px-6 py-5">
                <p className="text-white text-[16px] font-black mb-1">AI-Powered Revenue Recovery</p>
                <p className="text-[12px] leading-relaxed" style={{ color: "#C4B5FD" }}>
                  Automatically recover failed payments and reduce revenue loss across the Tamil Nadu bus network.
                </p>
              </div>

              {/* Stats strip */}
              <div className="grid grid-cols-3" style={{ borderTop: "1px solid rgba(255,255,255,0.10)" }}>
                {[
                  { val: "₹4.2L", label: "Recovered" },
                  { val: "44%",   label: "Success Rate" },
                  { val: "28",    label: "Routes" },
                ].map((s, i) => (
                  <div key={s.label} className="flex flex-col items-center py-4"
                    style={{ borderRight: i < 2 ? "1px solid rgba(255,255,255,0.08)" : "none" }}>
                    <p className="text-white font-black text-[18px] leading-none"
                      style={{ fontFamily: "JetBrains Mono, monospace" }}>{s.val}</p>
                    <p className="text-[9px] mt-1 font-semibold uppercase tracking-wide" style={{ color: "#C4B5FD" }}>{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom tagline */}
          <div className="mt-7 px-8 text-center">
            <p className="text-white/90 text-[13px] font-semibold">
              Serving <span className="text-[#A7F3D0] font-black">4.2 Crore</span> passengers daily
            </p>
            <p className="text-white/40 text-[10px] mt-1">Tamil Nadu State Transport Corporation · Est. 1972</p>
          </div>
        </div>
      </div>
    </div>
  );
}
