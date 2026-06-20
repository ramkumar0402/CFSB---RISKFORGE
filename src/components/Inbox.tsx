import { useState, useMemo } from "react";
import { Tag } from "./ui";
import { CASES, type RiskTier } from "../lib/data";
import { TopBar } from "./Sidebar";
import { Search, ArrowRight, Filter, Plus } from "lucide-react";

export function Inbox() {
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState<string>("All Risk");
  const [stageFilter, setStageFilter] = useState<string>("All Stage");
  const [productFilter, setProductFilter] = useState<string>("All Product");

  const filtered = useMemo(() => {
    return CASES.filter(c => {
      if (search && !`${c.id} ${c.narrative} ${c.company}`.toLowerCase().includes(search.toLowerCase())) return false;
      if (riskFilter !== "All Risk" && c.risk !== riskFilter) return false;
      if (stageFilter !== "All Stage" && c.stage !== stageFilter) return false;
      if (productFilter !== "All Product" && c.product !== productFilter) return false;
      return true;
    });
  }, [search, riskFilter, stageFilter, productFilter]);

  return (
    <>
      <TopBar
        title="Triage Inbox"
        subtitle={`${CASES.length} cases — apply filters to narrow.`}
        right={
          <div className="flex items-center gap-2">
            <button className="rf-btn flex items-center gap-1.5">
              🔔 ALERTS <span className="rf-tag rf-tag-red ml-1">58</span>
            </button>
            <button className="rf-btn rf-btn-primary flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" /> NEW CASE
            </button>
          </div>
        }
      />
      <div className="p-8 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="rf-input flex items-center gap-2 !py-0">
            <Search className="w-3.5 h-3.5 text-[#6b6b73]" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="ID, narrative, company..."
              className="bg-transparent border-0 outline-none flex-1 text-xs"
            />
          </div>
          <Select label="RISK" value={riskFilter} onChange={setRiskFilter} options={["All Risk", "Critical", "High", "Medium", "Low", "Unclassified"]} />
          <Select label="STAGE" value={stageFilter} onChange={setStageFilter} options={["All Stage", "Received", "AI Classified", "Escalated", "Assigned", "Closed"]} />
          <Select label="PRODUCT" value={productFilter} onChange={setProductFilter} options={["All Product", "Banking", "Credit Card", "Mortgage", "Debt Collection", "Student Loan", "Personal Loan", "Money Transfer", "Other"]} />
        </div>

        <div className="rf-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="rf-table">
              <thead>
                <tr>
                  <th>CASE ID</th>
                  <th>PRODUCT</th>
                  <th>COMPANY</th>
                  <th>STATE</th>
                  <th>RISK</th>
                  <th>STAGE</th>
                  <th>CREATED</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 30).map(c => (
                  <tr key={c.id}>
                    <td className="font-medium text-[#e5e5e7]">{c.id}</td>
                    <td>{c.product}</td>
                    <td className="text-[#6b6b73]">—</td>
                    <td className="text-[#6b6b73]">—</td>
                    <td>
                      <RiskTag risk={c.risk} />
                    </td>
                    <td>
                      <span className="text-[10px] tracking-[0.18em] text-[#a1a1aa] uppercase">{c.stage}</span>
                    </td>
                    <td className="text-[#a1a1aa]">{c.created}</td>
                    <td className="text-right">
                      <button className="rf-btn flex items-center gap-1.5 ml-auto">
                        OPEN <ArrowRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="text-xs text-[#6b6b73] text-center tracking-[0.15em]">
          Showing {Math.min(30, filtered.length)} of {filtered.length} cases
        </div>
      </div>
    </>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div>
      <div className="rf-section-title mb-1.5">{label}</div>
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className="rf-input appearance-none pr-8 cursor-pointer"
        >
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <Filter className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-[#6b6b73] pointer-events-none" />
      </div>
    </div>
  );
}

function RiskTag({ risk }: { risk: RiskTier }) {
  const map: Record<RiskTier, { color: any; label: string }> = {
    Critical: { color: "red", label: "CRITICAL" },
    High: { color: "red", label: "HIGH" },
    Medium: { color: "amber", label: "MEDIUM" },
    Low: { color: "green", label: "LOW" },
    Unclassified: { color: "muted", label: "UNCLASSIFIED" },
  };
  const m = map[risk];
  return <Tag color={m.color as any}>{m.label}</Tag>;
}
