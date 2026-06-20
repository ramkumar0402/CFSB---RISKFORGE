import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { authAtom, pageAtom, toastAtom } from "../lib/atoms";
import {
  LayoutDashboard, Activity, Brain, TrendingUp, Inbox, Plus, Upload,
  Workflow, Bot, Search, FileLock, ListChecks, Users, BookOpen, LogOut, Shield, Bell,
} from "lucide-react";

const NAV = [
  { group: "DASHBOARDS", items: [
    { id: "Executive", icon: LayoutDashboard, label: "Executive" },
    { id: "Operational", icon: Activity, label: "Operational" },
    { id: "AI Metrics", icon: Brain, label: "AI Metrics" },
    { id: "Forecasting", icon: TrendingUp, label: "Forecasting" },
  ]},
  { group: "TRIAGE", items: [
    { id: "Inbox", icon: Inbox, label: "Inbox" },
    { id: "New Case", icon: Plus, label: "New Case" },
    { id: "Bulk Upload", icon: Upload, label: "Bulk Upload" },
  ]},
  { group: "AUTOMATE", items: [
    { id: "Workflows", icon: Workflow, label: "Workflows" },
  ]},
  { group: "AI", items: [
    { id: "Agent Console", icon: Bot, label: "Agent Console" },
    { id: "RAG Search", icon: Search, label: "RAG Search" },
  ]},
  { group: "GOVERN", items: [
    { id: "Governance", icon: FileLock, label: "Governance" },
    { id: "Audit Trail", icon: ListChecks, label: "Audit Trail" },
  ]},
  { group: "ADMIN", items: [
    { id: "Users", icon: Users, label: "Users" },
    { id: "Prompts", icon: BookOpen, label: "Prompts" },
  ]},
];

export function Sidebar() {
  const [page, setPage] = useAtom(pageAtom);
  const auth = useAtomValue(authAtom);
  const setAuth = useSetAtom(authAtom);
  const setToast = useSetAtom(toastAtom);

  return (
    <aside className="w-[220px] flex-shrink-0 border-r border-[#1a1a1d] bg-[#050505] flex flex-col">
      <div className="px-5 py-5 border-b border-[#1a1a1d]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded bg-gradient-to-br from-[#f5a623] to-[#ff6b00] flex items-center justify-center">
            <Shield className="w-3.5 h-3.5 text-black" strokeWidth={2.5} />
          </div>
          <div>
            <div className="text-sm font-bold tracking-[0.18em]">RISKFORGE</div>
            <div className="text-[9px] tracking-[0.25em] text-[#6b6b73]">OP. RISK TERMINAL</div>
          </div>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto py-3">
        {NAV.map(group => (
          <div key={group.group} className="mb-4">
            <div className="px-5 py-1.5 text-[9px] tracking-[0.25em] text-[#4a4a52] uppercase">{group.group}</div>
            {group.items.map(item => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  onClick={() => { setPage(item.id); setToast(`Navigated → ${item.label}`); }}
                  className={`rf-link ${page === item.id ? "active" : ""}`}
                >
                  <Icon className="w-3.5 h-3.5" strokeWidth={1.5} />
                  <span>{item.label}</span>
                </div>
              );
            })}
          </div>
        ))}
      </nav>
      <div className="border-t border-[#1a1a1d] p-3 flex items-center justify-between">
        <div className="min-w-0">
          <div className="text-[10px] text-[#a1a1aa] truncate">{auth?.email}</div>
          <div className="mt-1 inline-block px-1.5 py-0.5 text-[9px] tracking-[0.2em] border border-[#f5a623] text-[#f5a623]">{auth?.role}</div>
        </div>
        <button
          onClick={() => { setAuth(null); }}
          className="rf-btn flex items-center gap-1.5 px-2 py-1.5"
          title="Exit terminal"
        >
          <LogOut className="w-3 h-3" /> EXIT
        </button>
      </div>
    </aside>
  );
}

export function TopBar({ title, subtitle, right }: { title: string; subtitle?: string; right?: React.ReactNode }) {
  return (
    <header className="border-b border-[#1a1a1d] px-8 py-4 flex items-center justify-between bg-[#050505]">
      <div>
        <div className="flex items-center gap-3 text-[10px] tracking-[0.25em] text-[#6b6b73]">
          <div className="rf-pulse" />
          <span>LIVE</span>
          <span>/</span>
          <span>{new Date().toISOString().slice(0, 16).replace("T", " ")} UTC</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight mt-1">{title}</h1>
        {subtitle && <p className="text-sm text-[#a1a1aa] mt-0.5">{subtitle}</p>}
      </div>
      {right ?? (
        <div className="flex items-center gap-2">
          <button className="rf-btn flex items-center gap-1.5">
            <Bell className="w-3.5 h-3.5" /> ALERTS <span className="rf-tag rf-tag-red ml-1">58</span>
          </button>
          <div className="rf-btn flex items-center gap-1.5 cursor-default">
            <span className="w-1.5 h-1.5 rounded-full bg-[#f5a623]" /> CFPB / LIVE
          </div>
        </div>
      )}
    </header>
  );
}
