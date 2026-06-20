import { Card, SectionTitle, Tag } from "./ui";
import { TopBar } from "./Sidebar";
import { USERS } from "../lib/data";
import { Plus } from "lucide-react";

export function Users() {
  return (
    <>
      <TopBar
        title="Users"
        subtitle="Identity, roles, and access governance."
        right={
          <div className="flex items-center gap-2">
            <button className="rf-btn flex items-center gap-1.5">
              🔔 ALERTS <span className="rf-tag rf-tag-red ml-1">58</span>
            </button>
            <button className="rf-btn rf-btn-primary flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" /> INVITE USER
            </button>
          </div>
        }
      />
      <div className="p-8 space-y-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { l: "TOTAL USERS", v: USERS.length },
            { l: "ACTIVE NOW", v: 2 },
            { l: "ADMINS", v: 1 },
            { l: "AI AGENTS", v: 1 },
          ].map(s => (
            <div key={s.l} className="rf-stat p-4">
              <div className="rf-section-title">{s.l}</div>
              <div className="text-3xl font-semibold mt-1">{s.v}</div>
            </div>
          ))}
        </div>
        <Card>
          <SectionTitle>USER ROSTER</SectionTitle>
          <table className="rf-table">
            <thead>
              <tr>
                <th>USER ID</th>
                <th>EMAIL</th>
                <th>ROLE</th>
                <th>STATUS</th>
                <th>LAST ACTIVE</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {USERS.map(u => (
                <tr key={u.id}>
                  <td className="font-mono text-[#f5a623]">{u.id}</td>
                  <td>{u.name}</td>
                  <td><Tag color={u.role === "ADMIN" ? "amber" : u.role === "AI-AGENT" ? "blue" : "muted"}>{u.role}</Tag></td>
                  <td><Tag color="green">● {u.status.toUpperCase()}</Tag></td>
                  <td className="font-mono text-[11px] text-[#a1a1aa]">{u.lastActive}</td>
                  <td className="text-right"><button className="rf-btn">MANAGE</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </>
  );
}
