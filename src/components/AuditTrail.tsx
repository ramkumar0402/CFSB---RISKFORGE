import { useState, useMemo } from "react";
import { Tag } from "./ui";
import { TopBar } from "./Sidebar";
import { AUDIT_EVENTS } from "../lib/data";
import { Search, Download } from "lucide-react";

export function AuditTrail() {
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => {
    return AUDIT_EVENTS.filter(e =>
      !search || `${e.id} ${e.user} ${e.action} ${e.target} ${e.details}`.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);
  return (
    <>
      <TopBar
        title="Audit Trail"
        subtitle="Immutable ledger of every automated + manual action."
        right={
          <div className="flex items-center gap-2">
            <button className="rf-btn flex items-center gap-1.5">
              🔔 ALERTS <span className="rf-tag rf-tag-red ml-1">58</span>
            </button>
            <button className="rf-btn flex items-center gap-1.5"><Download className="w-3.5 h-3.5" /> EXPORT CSV</button>
          </div>
        }
      />
      <div className="p-8 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="rf-input flex items-center gap-2 !py-0">
            <Search className="w-3.5 h-3.5 text-[#6b6b73]" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="search id, user, action, target..."
              className="bg-transparent border-0 outline-none flex-1 text-xs"
            />
          </div>
          <div className="flex items-center gap-2">
            <select className="rf-input"><option>All actions</option></select>
            <select className="rf-input"><option>All users</option></select>
            <button className="rf-btn">FILTER</button>
          </div>
        </div>

        <div className="rf-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="rf-table">
              <thead>
                <tr>
                  <th>EVENT ID</th>
                  <th>TIMESTAMP</th>
                  <th>USER</th>
                  <th>ACTION</th>
                  <th>TARGET</th>
                  <th>DETAILS</th>
                  <th>HASH</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 30).map(e => (
                  <tr key={e.id}>
                    <td className="font-mono text-[#f5a623] text-[11px]">{e.id}</td>
                    <td className="font-mono text-[11px] text-[#a1a1aa]">{e.timestamp}</td>
                    <td>{e.user}</td>
                    <td><ActionTag action={e.action} /></td>
                    <td className="font-mono text-[11px]">{e.target}</td>
                    <td className="text-[#a1a1aa] text-[11px] max-w-xs truncate">{e.details}</td>
                    <td className="font-mono text-[10px] text-[#6b6b73]">{e.hash.slice(0, 8)}…</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="text-xs text-[#6b6b73] text-center tracking-[0.15em]">
          Showing {Math.min(30, filtered.length)} of {filtered.length} events — ledger cryptographically chained (Merkle root: 4f2a…b1c9)
        </div>
      </div>
    </>
  );
}

function ActionTag({ action }: { action: string }) {
  const map: Record<string, "red" | "amber" | "green" | "blue" | "muted"> = {
    ESCALATED: "red",
    SLA_BREACH: "red",
    AI_CLASSIFIED: "blue",
    ASSIGNED: "amber",
    ROUTED: "amber",
    CLOSED: "green",
    AUTO_ACKNOWLEDGED: "green",
    DUPLICATE_FLAGGED: "amber",
    RISK_OVERRIDDEN: "red",
    AUDIT_EXPORTED: "muted",
  };
  return <Tag color={map[action] || "muted"}>{action.replace(/_/g, " ")}</Tag>;
}
