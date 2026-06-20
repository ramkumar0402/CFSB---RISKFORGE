import {
  AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, BarChart, Bar,
  PieChart, Pie, Cell,
} from "recharts";
import { Card, SectionTitle, Stat } from "./ui";
import { DAILY_VOLUME, RISK_DIST, VOLUME_BY_PRODUCT, TOP_STATES } from "../lib/data";
import { TopBar } from "./Sidebar";

export function Executive() {
  return (
    <>
      <TopBar
        title="Executive Dashboard"
        subtitle="Real-time operational risk posture & escalation health."
        right={
          <div className="flex items-center gap-2">
            <button className="rf-btn flex items-center gap-1.5">
              🔔 ALERTS <span className="rf-tag rf-tag-red ml-1">58</span>
            </button>
            <div className="rf-btn flex items-center gap-1.5 cursor-default">
              <span className="w-1.5 h-1.5 rounded-full bg-[#f5a623]" /> CFPB / LIVE
            </div>
          </div>
        }
      />
      <div className="p-8 space-y-5">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <Stat label="TOTAL CASES" value="4071" />
          <Stat label="HIGH RISK" value="14" color="red" />
          <Stat label="ESCALATED" value="0" color="amber" />
          <Stat label="CLOSED" value="4" color="green" />
          <Stat label="ESC. RATE" value="0%" color="amber" />
          <Stat label="SLA COMP." value="98.6%" color="green" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <Card className="lg:col-span-2">
            <SectionTitle right={<span className="text-[10px] text-[#6b6b73] tracking-[0.2em]">LAST 14 DAYS</span>}>
              DAILY COMPLAINT VOLUME
            </SectionTitle>
            <div style={{ width: "100%", height: 280 }}>
              <ResponsiveContainer>
                <AreaChart data={DAILY_VOLUME} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="g-amber" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f5a623" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="#f5a623" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fill: "#6b6b73", fontSize: 10 }} axisLine={{ stroke: "#1a1a1d" }} tickLine={false} />
                  <YAxis tick={{ fill: "#6b6b73", fontSize: 10 }} axisLine={{ stroke: "#1a1a1d" }} tickLine={false} />
                  <Tooltip contentStyle={{ background: "#0a0a0c", border: "1px solid #1a1a1d", fontSize: 12 }} />
                  <Area type="monotone" dataKey="volume" stroke="#f5a623" strokeWidth={1.5} fill="url(#g-amber)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card>
            <SectionTitle right={<span className="text-[10px] text-[#6b6b73] tracking-[0.2em]">ALL CASES</span>}>
              RISK DISTRIBUTION
            </SectionTitle>
            <div style={{ width: "100%", height: 280 }} className="flex items-center justify-center">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={RISK_DIST} dataKey="count" innerRadius={75} outerRadius={105} stroke="none" startAngle={90} endAngle={-270}>
                    {RISK_DIST.map(d => <Cell key={d.tier} fill={d.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-4 text-[10px] tracking-[0.15em] -mt-3">
              {RISK_DIST.map(d => (
                <div key={d.tier} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ background: d.color }} />
                  <span className="text-[#a1a1aa] uppercase">{d.tier}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card>
            <SectionTitle right={<span className="text-[10px] text-[#6b6b73] tracking-[0.2em]">TOTAL</span>}>
              VOLUME BY PRODUCT
            </SectionTitle>
            <div style={{ width: "100%", height: 280 }}>
              <ResponsiveContainer>
                <BarChart data={VOLUME_BY_PRODUCT} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <XAxis dataKey="product" tick={{ fill: "#6b6b73", fontSize: 10 }} axisLine={{ stroke: "#1a1a1d" }} tickLine={false} />
                  <YAxis tick={{ fill: "#6b6b73", fontSize: 10 }} axisLine={{ stroke: "#1a1a1d" }} tickLine={false} />
                  <Tooltip contentStyle={{ background: "#0a0a0c", border: "1px solid #1a1a1d", fontSize: 12 }} cursor={{ fill: "rgba(255,255,255,0.02)" }} />
                  <Bar dataKey="count" fill="#3b82f6" radius={[1, 1, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card>
            <SectionTitle right={<span className="text-[10px] text-[#6b6b73] tracking-[0.2em]">US STATE HEATMAP</span>}>
              GEOGRAPHIC EXPOSURE
            </SectionTitle>
            <div className="grid grid-cols-2 gap-6 mt-2">
              <USMap />
              <div>
                <div className="rf-section-title mb-3">TOP STATES</div>
                <div className="space-y-2">
                  {TOP_STATES.map((s, i) => (
                    <div key={s.code} className="flex items-center justify-between border-b border-[#111114] pb-2">
                      <div className="flex items-center gap-3">
                        <div className="text-[9px] tracking-[0.2em] text-[#6b6b73]">{String(i + 1).padStart(2, "0")}</div>
                        <div className="text-xs text-[#e5e5e7] tracking-[0.15em]">{s.code}</div>
                      </div>
                      <div className="text-xs text-[#f5a623] font-semibold">{s.count}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <div className="rf-section-title mb-2">INTENSITY</div>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div key={i} className="w-4 h-2" style={{ background: `rgba(245, 166, 35, ${0.05 + i * 0.1})` }} />
                    ))}
                  </div>
                  <div className="flex justify-between text-[8px] text-[#6b6b73] mt-1">
                    <span>0</span><span>10</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}

function USMap() {
  // Tiny schematic US map
  const states = [
    { code: "CA", x: 50, y: 200, v: 8 },
    { code: "TX", x: 215, y: 295, v: 9 },
    { code: "FL", x: 320, y: 320, v: 10 },
    { code: "NY", x: 360, y: 110, v: 10 },
    { code: "PA", x: 340, y: 140, v: 7 },
    { code: "IL", x: 250, y: 165, v: 4 },
    { code: "OH", x: 295, y: 155, v: 3 },
    { code: "GA", x: 305, y: 260, v: 4 },
  ];
  return (
    <svg viewBox="0 0 450 400" className="w-full h-auto">
      {Array.from({ length: 50 }).map((_, i) => {
        const x = (i % 10) * 45 + 10;
        const y = Math.floor(i / 10) * 80 + 30;
        const s = states.find(s => Math.abs(s.x - x) < 25 && Math.abs(s.y - y) < 35);
        return (
          <rect key={i} x={x} y={y} width="36" height="60" fill={s ? `rgba(245,166,35,${0.1 + s.v * 0.1})` : "#0a0a0c"} stroke="#1a1a1d" />
        );
      })}
    </svg>
  );
}
