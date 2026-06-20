import { useAtomValue, useAtom, useSetAtom } from "jotai";
import { useEffect } from "react";
import { authAtom, pageAtom, toastAtom } from "./lib/atoms";
import { Sidebar } from "./components/Sidebar";
import { Login } from "./components/Login";
import { Executive } from "./components/Executive";
import { Operational } from "./components/Operational";
import { AIMetrics } from "./components/AIMetrics";
import { Forecasting } from "./components/Forecasting";
import { Inbox } from "./components/Inbox";
import { NewCase } from "./components/NewCase";
import { BulkUpload } from "./components/BulkUpload";
import { Workflows } from "./components/Workflows";
import { AgentConsole } from "./components/AgentConsole";
import { RAGSearch } from "./components/RAGSearch";
import { Governance } from "./components/Governance";
import { AuditTrail } from "./components/AuditTrail";
import { Users } from "./components/Users";
import { Prompts } from "./components/Prompts";

/**
 * RISKFORGE — App shell
 *
 * Frontend architecture:
 *   pages/        — full-screen views (thin re-export wrappers)
 *   components/   — reusable UI (Login, Sidebar, dashboard views, forms)
 *   services/     — API service layer (api.ts)
 *   lib/          — state (atoms) + synthetic data
 *   utils/        — cn() helper
 */

const PAGE_MAP: Record<string, React.ComponentType> = {
  Executive,
  Operational,
  AIMetrics,
  Forecasting,
  Inbox,
  "New Case": NewCase,
  "Bulk Upload": BulkUpload,
  Workflows,
  "Agent Console": AgentConsole,
  "RAG Search": RAGSearch,
  Governance,
  "Audit Trail": AuditTrail,
  Users,
  Prompts,
};

export default function App() {
  const auth = useAtomValue(authAtom);
  const [page] = useAtom(pageAtom);
  const toast = useAtomValue(toastAtom);
  const setToast = useSetAtom(toastAtom);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 2200);
      return () => clearTimeout(t);
    }
  }, [toast, setToast]);

  if (!auth) return <Login />;

  const PageComponent = PAGE_MAP[page] ?? Executive;

  return (
    <div className="min-h-screen flex bg-[#050505] text-[#e5e5e7]">
      <Sidebar />
      <main className="flex-1 min-w-0 rf-scroll-y">
        <PageComponent />
      </main>
      {toast && <div className="rf-toast">{toast}</div>}
    </div>
  );
}
