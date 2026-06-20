import { useState } from "react";
import { Card, SectionTitle } from "./ui";
import { TopBar as T } from "./Sidebar";
import { useSetAtom } from "jotai";
import { toastAtom } from "../lib/atoms";
import { Play, Save } from "lucide-react";

interface Node {
  id: string;
  type: "trigger" | "ai" | "condition" | "approval" | "escalate" | "notify" | "close";
  label: string;
  sub: string;
  x: number;
  y: number;
  meta?: any;
}

const INITIAL: Node[] = [
  { id: "n1", type: "trigger", label: "Complaint Received", sub: "trigger: new row in CFPB Incoming Queue", x: 80, y: 60, meta: {} },
  { id: "n2", type: "ai", label: "AI Classification", sub: '{"model":"claude-sonnet-4-5-20250929"}', x: 410, y: 60, meta: {} },
  { id: "n3", type: "condition", label: "Risk = Critical?", sub: '{"risk":"Critical"}', x: 410, y: 220, meta: {} },
  { id: "n4", type: "escalate", label: "Escalate (yes)", sub: '{"reason":"Critical risk auto-flag"}', x: 720, y: 180, meta: {} },
  { id: "n5", type: "approval", label: "Manager Approval", sub: '{"role":"manager"}', x: 410, y: 380, meta: {} },
  { id: "n6", type: "approval", label: "Compliance Review", sub: '{"role":"compliance"}', x: 720, y: 380, meta: {} },
  { id: "n7", type: "notify", label: "Teams Alert", sub: '{"channel":"#risk-ops"}', x: 410, y: 540, meta: {} },
  { id: "n8", type: "close", label: "Close Case", sub: "auto-close + audit", x: 720, y: 540, meta: {} },
];

const EDGES: { from: string; to: string; label?: string; branch?: "yes" | "no" }[] = [
  { from: "n1", to: "n2" },
  { from: "n2", to: "n3" },
  { from: "n3", to: "n4", label: "yes", branch: "yes" },
  { from: "n3", to: "n5", label: "no", branch: "no" },
  { from: "n5", to: "n6" },
  { from: "n5", to: "n7" },
  { from: "n6", to: "n8" },
];

const PALETTE: { type: Node["type"]; label: string; color: string; sub: string }[] = [
  { type: "trigger", label: "TRIGGER", color: "#3b82f6", sub: "" },
  { type: "ai", label: "AI CLASSIFY", color: "#f5a623", sub: "" },
  { type: "condition", label: "RISK CONDITION", color: "#ef4444", sub: "" },
  { type: "approval", label: "APPROVAL", color: "#22c55e", sub: "" },
  { type: "escalate", label: "ESCALATE", color: "#ff3b30", sub: "" },
  { type: "notify", label: "NOTIFY TEAMS", color: "#60a5fa", sub: "" },
  { type: "close", label: "CLOSE CASE", color: "#6b6b73", sub: "" },
];

