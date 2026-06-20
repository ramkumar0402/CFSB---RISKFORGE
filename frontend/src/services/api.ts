/**
 * RISKFORGE — API service layer
 * Thin HTTP client for the FastAPI backend. Falls back to in-memory mock data
 * when the backend is not reachable (demo mode).
 */

import { CASES, AUDIT_EVENTS, USERS, PROMPTS, COMPLIANCE_METRICS } from "../lib/data";

const BASE_URL = (import.meta as any).env?.VITE_API_URL || "/api";
const USE_MOCK = true; // Toggle to hit the real FastAPI backend

// ── Low-level fetch wrapper ────────────────────────────────────────────────
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (USE_MOCK) {
    return mock<T>(path, init);
  }
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    ...init,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ── Public API surface ──────────────────────────────────────────────────────
export const api = {
  login: (email: string, password: string) =>
    request<{ access_token: string; role: string }>("/users/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  register: (name: string, email: string, password: string, role: string) =>
    request<{ id: string; email: string; role: string }>("/users/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password, role }),
    }),

  listComplaints: (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request<any[]>(`/complaints${qs ? "?" + qs : ""}`);
  },

  createComplaint: (payload: any) =>
    request<any>("/complaints", { method: "POST", body: JSON.stringify(payload) }),

  classify: (id: string) =>
    request<any>(`/complaints/${id}/classify`, { method: "POST" }),

  triggerWorkflow: (id: string) =>
    request<any>(`/complaints/${id}/workflow`, { method: "POST" }),

  kpis: () => request<any>("/analytics/kpis"),
  riskDistribution: () => request<any>("/analytics/risk-distribution"),
  dailyVolume: () => request<any>("/analytics/daily-volume"),
  ragSearch: (query: string, top_k = 8) =>
    request<any>("/analytics/rag/search", {
      method: "POST",
      body: JSON.stringify({ query, top_k }),
    }),
  forecastVolume: () => request<any>("/analytics/ml/forecast-volume"),
  auditLog: (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request<any[]>(`/analytics/audit-log${qs ? "?" + qs : ""}`);
  },
};

// ── Mock layer (keeps the frontend demo-complete without a backend) ────────
function mock<T>(path: string, init?: RequestInit): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (path === "/users/login") {
        const body = JSON.parse(init?.body || "{}");
        const role = body.email.startsWith("admin") ? "ADMIN" :
                     body.email.startsWith("analyst") ? "ANALYST" :
                     body.email.startsWith("manager") ? "MANAGER" :
                     body.email.startsWith("compliance") ? "COMPLIANCE" : "ANALYST";
        return resolve({ access_token: "demo-token", role } as any);
      }
      if (path === "/users/register") {
        const body = JSON.parse(init?.body || "{}");
        return resolve({ id: "U-" + Date.now(), email: body.email, role: body.role } as any);
      }
      if (path.startsWith("/complaints") && init?.method !== "POST") {
        return resolve(CASES.slice(0, 50) as any);
      }
      if (path === "/analytics/kpis") {
        return resolve({
          total_cases: COMPLIANCE_METRICS.totalProcessed,
          high_risk: COMPLIANCE_METRICS.highRisk,
          escalated: COMPLIANCE_METRICS.escalated,
          closed: COMPLIANCE_METRICS.closed,
        } as any);
      }
      if (path === "/analytics/audit-log") {
        return resolve(AUDIT_EVENTS.slice(0, 50) as any);
      }
      resolve([] as any);
    }, 120);
  });
}

export default api;
