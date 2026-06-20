import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { Card, SectionTitle } from "./ui";
import { WORKFLOW_STAGE, DEPARTMENT_ROUTING, ASSIGNED } from "../lib/data";
import { TopBar } from "./Sidebar";
import { useState } from "react";
import { AlertTriangle } from "lucide-react";

export function Operational() {
  const [hover, setHover] = useState<{ stage: string; value: number } | null>(null);
  return (
    <>
      <TopBar
        title="Operational Dashboard"
        subtitle="Throughput, workload, and team performance."
        right={
          <button className="rf-btn flex items-center gap-1.5">
            🔔 ALERTS <span className="rf-tag rf-tag-red ml-1">58</span>
          </button>
        }
      />
      <div className="p-8 space-y-5">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card>
            <SectionTitle>WORKFLOW STAGE</SectionTitle>
            <div style={{ width: "100%", height: 280 }}>
              <ResponsiveContainer>
                <BarChart data={WORKFLOW_STAGE} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} onMouseLeave={() => setHover(null)}>
                  <XAxis dataKey="stage" tick={{ fill: "#6b6b73", fontSize: 10 }} axisLine={{ stroke: "#1a1a1d" }} tickLine={false} />
                  <YAxis tick={{ fill: "#6b6b73", fontSize: 10 }} axisLine={{ stroke: "#1a1a1d" }} tickLine={false} />
                  <Tooltip contentStyle={{ background: "#0a0a0c", border: "1px solid #1a1a1d", fontSize: 12 }} cursor={{ fill: "rgba(255,255,255,0.02)" }} />
                  <Bar dataKey="count" radius={[1, 1, 0, 0]} onMouseOver={(d: any) => setHover({ stage: d.stage, value: d.count })}>
                    {WORKFLOW_STAGE.map(s => <Bar key={s.stage} dataKey="count" fill={s.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            {hover && (
              <div className="absolute top-20 left-32 bg-[#0a0a0c] border border-[#f5a623] p-3 rounded text-xs">
                <div className="text-[#e5e5e7] font-semibold">{hover.stage}</div>
                <div className="text-[#f5a623]">value : {hover.value}</div>
              </div>
            )}
          </Card>

          <Card>
            <SectionTitle>DEPARTMENT ROUTING</SectionTitle>
            <div style={{ width: "100%", height: 280 }}>
              <ResponsiveContainer>
                <BarChart data={DEPARTMENT_ROUTING} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <XAxis dataKey="dept" tick={{ fill: "#6b6b73", fontSize: 9 }} axisLine={{ stroke: "#1a1a1d" }} tickLine={false} angle={-12} dy={6} />
                  <YAxis tick={{ fill: "#6b6b73", fontSize: 10 }} axisLine={{ stroke: "#1a1a1d" }} tickLine={false} />
                  <Tooltip contentStyle={{ background: "#0a0a0c", border: "1px solid #1a1a1d", fontSize: 12 }} cursor={{ fill: "rgba(255,255,255,0.02)" }} />
                  <Bar dataKey="count" fill="#3b82f6" radius={[1, 1, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card>
            <SectionTitle>CURRENT ASSIGNEES</SectionTitle>
            <div style={{ width: "100%", height: 280 }}>
              <ResponsiveContainer>
                <BarChart data={ASSIGNED} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fill: "#6b6b73", fontSize: 10 }} axisLine={{ stroke: "#1a1a1d" }} tickLine={false} />
                  <YAxis tick={{ fill: "#6b6b73", fontSize: 10 }} axisLine={{ stroke: "#1a1a1d" }} tickLine={false} />
                  <Tooltip contentStyle={{ background: "#0a0a0c", border: "1px solid #1a1a1d", fontSize: 12 }} cursor={{ fill: "rgba(255,255,255,0.02)" }} />
                  <Bar dataKey="count" fill="#22c55e" radius={[1, 1, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="flex flex-col items-center justify-center text-center relative">
            <SectionTitle className="w-full">PENDING REVIEWS</SectionTitle>
            <div className="flex-1 flex flex-col items-center justify-center w-full">
              <div className="rf-section-title">UNRESOLVED CASES</div>
              <div className="text-7xl font-bold text-[#f5a623] rf-glow-amber my-3">4067</div>
              <div className="rf-section-title">REQUIRE ATTENTION</div>
            </div>
            <div className="w-full mt-2 border-t border-[#1a1a1d] pt-3 flex items-start gap-2 text-left">
              <AlertTriangle className="w-4 h-4 text-[#ef4444] mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-xs text-[#ef4444] font-semibold">58 new SLA breach(es)</div>
                <div className="text-[11px] text-[#a1a1aa] mt-1">CFPB-100021 — Banking</div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
