import { useState } from "react";
import { Card } from "./ui";
import { TopBar } from "./Sidebar";
import { useSetAtom } from "jotai";
import { toastAtom } from "../lib/atoms";
import { ArrowRight, Check, Sparkles } from "lucide-react";

export function NewCase() {
  const setToast = useSetAtom(toastAtom);
  const [product, setProduct] = useState("Banking");
  const [channel, setChannel] = useState("Web");
  const [auto, setAuto] = useState(true);
  const [narrative, setNarrative] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function submit() {
    if (!narrative.trim()) { setToast("Narrative required"); return; }
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setToast(`Case submitted — auto-classification ${auto ? "enabled" : "disabled"}`);
      setNarrative("");
    }, 600);
  }

  return (
    <>
      <TopBar
        title="New Case"
        subtitle="Submit a complaint into the triage queue."
        right={
          <button className="rf-btn flex items-center gap-1.5">
            🔔 ALERTS <span className="rf-tag rf-tag-red ml-1">58</span>
          </button>
        }
      />
      <div className="p-8">
        <Card className="max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="PRODUCT">
              <select value={product} onChange={e => setProduct(e.target.value)} className="rf-input">
                <option>Banking</option>
                <option>Credit Card</option>
                <option>Mortgage</option>
                <option>Debt Collection</option>
                <option>Student Loan</option>
                <option>Personal Loan</option>
                <option>Money Transfer</option>
              </select>
            </Field>
            <Field label="SUB-PRODUCT">
              <input className="rf-input" placeholder="Checking / Savings / HELOC..." />
            </Field>
            <Field label="ISSUE TYPE">
              <input className="rf-input" placeholder="e.g. Incorrect information on credit report" />
            </Field>
            <Field label="COMPANY">
              <input className="rf-input" placeholder="JPMORGAN CHASE & CO." />
            </Field>
            <Field label="STATE">
              <input className="rf-input" placeholder="CA, NY, TX..." />
            </Field>
            <Field label="CHANNEL">
              <select value={channel} onChange={e => setChannel(e.target.value)} className="rf-input">
                <option>Web</option>
                <option>Phone</option>
                <option>Email</option>
                <option>Referral</option>
              </select>
            </Field>
            <div className="md:col-span-2">
              <Field label="CONSUMER NARRATIVE">
                <textarea
                  value={narrative}
                  onChange={e => setNarrative(e.target.value)}
                  rows={6}
                  className="rf-input resize-none"
                  placeholder="Paste or type the consumer complaint narrative..."
                />
              </Field>
            </div>
          </div>
          <div className="mt-5 flex items-center justify-between border-t border-[#1a1a1d] pt-5">
            <label className="flex items-center gap-2 cursor-pointer text-xs">
              <div onClick={() => setAuto(!auto)} className={`w-4 h-4 border ${auto ? "bg-[#f5a623] border-[#f5a623]" : "border-[#6b6b73]"} flex items-center justify-center`}>
                {auto && <Check className="w-3 h-3 text-black" strokeWidth={3} />}
              </div>
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#f5a623]" />
                AUTO-CLASSIFY WITH AI
              </span>
            </label>
            <button onClick={submit} disabled={submitting} className="rf-btn rf-btn-primary flex items-center gap-2">
              {submitting ? "SUBMITTING..." : "SUBMIT CASE"} <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </Card>
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="rf-section-title mb-1.5">{label}</div>
      {children}
    </div>
  );
}
