import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from "recharts";
import { Card, SectionTitle, Stat } from "./ui";
import { CONFIDENCE_BUCKETS, FRAUD_SIGNALS, SENTIMENT } from "../lib/data";
import { TopBar } from "./Sidebar";

export function AIMetrics() {
  return (
    <>
      <TopBar
        title="AI Metrics"
        subtitle="Model performance, confidence, and behavior over time."
        right={
          <button className="rf-btn flex items-center gap-1.5">
            🔔 ALERTS <span className="rf-tag rf-tag-red ml-1">58</span>
          </button>
        }
      />
      <div className="p-8 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Stat label="CASES CLASSIFIED" value="17" />
          <Stat label="AVG CONFIDENCE" value="86.9%" color="green" />
          <Stat label="ACTIVE MODELS" value="2" sub="CLAUDE 4.5 / GPT 5.2" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card>
            <SectionTitle>CONFIDENCE HISTOGRAM</SectionTitle>
            <div style={{ width: "100%", height: 280 }}>
              <ResponsiveContainer>
                <BarChart data={CONFIDENCE_BUCKETS} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <XAxis dataKey="bucket" tick={{ fill: "#6b6b73", fontSize: 10 }} axisLine={{ stroke: "#1a1a1d" }} tickLine={false} />
                  <YAxis tick={{ fill: "#6b6b73", fontSize: 10 }} axisLine={{ stroke: "#1a1a1d" }} tickLine={false} />
                  <Tooltip contentStyle={{ background: "#0a0a0c", border: "1px solid #1a1a1d", fontSize: 12 }} cursor={{ fill: "rgba(255,255,255,0.02)" }} />
                  <Bar dataKey="count" fill="#3b82f6" radius={[1, 1, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card>
            <SectionTitle>SENTIMENT DISTRIBUTION</SectionTitle>
            <div style={{ width: "100%", height: 280 }} className="flex items-center justify-center">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={SENTIMENT} dataKey="count" innerRadius={75} outerRadius={105} stroke="none" startAngle={90} endAngle={-270}>
                    {SENTIMENT.map(s => <Cell key={s.sentiment} fill={s.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-4 text-[10px] tracking-[0.15em] -mt-3">
              {SENTIMENT.map(s => (
                <div key={s.sentiment} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ background: s.color }} />
                  <span className="text-[#a1a1aa] uppercase">{s.sentiment}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <Card>
          <SectionTitle>FRAUD INDICATORS DETECTED</SectionTitle>
          <div style={{ width: "100%", height: 320 }}>
            <ResponsiveContainer>
              <BarChart data={FRAUD_SIGNALS} layout="vertical" margin={{ top: 10, right: 20, left: 30, bottom: 0 }}>
                <XAxis type="number" tick={{ fill: "#6b6b73", fontSize: 10 }} axisLine={{ stroke: "#1a1a1d" }} tickLine={false} />
                <YAxis type="category" dataKey="signal" tick={{ fill: "#a1a1aa", fontSize: 10 }} axisLine={{ stroke: "#1a1a1d" }} tickLine={false} width={160} />
                <Tooltip contentStyle={{ background: "#0a0a0c", border: "1px solid #1a1a1d", fontSize: 12 }} cursor={{ fill: "rgba(255,255,255,0.02)" }} />
                <Bar dataKey="count" fill="#ef4444" radius={[0, 1, 1, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </>
  );
}
