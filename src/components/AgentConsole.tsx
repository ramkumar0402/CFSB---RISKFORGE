import { useState } from "react";
import { Card, SectionTitle } from "./ui";
import { TopBar } from "./Sidebar";
import { CASES } from "../lib/data";
import { useSetAtom } from "jotai";
import { toastAtom } from "../lib/atoms";
import { Play, ChevronDown, Shield, Briefcase, Cog, Zap } from "lucide-react";

const AGENTS = [
  { id: "risk", label: "RISK", icon: Shield, color: "amber" },
  { id: "compliance", label: "COMPLIANCE", icon: Shield, color: "blue" },
  { id: "operations", label: "OPERATIONS", icon: Cog, color: "green" },
  { id: "escalation", label: "ESCALATION", icon: Zap, color: "red" },
  { id: "all", label: "ALL", icon: Briefcase, color: "muted" },
];

const CATALOG = [
  { id: "risk", name: "Risk Analyst Agent", role: "risk", icon: Shield, color: "#f5a623" },
  { id: "compliance", name: "Compliance Agent", role: "compliance", icon: Shield, color: "#3b82f6" },
  { id: "ops", name: "Operations Agent", role: "operations", icon: Cog, color: "#22c55e" },
  { id: "esc", name: "Escalation Agent", role: "escalation", icon: Zap, color: "#ef4444" },
];

export function AgentConsole() {
  const setToast = useSetAtom(toastAtom);
  const [selected, setSelected] = useState("RF-304070 — Banking");
  const [agent, setAgent] = useState<string | null>(null);
  const [model, setModel] = useState("Claude Sonnet 4.5");
  const [trace, setTrace] = useState<string | null>(null);

  function run() {
    if (!agent) { setToast("Select an agent first"); return; }
    setTrace("");
    const steps = [
      "→ LOADING CASE CONTEXT",
      `   case_id: ${selected.split(" ")[0]}`,
      "→ INJECTING TOOLS [crm.lookup, regulatory.check, sla.calc]",
      `→ MODEL: ${model} | temperature: 0.2 | max_tokens: 1024`,
      "→ REASONING STEP 1: Parsed narrative — detected financial hardship, legal threat",
      "→ REASONING STEP 2: Cross-referenced complaint against FCRA / FDCPA",
      "→ REASONING STEP 3: Resolved risk = Critical (confidence 0.92)",
      "→ ACTION: Flagged for FIU escalation • SLA 4h",
      "→ AUDIT: event logged (hash 7a9f...d2b1)",
    ];
    let i = 0;
    const tick = () => {
      if (i >= steps.length) { setToast("Agent run complete — output written to case"); return; }
      setTrace(prev => (prev ? prev + "\n" : "") + steps[i++]);
      setTimeout(tick, 220);
    };
    tick();
  }

  return (
    <>
      <TopBar
        title="Agent Console"
        subtitle="Invoke specialised AI agents on any case. Reasoning is auditable."
        right={
          <button className="rf-btn flex items-center gap-1.5">
            🔔 ALERTS <span className="rf-tag rf-tag-red ml-1">58</span>
          </button>
        }
      />
      <div className="p-8">
        <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-5">
          <div className="space-y-4">
            <Card>
              <SectionTitle>CASE</SectionTitle>
              <div className="relative">
                <select value={selected} onChange={e => setSelected(e.target.value)} className="rf-input appearance-none pr-8">
                  {CASES.slice(0, 25).map(c => <option key={c.id} value={`${c.id} — ${c.product}`}>{c.id} — {c.product}</option>)}
                </select>
                <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-[#6b6b73] pointer-events-none" />
              </div>
            </Card>

            <Card>
              <SectionTitle>AGENT</SectionTitle>
              <div className="grid grid-cols-2 gap-2">
                {AGENTS.map(a => {
                  const Icon = a.icon;
                  return (
                    <button
                      key={a.id}
                      onClick={() => setAgent(a.id)}
                      className={`rf-btn !py-3 flex items-center justify-center gap-2 ${agent === a.id ? "!border-[#f5a623] !text-[#f5a623] !bg-[#16160a]" : ""}`}
                    >
                      <Icon className="w-3.5 h-3.5" /> {a.label}
                    </button>
                  );
                })}
              </div>
            </Card>

            <Card>
              <SectionTitle>MODEL</SectionTitle>
              <div className="relative">
                <select value={model} onChange={e => setModel(e.target.value)} className="rf-input appearance-none pr-8">
                  <option>Claude Sonnet 4.5</option>
                  <option>Claude Opus 4.7</option>
                  <option>GPT-5.2</option>
                  <option>Gemini 3.0 Pro</option>
                </select>
                <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-[#6b6b73] pointer-events-none" />
              </div>
              <button onClick={run} className="rf-btn rf-btn-primary w-full mt-4 flex items-center justify-center gap-2">
                <Play className="w-3.5 h-3.5" /> RUN AGENT
              </button>
            </Card>

            <Card>
              <SectionTitle>CATALOG</SectionTitle>
              <div className="space-y-1.5">
                {CATALOG.map(a => {
                  const Icon = a.icon;
                  return (
                    <div key={a.id} className="flex items-center gap-3 p-2 border border-[#1a1a1d] hover:border-[#f5a623] transition-colors cursor-pointer">
                      <div className="w-7 h-7 flex items-center justify-center" style={{ background: `${a.color}15` }}>
                        <Icon className="w-3.5 h-3.5" style={{ color: a.color }} />
                      </div>
                      <div>
                        <div className="text-xs">{a.name}</div>
                        <div className="text-[9px] tracking-[0.2em] text-[#6b6b73] uppercase">{a.role}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          <Card>
            <SectionTitle>REASONING TRACE</SectionTitle>
            <pre className="text-[11px] text-[#a1a1aa] font-mono whitespace-pre-wrap leading-relaxed min-h-[400px]">
{trace || "SELECT A CASE AND RUN AN AGENT TO SEE OUTPUTS."}
            </pre>
          </Card>
        </div>
      </div>
    </>
  );
}
