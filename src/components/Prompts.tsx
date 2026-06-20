import { Card, Tag } from "./ui";
import { TopBar } from "./Sidebar";
import { PROMPTS } from "../lib/data";
import { Plus, FileText } from "lucide-react";

export function Prompts() {
  return (
    <>
      <TopBar
        title="Prompts"
        subtitle="Versioned prompt library powering AI agents."
        right={
          <div className="flex items-center gap-2">
            <button className="rf-btn flex items-center gap-1.5">
              🔔 ALERTS <span className="rf-tag rf-tag-red ml-1">58</span>
            </button>
            <button className="rf-btn rf-btn-primary flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" /> NEW PROMPT
            </button>
          </div>
        }
      />
      <div className="p-8 space-y-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { l: "PROMPTS", v: PROMPTS.length },
            { l: "STABLE", v: PROMPTS.filter(p => p.version.startsWith("1.")).length },
            { l: "BETA", v: PROMPTS.filter(p => p.version.startsWith("0.")).length },
            { l: "TOTAL CALLS", v: PROMPTS.reduce((a, p) => a + p.calls, 0) },
          ].map(s => (
            <div key={s.l} className="rf-stat p-4">
              <div className="rf-section-title">{s.l}</div>
              <div className="text-3xl font-semibold mt-1">{s.v.toLocaleString()}</div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PROMPTS.map(p => (
            <Card key={p.id} className="hover:border-[#f5a623] transition-colors">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[10px] tracking-[0.2em] text-[#f5a623] font-mono">{p.id} · v{p.version}</div>
                  <div className="text-base font-semibold mt-1">{p.name}</div>
                </div>
                <Tag color={p.version.startsWith("0.") ? "amber" : "green"}>{p.version.startsWith("0.") ? "BETA" : "STABLE"}</Tag>
              </div>
              <div className="mt-3 space-y-1.5 text-[11px] text-[#a1a1aa]">
                <div className="flex justify-between"><span>Author</span><span className="text-[#e5e5e7]">{p.author}</span></div>
                <div className="flex justify-between"><span>Updated</span><span className="text-[#e5e5e7] font-mono">{p.updated}</span></div>
                <div className="flex justify-between"><span>Tokens</span><span className="text-[#e5e5e7] font-mono">{p.tokens}</span></div>
                <div className="flex justify-between"><span>Calls (30d)</span><span className="text-[#e5e5e7] font-mono">{p.calls.toLocaleString()}</span></div>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <button className="rf-btn flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> EDIT</button>
                <button className="rf-btn">CHANGELOG</button>
                <button className="rf-btn">ROLLBACK</button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