export function Workflows() {
  const setToast = useSetAtom(toastAtom);
  const [nodes] = useState<Node[]>(INITIAL);
  const [recent] = useState([
    { ts: "2026-06-19 09:59:17", case: "complaint 4090ee99_", log: "01 trigger: Complaint Received — received complaint RF-300070", status: "OK" },
  ]);

  return (
    <>
      <T
        title="Workflow Designer"
        subtitle="Power-Automate-style visual orchestration for case routing."
        right={
          <div className="flex items-center gap-2">
            <button className="rf-btn flex items-center gap-1.5">
              🔔 ALERTS <span className="rf-tag rf-tag-red ml-1">58</span>
            </button>
            <button className="rf-btn flex items-center gap-1.5" onClick={() => setToast("Workflow saved")}>
              <Save className="w-3.5 h-3.5" /> SAVE
            </button>
            <button className="rf-btn rf-btn-primary flex items-center gap-1.5" onClick={() => setToast("Flow executed — 4 cases processed")}>
              <Play className="w-3.5 h-3.5" /> EXECUTE
            </button>
          </div>
        }
      />
      <div className="p-8">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5">
          <div className="space-y-4">
            <Card>
              <SectionTitle>WORKFLOWS</SectionTitle>
              <div className="border border-[#f5a623] bg-[#16160a] p-3 text-xs tracking-[0.15em]">
                STANDARD TRIAGE V1
              </div>
            </Card>
            <Card>
              <SectionTitle>ADD NODE</SectionTitle>
              <div className="space-y-1.5">
                {PALETTE.map(p => (
                  <div key={p.type} className="rf-node !py-2 !px-3 !min-w-0 flex items-center gap-2 cursor-grab" draggable>
                    <span className="w-2 h-2 rounded-sm" style={{ background: p.color }} />
                    <span className="text-[11px] tracking-[0.15em]">{p.label}</span>
                  </div>
                ))}
              </div>
            </Card>
            <Card>
              <SectionTitle>EXECUTE AGAINST</SectionTitle>
              <select className="rf-input">
                <option>RF-304070 — Banking</option>
              </select>
            </Card>
          </div>

          <Card className="!p-0 overflow-hidden">
            <div className="rf-svg-bg relative" style={{ height: 660 }}>
              <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ height: 660 }}>
                {EDGES.map((e, i) => {
                  const from = nodes.find(n => n.id === e.from)!;
                  const to = nodes.find(n => n.id === e.to)!;
                  const x1 = from.x + 180;
                  const y1 = from.y + 30;
                  const x2 = to.x;
                  const y2 = to.y + 30;
                  const cx = (x1 + x2) / 2;
                  return (
                    <g key={i}>
                      <path
                        d={`M ${x1} ${y1} C ${cx} ${y1}, ${cx} ${y2}, ${x2} ${y2}`}
                        className="rf-edge"
                      />
                      {e.label && (
                        <g>
                          <rect x={cx - 16} y={(y1 + y2) / 2 - 9} width={32} height={18} fill="#0a0a0c" stroke="#1a1a1d" />
                          <text x={cx} y={(y1 + y2) / 2 + 4} textAnchor="middle" fill={e.branch === "yes" ? "#f5a623" : "#a1a1aa"} fontSize={10} fontFamily="monospace">{e.label}</text>
                        </g>
                      )}
                    </g>
                  );
                })}
              </svg>
              {nodes.map(n => {
                const colorMap: Record<Node["type"], string> = {
                  trigger: "rf-node-trigger",
                  ai: "rf-node-ai",
                  condition: "rf-node-condition",
                  approval: "rf-node-approval",
                  escalate: "rf-node-escalate",
                  notify: "rf-node-notify",
                  close: "rf-node-close",
                };
                const tagMap: Record<Node["type"], string> = {
                  trigger: "TRIGGER",
                  ai: "AI_CLASSIFY",
                  condition: "RISK_CONDITION",
                  approval: "APPROVAL",
                  escalate: "ESCALATE",
                  notify: "NOTIFY_TEAMS",
                  close: "CLOSE",
                };
                return (
                  <div
                    key={n.id}
                    className={`rf-node absolute ${colorMap[n.type]}`}
                    style={{ left: n.x, top: n.y, width: 220 }}
                  >
                    <div className="text-[9px] tracking-[0.18em] text-[#6b6b73]">{tagMap[n.type]}</div>
                    <div className="text-sm font-medium mt-1">{n.label}</div>
                    <div className="text-[10px] text-[#6b6b73] font-mono mt-1 break-all">{n.sub}</div>
                  </div>
                );
              })}
              {/* Legend */}
              <div className="absolute bottom-3 right-3 grid grid-cols-2 gap-1.5 text-[9px]">
                {[
                  ["#3b82f6", "Trigger"],
                  ["#f5a623", "AI"],
                  ["#ef4444", "Cond"],
                  ["#ff3b30", "Esc"],
                  ["#22c55e", "Appr"],
                  ["#60a5fa", "Notify"],
                  ["#3b82f6", "Pl"],
                  ["#6b6b73", "End"],
                ].map(([c, l], i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <div className="w-6 h-1.5" style={{ background: c }} />
                    <span className="text-[#6b6b73] tracking-wider uppercase">{l}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        <Card className="mt-5">
          <SectionTitle>RECENT RUNS</SectionTitle>
          <pre className="text-[11px] text-[#a1a1aa] font-mono whitespace-pre-wrap leading-relaxed">
{recent.map(r => (
  <div key={r.ts} className="border-b border-[#111114] py-2 flex items-center justify-between">
                <div>
                  <span className="text-[#6b6b73]">{r.ts}</span>{"\n"}
                  <span className="text-[#e5e5e7]">{r.case}</span>{"\n"}
                  <span className="text-[#a1a1aa]"><span className="text-[#f5a623]">{r.log.split(":")[0]}</span>:{r.log.split(":").slice(1).join(":")}</span>
                </div>
                <Tag color="green">{r.status}</Tag>
              </div>
            ))}
          </pre>
        </Card>
      </div>
    </>
  );
}

function Tag({ children, color }: { children: React.ReactNode; color: "red" | "amber" | "green" | "blue" | "muted" }) {
  const map = { red: "rf-tag-red", amber: "rf-tag-amber", green: "rf-tag-green", blue: "rf-tag-blue", muted: "rf-tag-muted" };
  return <span className={`rf-tag ${map[color]}`}>{children}</span>;
}
