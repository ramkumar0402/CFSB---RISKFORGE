import { useState } from "react";
import { Card, SectionTitle } from "./ui";
import { TopBar } from "./Sidebar";
import { CASES } from "../lib/data";
import { useSetAtom } from "jotai";
import { toastAtom } from "../lib/atoms";
import { Search, Sparkles } from "lucide-react";

export function RAGSearch() {
  const setToast = useSetAtom(toastAtom);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<typeof CASES | null>(null);
  function go() {
    if (!q.trim()) return;
    const hits = CASES.filter(c =>
      c.narrative.toLowerCase().includes(q.toLowerCase()) ||
      c.issue.toLowerCase().includes(q.toLowerCase())
    ).slice(0, 8);
    setResults(hits);
    setToast(`RAG: ${hits.length} similar cases retrieved`);
  }
  return (
    <>
      <TopBar
        title="RAG Search"
        subtitle="Retrieval-augmented semantic search across 3M+ complaints."
        right={
          <button className="rf-btn flex items-center gap-1.5">
            🔔 ALERTS <span className="rf-tag rf-tag-red ml-1">58</span>
          </button>
        }
      />
      <div className="p-8 space-y-5">
        <Card>
          <SectionTitle>SEMANTIC QUERY</SectionTitle>
          <div className="flex items-center gap-2">
            <div className="rf-input flex items-center gap-2 !py-0 flex-1">
              <Search className="w-4 h-4 text-[#6b6b73]" />
              <input
                value={q}
                onChange={e => setQ(e.target.value)}
                onKeyDown={e => e.key === "Enter" && go()}
                placeholder="e.g. 'identity theft with credit card fraud in California'"
                className="bg-transparent border-0 outline-none flex-1 text-xs py-2.5"
              />
            </div>
            <button onClick={go} className="rf-btn rf-btn-primary flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> SEARCH
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-[10px]">
            {["identity theft", "wrongful repossession", "billing dispute", "loan modification", "harassment"].map(s => (
              <button key={s} onClick={() => { setQ(s); }} className="rf-btn !py-1.5 !px-2.5 text-[10px]">{s}</button>
            ))}
          </div>
        </Card>

        {results && (
          <Card>
            <SectionTitle right={<span className="text-[10px] text-[#6b6b73] tracking-[0.2em]">{results.length} HITS</span>}>
              SIMILAR CASES
            </SectionTitle>
            <div className="space-y-3">
              {results.map(c => (
                <div key={c.id} className="border border-[#1a1a1d] p-4 hover:border-[#f5a623] transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[#f5a623] text-xs">{c.id}</span>
                      <span className="text-xs">{c.product}</span>
                      <span className="text-xs text-[#6b6b73]">{c.company}</span>
                    </div>
                    <span className="rf-tag rf-tag-amber">SIM 0.{(70 + Math.floor(Math.random() * 25))}</span>
                  </div>
                  <p className="text-[11px] text-[#a1a1aa] mt-2 line-clamp-2">{c.narrative}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {!results && (
          <div className="text-center py-20 text-[#3a3a3e] tracking-[0.2em] text-xs uppercase">
            Run a query to see retrieval results.
          </div>
        )}
      </div>
    </>
  );
}
