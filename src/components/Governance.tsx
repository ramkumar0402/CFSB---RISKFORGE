import { Card, SectionTitle, Stat, Tag } from "./ui";
import { TopBar } from "./Sidebar";
import { GOVERNANCE_POLICIES, COMPLIANCE_METRICS } from "../lib/data";
import { CheckCircle2, AlertTriangle, FileText } from "lucide-react";

export function Governance() {
  return (
    <>
      <TopBar
        title="Governance"
        subtitle="Policies, controls, and regulatory alignment."
        right={
          <button className="rf-btn flex items-center gap-1.5">
            🔔 ALERTS <span className="rf-tag rf-tag-red ml-1">58</span>
          </button>
        }
      />
      <div className="p-8 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Stat label="POLICIES" value={GOVERNANCE_POLICIES.length} />
          <Stat label="COMPLIANT" value={GOVERNANCE_POLICIES.filter(p => p.status === "Compliant").length} color="green" />
          <Stat label="UNDER REVIEW" value={GOVERNANCE_POLICIES.filter(p => p.status === "Review").length} color="amber" />
          <Stat label="AI RECALL" value={`${Math.round(COMPLIANCE_METRICS.aiAccuracy * 100)}%`} color="green" sub={`vs rule-only ${Math.round(COMPLIANCE_METRICS.ruleOnlyRecall * 100)}%`} />
        </div>

        <Card>
          <SectionTitle right={<button className="rf-btn flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> EXPORT POLICY PACK</button>}>
            REGULATORY FRAMEWORK
          </SectionTitle>
          <table className="rf-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>POLICY</th>
                <th>STATUS</th>
                <th>OWNER</th>
                <th>LAST REVIEW</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {GOVERNANCE_POLICIES.map(p => (
                <tr key={p.id}>
                  <td className="font-mono text-[#f5a623]">{p.id}</td>
                  <td>{p.name}</td>
                  <td>
                    {p.status === "Compliant" ? (
                      <Tag color="green"><CheckCircle2 className="w-3 h-3 inline mr-1" /> COMPLIANT</Tag>
                    ) : (
                      <Tag color="amber"><AlertTriangle className="w-3 h-3 inline mr-1" /> REVIEW</Tag>
                    )}
                  </td>
                  <td>{p.owner}</td>
                  <td className="text-[#6b6b73] font-mono text-[11px]">{p.lastReview}</td>
                  <td className="text-right">
                    <button className="rf-btn">OPEN</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Card>
            <SectionTitle>MODEL RISK ASSESSMENT</SectionTitle>
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-[#111114] pb-2">
                <span className="text-[#a1a1aa]">Bias testing (demographic parity)</span>
                <Tag color="green">PASSED</Tag>
              </div>
              <div className="flex items-center justify-between border-b border-[#111114] pb-2">
                <span className="text-[#a1a1aa]">Drift detection (PSI)</span>
                <Tag color="green">STABLE</Tag>
              </div>
              <div className="flex items-center justify-between border-b border-[#111114] pb-2">
                <span className="text-[#a1a1aa]">Hallucination guardrails</span>
                <Tag color="amber">MONITORING</Tag>
              </div>
              <div className="flex items-center justify-between border-b border-[#111114] pb-2">
                <span className="text-[#a1a1aa]">PII redaction</span>
                <Tag color="green">VERIFIED</Tag>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#a1a1aa]">Human-in-the-loop review</span>
                <Tag color="green">ENABLED</Tag>
              </div>
            </div>
          </Card>

          <Card>
            <SectionTitle>DATA RETENTION</SectionTitle>
            <div className="space-y-3 text-xs">
              <Row label="Active case data" value="5 years" />
              <Row label="Closed case records" value="7 years" />
              <Row label="Audit logs" value="10 years (immutable)" />
              <Row label="PII fields" value="Tokenized at rest" />
              <Row label="Cross-border transfer" value="EU/US — SCC enforced" />
              <Row label="Encryption" value="AES-256-GCM at rest, TLS 1.3 in transit" />
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-[#111114] pb-2">
      <span className="text-[#a1a1aa]">{label}</span>
      <span className="text-[#e5e5e7] font-mono">{value}</span>
    </div>
  );
}
