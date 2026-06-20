import { useState } from "react";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, ReferenceLine } from "recharts";
import { Card, SectionTitle, Stat } from "./ui";
import { VOLUME_FORECAST, CASES } from "../lib/data";
import { TopBar } from "./Sidebar";
import { Play, ChevronDown } from "lucide-react";

export function Forecasting() {
  const [selected, setSelected] = useState(CASES[0]?.id || "RF-304070");
  return (
    <>
      <TopBar
        title="Forecasting"
        subtitle="XGBoost resolution-time predictor + naive volume projection."
        right={
          <div className="flex items-center gap-2">
            <button className="rf-btn flex items-center gap-1.5">
              🔔 ALERTS <span className="rf-tag rf-tag-red ml-1">58</span>
            </button>
            <button className="rf-btn rf-btn-primary flex items-center gap-1.5">
              ▶ TRAIN MODEL
            </button>
          </div>
        }
      />
      <div className="p-8 space-y-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="MODEL STATUS" value={<span className="text-2xl tracking-wider text-[#6b6b73]">NOT TRAINED</span>} />
          <Stat label="SAMPLES" value="0" />
          <Stat label="MAE (DAYS)" value={<span className="text-[#6b6b73]">—</span>} />
          <Stat label="RMSE (DAYS)" value={<span className="text-[#6b6b73]">—</span>} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <Card className="lg:col-span-2">
            <SectionTitle right={<span className="text-[10px] text-[#6b6b73] tracking-[0.2em]">HISTORY 28D + 14D FORECAST</span>}>
              VOLUME FORECAST
            </SectionTitle>
            <div style={{ width: "100%", height: 320 }}>
              <ResponsiveContainer>
                <LineChart data={VOLUME_FORECAST} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <XAxis dataKey="date" tick={{ fill: "#6b6b73", fontSize: 10 }} axisLine={{ stroke: "#1a1a1d" }} tickLine={false} />
                  <YAxis tick={{ fill: "#6b6b73", fontSize: 10 }} axisLine={{ stroke: "#1a1a1d" }} tickLine={false} />
                  <Tooltip contentStyle={{ background: "#0a0a0c", border: "1px solid #1a1a1d", fontSize: 12 }} />
                  <ReferenceLine x="06-19" stroke="#f5a623" strokeDasharray="3 3" label={{ value: "NOW", fill: "#f5a623", fontSize: 10 }} />
                  <Line type="monotone" dataKey="history" stroke="#3b82f6" strokeWidth={1.5} dot={false} />
                  <Line type="monotone" dataKey="forecast" stroke="#f5a623" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-6 mt-3 text-[10px] tracking-[0.15em]">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-[#f5a623]" style={{ borderTop: "1px dashed #f5a623" }} />
                <span className="text-[#a1a1aa] uppercase">FORECAST</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-[#3b82f6]" />
                <span className="text-[#a1a1aa] uppercase">HISTORY</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-5">
              <div className="border border-[#1a1a1d] p-4">
                <div className="rf-section-title">FORECASTED WEEKLY</div>
                <div className="text-3xl font-bold mt-2">1416.8</div>
              </div>
              <div className="border border-[#1a1a1d] p-4">
                <div className="rf-section-title">FORECASTED MONTHLY</div>
                <div className="text-3xl font-bold mt-2">6072</div>
              </div>
            </div>
          </Card>

          <Card>
            <SectionTitle right={<span className="text-[10px] text-[#6b6b73] tracking-[0.2em]">PER CASE</span>}>
              PREDICT RESOLUTION TIME
            </SectionTitle>
            <div className="mt-2">
              <div className="text-[10px] tracking-[0.18em] text-[#6b6b73] mb-1">CASE</div>
              <div className="relative">
                <select
                  value={selected}
                  onChange={(e) => setSelected(e.target.value)}
                  className="rf-input appearance-none pr-8 cursor-pointer"
                >
                  {CASES.slice(0, 20).map(c => (
                    <option key={c.id} value={c.id}>{c.id} — {c.product}</option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-[#6b6b73] pointer-events-none" />
              </div>
            </div>
            <button className="w-full mt-4 rf-btn flex items-center justify-center gap-2">
              <Play className="w-3.5 h-3.5" /> TRAIN MODEL FIRST
            </button>
          </Card>
        </div>

        <Card>
          <SectionTitle right={<span className="text-[10px] text-[#6b6b73] tracking-[0.2em]">TOP DRIVERS OF RESOLUTION TIME</span>}>
            FEATURE IMPORTANCE
          </SectionTitle>
          <div className="text-[11px] text-[#6b6b73] tracking-[0.15em] py-12 text-center uppercase">
            Train the model to reveal importances.
          </div>
        </Card>
      </div>
    </>
  );
}
