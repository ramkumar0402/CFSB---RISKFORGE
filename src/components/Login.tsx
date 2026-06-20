import { useState } from "react";
import { useSetAtom } from "jotai";
import { authAtom, pageAtom } from "../lib/atoms";
import { Shield, Lock, ArrowRight, ChevronDown } from "lucide-react";

export function Login() {
  const setAuth = useSetAtom(authAtom);
  const setPage = useSetAtom(pageAtom);
  const [mode, setMode] = useState<"signin" | "register">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("ANALYST");
  const [busy, setBusy] = useState(false);

  function submit(e?: React.FormEvent) {
    e?.preventDefault();
    if (mode === "register" && (!name.trim() || !email.trim() || password.length < 6)) return;
    setBusy(true);
    setTimeout(() => {
      setAuth({ email: email || (mode === "register" ? `${name.toLowerCase().replace(/\s+/g, ".")}@riskforge.io` : "admin@riskforge.io"), role });
      setPage("Executive");
      setBusy(false);
    }, 500);
  }

  function useDemo(em: string) {
    setMode("signin");
    setEmail(em);
    setPassword("demo-token");
    setTimeout(() => submit(), 50);
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-[#050505] text-[#e5e5e7] relative overflow-hidden">
      {/* Left brand panel */}
      <div className="relative hidden lg:block">
        <div className="absolute inset-0 rf-grid-bg" />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background:
              "linear-gradient(135deg, rgba(0,0,0,0.85) 0%, rgba(20,15,5,0.5) 50%, rgba(0,0,0,0.95) 100%)",
          }}
        />
        {/* Facade pattern */}
        <svg className="absolute inset-0 w-full h-full opacity-30" preserveAspectRatio="xMidYMid slice" viewBox="0 0 600 800">
          <defs>
            <linearGradient id="g1" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#1a1a1d" stopOpacity="0" />
              <stop offset="50%" stopColor="#1a1a1d" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#1a1a1d" stopOpacity="0" />
            </linearGradient>
          </defs>
          {Array.from({ length: 30 }).map((_, i) => (
            <rect key={i} x={i * 22 - 30} y={0} width={14} height={800} fill="url(#g1)" transform={`skewX(-12)`} />
          ))}
          <circle cx="380" cy="280" r="160" fill="#0a0a0c" stroke="#1a1a1d" strokeWidth="0.5" />
        </svg>
        <div className="relative z-10 h-full flex flex-col justify-between p-12">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-gradient-to-br from-[#f5a623] to-[#ff6b00] flex items-center justify-center">
                <Shield className="w-4 h-4 text-black" strokeWidth={2.5} />
              </div>
              <div className="text-xl font-bold tracking-[0.18em]">RISKFORGE</div>
            </div>
            <div className="mt-2 text-[10px] tracking-[0.3em] text-[#6b6b73]">// ENTERPRISE OPERATIONAL RISK</div>
          </div>
          <div className="space-y-2 max-w-lg">
            <h1 className="text-7xl font-bold tracking-tight leading-[0.95]">
              Triage.<br />
              Decide.<br />
              <span className="text-[#f5a623] rf-glow-amber">Govern.</span>
            </h1>
            <p className="text-[#a1a1aa] text-sm leading-relaxed max-w-md pt-4">
              An AI-augmented terminal for complaint risk classification, workflow automation, and full audit governance. Built for compliance teams that don't get second chances.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-4 max-w-md">
            {[
              { v: "3M+", l: "RECORDS" },
              { v: "90%+", l: "ACCURACY" },
              { v: "50%", l: "FASTER ESC" },
            ].map(s => (
              <div key={s.l} className="border-l border-[#1a1a1d] pl-3">
                <div className="text-2xl font-bold text-[#e5e5e7]">{s.v}</div>
                <div className="text-[9px] tracking-[0.2em] text-[#6b6b73] mt-1">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex items-center justify-center p-8 relative">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-2">
            <div className="rf-section-title">{mode === "signin" ? "// SECURE ACCESS" : "// REGISTER"}</div>
            <h2 className="text-4xl font-bold tracking-tight">{mode === "signin" ? "Sign in" : "Create account"}</h2>
            <p className="text-[#a1a1aa] text-sm">
              {mode === "signin" ? "Authenticate to access the risk terminal." : "Register a new identity. Provisioning is instant."}
            </p>
          </div>
          <form onSubmit={submit} className="space-y-5">
            {mode === "register" && (
              <div className="space-y-2">
                <label className="rf-section-title">FULL NAME</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Doe"
                  className="rf-input"
                />
              </div>
            )}
            <div className="space-y-2">
              <label className="rf-section-title">EMAIL</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@riskforge.io"
                className="rf-input"
              />
            </div>
            <div className="space-y-2">
              <label className="rf-section-title">PASSWORD {mode === "register" && "(6+ CHARS)"}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="rf-input"
              />
            </div>
            {mode === "register" && (
              <div className="space-y-2">
                <label className="rf-section-title">ROLE</label>
                <div className="relative">
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="rf-input appearance-none pr-8 cursor-pointer"
                  >
                    <option>ANALYST</option>
                    <option>MANAGER</option>
                    <option>COMPLIANCE</option>
                    <option>ADMIN</option>
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-[#6b6b73] pointer-events-none" />
                </div>
              </div>
            )}
            <button
              type="submit"
              disabled={busy}
              className="rf-btn rf-btn-primary w-full flex items-center justify-center gap-2"
            >
              {busy ? (mode === "signin" ? "AUTHENTICATING..." : "PROVISIONING...") : (mode === "signin" ? "ENTER TERMINAL" : "CREATE ACCOUNT")}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {mode === "signin" && (
            <div className="space-y-3">
              <div className="rf-section-title">// DEMO IDENTITIES</div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { e: "admin@riskforge.io", r: "ADMIN" },
                  { e: "analyst@riskforge.io", r: "ANALYST" },
                  { e: "manager@riskforge.io", r: "MANAGER" },
                  { e: "compliance@riskforge.io", r: "COMPLIANCE" },
                ].map(d => (
                  <button
                    key={d.e}
                    onClick={() => useDemo(d.e)}
                    className="text-left p-3 border border-[#1a1a1d] hover:border-[#f5a623] transition-colors group"
                  >
                    <div className="text-[10px] tracking-[0.18em] text-[#f5a623]">{d.r}</div>
                    <div className="text-xs text-[#a1a1aa] group-hover:text-[#e5e5e7]">{d.e}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="text-sm text-[#a1a1aa]">
            {mode === "signin" ? (
              <>No account? <a onClick={() => setMode("register")} className="text-[#f5a623] hover:underline cursor-pointer">Create one.</a></>
            ) : (
              <>Already have an account? <a onClick={() => setMode("signin")} className="text-[#f5a623] hover:underline cursor-pointer">Sign in.</a></>
            )}
          </div>
        </div>
        <div className="absolute bottom-4 right-4 flex items-center gap-1.5 text-[10px] text-[#3a3a3e]">
          <Lock className="w-3 h-3" /> SOC2 • ISO 27001 • PCI-DSS
        </div>
      </div>
    </div>
  );
}
