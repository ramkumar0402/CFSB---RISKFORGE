import { ReactNode } from "react";
import { cn } from "../utils/cn";

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("rf-card p-5", className)}>{children}</div>;
}

export function SectionTitle({ children, right, className }: { children: ReactNode; right?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-center justify-between mb-4", className)}>
      <h3 className="rf-section-title">{children}</h3>
      {right}
    </div>
  );
}

export function Stat({ label, value, color = "default", sub }: { label: string; value: ReactNode; color?: "default" | "amber" | "red" | "green" | "blue"; sub?: ReactNode }) {
  const colorMap = {
    default: "text-[#e5e5e7]",
    amber: "text-[#f5a623] rf-glow-amber",
    red: "text-[#ef4444] rf-glow-red",
    green: "text-[#22c55e] rf-glow-green",
    blue: "text-[#3b82f6] rf-glow-blue",
  };
  return (
    <div className="rf-stat p-4 flex flex-col gap-1">
      <div className="rf-section-title">{label}</div>
      <div className={cn("text-3xl font-semibold leading-none tracking-tight", colorMap[color])}>{value}</div>
      {sub && <div className="text-[10px] text-[#6b6b73] tracking-wider mt-1">{sub}</div>}
    </div>
  );
}

export function Tag({ children, color = "muted" }: { children: ReactNode; color?: "muted" | "red" | "amber" | "green" | "blue" }) {
  return <span className={cn("rf-tag", color !== "muted" && `rf-tag-${color}`)}>{children}</span>;
}

export function LiveDot({ className }: { className?: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="rf-pulse" />
      <span className={cn("text-[10px] tracking-[0.18em] text-[#a1a1aa] uppercase", className)}>Live</span>
    </div>
  );
}
