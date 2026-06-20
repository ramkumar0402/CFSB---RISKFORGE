// Synthetic data & types for RISKFORGE

export type RiskTier = "Critical" | "High" | "Medium" | "Low" | "Unclassified";
export type WorkflowStage = "Received" | "AI Classified" | "Escalated" | "Assigned" | "Closed";
export type Product =
  | "Banking"
  | "Credit Card"
  | "Mortgage"
  | "Debt Collection"
  | "Student Loan"
  | "Personal Loan"
  | "Money Transfer"
  | "Other";

export interface Case {
  id: string;
  product: Product;
  subProduct?: string;
  issue: string;
  company: string;
  state: string;
  channel: "Web" | "Phone" | "Email" | "Referral";
  risk: RiskTier;
  stage: WorkflowStage;
  narrative: string;
  created: string;
  assignedTo?: string;
  confidence?: number;
  sentiment?: "Highly Negative" | "Negative" | "Neutral" | "Positive";
  fraudSignals?: string[];
  slaDeadline?: string;
}

const PRODUCTS: Product[] = [
  "Banking", "Credit Card", "Mortgage", "Debt Collection",
  "Student Loan", "Personal Loan", "Money Transfer", "Other",
];

const STATES = ["CA", "TX", "FL", "NY", "PA", "IL", "OH", "GA", "NC", "MI", "NJ", "VA", "WA", "AZ", "MA", "TN", "IN", "MO", "MD", "WI"];

const ISSUES = [
  "Incorrect information on credit report",
  "Unauthorized transactions",
  "Account closure dispute",
  "Identity theft allegation",
  "Billing dispute — overcharge",
  "Loan modification denial",
  "Debt collection harassment",
  "Fee dispute",
  "Late payment reporting",
  "Loan servicing communication failure",
  "Fraudulent account opening",
  "Discriminatory lending practice",
  "Wrongful repossession",
  "Servicing transfer error",
  "Customer service complaint",
  "Incorrect payoff amount",
];

const COMPANIES = [
  "EQUIFAX, INC.", "EXPERIAN INFORMATION SOLUTIONS INC.", "TRANSUNION INTERMEDIATE HOLDINGS, INC.",
  "JPMORGAN CHASE & CO.", "BANK OF AMERICA, N.A.", "WELLS FARGO & COMPANY", "CITIBANK, N.A.",
  "CAPITAL ONE FINANCIAL CORPORATION", "DISCOVER BANK", "U.S. BANCORP", "PNC BANK N.A.",
  "ALLY FINANCIAL INC.", "NAVY FEDERAL CREDIT UNION", "TD BANK, N.A.", "HSBC NORTH AMERICA",
];

const NARRATIVES = [
  "I have been the victim of identity theft. Someone opened a credit card in my name and has charged over $12,000. I have filed a police report and contacted the fraud department but the account remains open and continues to accrue charges. This is causing severe financial hardship and I am considering legal action against the bank for failing to protect my identity.",
  "My mortgage servicer has been unresponsive for over 60 days regarding my loan modification application. I have submitted all requested documentation three times. They continue to report late payments to credit bureaus which is damaging my credit score. I will be filing a complaint with the state attorney general if this is not resolved.",
  "I am disputing a $347 late fee that was charged to my account even though my payment was made on time according to my bank records. The customer service representative was rude and refused to review the transaction. I want a full refund and written confirmation that this will not affect my credit history.",
  "Debt collector has been calling my workplace despite being told multiple times that calls are not permitted at my job. They have called 14 times in the past week. I have requested written validation of the debt which has not been provided. This is harassment and a violation of the FDCPA.",
  "I was denied a mortgage loan and I believe it was based on discriminatory reasons related to my ethnicity. The loan officer made several inappropriate comments during the application process. I have documentation and am prepared to file a fair lending complaint with HUD.",
  "Account was closed without notice and I have funds still pending. I need access to my money but they will not explain why the account was closed. This appears to be wrongful closure and I have suffered bounced payments and fees as a result.",
  "I requested a payoff amount for my auto loan and the figure provided was incorrect by over $2,000. I made a payment based on their quote and now they say I still owe more money. This is unacceptable and the company needs to honor the payoff amount they provided.",
  "My credit report contains inaccurate information that I have disputed multiple times. The furnisher has verified the information as accurate despite my providing evidence to the contrary. This is a violation of the FCRA and I intend to pursue all available remedies.",
];

function rand<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function randint(a: number, b: number) { return Math.floor(Math.random() * (b - a + 1)) + a; }

function pickRisk(_product: Product, narrative: string): RiskTier {
  const text = narrative.toLowerCase();
  if (text.includes("identity theft") || text.includes("fraud") || text.includes("discriminat") || text.includes("legal action") || text.includes("harassment") || text.includes("wrongful") || text.includes("attorney general")) {
    return Math.random() > 0.4 ? "Critical" : "High";
  }
  if (text.includes("dispute") || text.includes("unresponsive") || text.includes("incorrect") || text.includes("denied") || text.includes("closed without notice")) {
    return Math.random() > 0.5 ? "High" : "Medium";
  }
  return Math.random() > 0.6 ? "Medium" : "Low";
}

function isoDaysAgo(d: number) {
  const dt = new Date("2026-06-19T17:46:00Z");
  dt.setDate(dt.getDate() - d);
  return dt.toISOString().slice(0, 19).replace("T", " ");
}

let counter = 304070;
function nextId() { return `RF-${counter++}`; }

export const CASES: Case[] = Array.from({ length: 4071 }, (_, i) => {
  const product = rand(PRODUCTS);
  const narrative = rand(NARRATIVES);
  const risk = pickRisk(product, narrative);
  void product;
  const stage: WorkflowStage =
    i < 4 ? "Closed" :
    i < 4067 ? "Received" :
    "AI Classified";
  return {
    id: nextId(),
    product,
    subProduct: rand(["Checking", "Savings", "Personal", "HELOC", "Auto"]),
    issue: rand(ISSUES),
    company: rand(COMPANIES),
    state: rand(STATES),
    channel: rand(["Web", "Phone", "Email", "Referral"] as const),
    risk: i < 14 ? (i < 4 ? "Critical" : "High") : (i < 4067 ? "Unclassified" : risk),
    stage,
    narrative,
    created: isoDaysAgo(randint(0, 13)),
    assignedTo: stage === "Closed" ? rand(["ANALYST-04", "ANALYST-11", "ANALYST-02"]) : undefined,
    confidence: randint(40, 99),
    sentiment: rand(["Highly Negative", "Negative", "Neutral"] as const),
    fraudSignals: risk === "Critical" ? rand([
      ["Identity Theft"],
      ["Regulatory Violation", "Identity Theft"],
      ["Unauthorized Transactions"],
      ["Account Takeover", "Unauthorized Transactions"],
    ]) : undefined,
    slaDeadline: risk === "Critical" ? isoDaysAgo(-1) : risk === "High" ? isoDaysAgo(-2) : undefined,
  };
});

export const DAILY_VOLUME = (() => {
  // 14 days of volume data
  const arr: { date: string; volume: number }[] = [];
  const start = new Date("2026-06-06T00:00:00Z");
  const spike = 4052;
  for (let i = 0; i < 14; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    arr.push({
      date: d.toISOString().slice(5, 10),
      volume: i === 12 ? spike : randint(2, 30),
    });
  }
  return arr;
})();

export const RISK_DIST = [
  { tier: "Critical", count: 4, color: "#ef4444" },
  { tier: "High", count: 10, color: "#f5a623" },
  { tier: "Medium", count: 0, color: "#3b82f6" },
  { tier: "Unclassified", count: 4057, color: "#3a3a3e" },
];

export const VOLUME_BY_PRODUCT = [
  { product: "Mortgage", count: 1 },
  { product: "Money Transfer", count: 1 },
  { product: "Debt Collection", count: 2 },
  { product: "Credit card", count: 3 },
  { product: "Personal Loan", count: 4 },
  { product: "Banking", count: 4052 },
  { product: "Credit Card", count: 8 },
];

export const TOP_STATES = [
  { code: "NY", count: 10 },
  { code: "FL", count: 10 },
  { code: "TX", count: 9 },
  { code: "CA", count: 8 },
  { code: "PA", count: 7 },
];

export const WORKFLOW_STAGE = [
  { stage: "Received", count: 4052, color: "#f5a623" },
  { stage: "Closed", count: 4, color: "#3a3a3e" },
  { stage: "AI Classified", count: 15, color: "#f5a623" },
];

export const DEPARTMENT_ROUTING = [
  { dept: "Mortgage Servicing", count: 0, color: "#1a1a1d" },
  { dept: "Operations", count: 0, color: "#1a1a1d" },
  { dept: "Compliance", count: 0, color: "#1a1a1d" },
  { dept: "Unassigned", count: 4067, color: "#3b82f6" },
  { dept: "Fraud Investigation Unit", count: 0, color: "#1a1a1d" },
  { dept: "Legal", count: 0, color: "#1a1a1d" },
];

export const ASSIGNED = [
  { name: "Unassigned", count: 4067, color: "#22c55e" },
];

export const SENTIMENT = [
  { sentiment: "Highly Negative", count: 9, color: "#ef4444" },
  { sentiment: "Negative", count: 5, color: "#f5a623" },
  { sentiment: "Neutral", count: 1, color: "#6b6b73" },
];

export const FRAUD_SIGNALS = [
  { signal: "Identity Theft", count: 6, color: "#ef4444" },
  { signal: "Regulatory Violation", count: 6, color: "#ef4444" },
  { signal: "Unauthorized Transactions", count: 9, color: "#ef4444" },
  { signal: "Account Takeover", count: 2, color: "#ef4444" },
];

export const CONFIDENCE_BUCKETS = [
  { bucket: "0-19", count: 0 },
  { bucket: "20-39", count: 0 },
  { bucket: "40-59", count: 0 },
  { bucket: "60-79", count: 3 },
  { bucket: "80-100", count: 14 },
];

export const VOLUME_FORECAST = (() => {
  const arr: { date: string; history?: number; forecast?: number }[] = [];
  const start = new Date("2026-05-25T00:00:00Z");
  for (let i = 0; i < 28; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    arr.push({
      date: d.toISOString().slice(5, 10),
      history: i <= 24 ? (i === 24 ? 4052 : randint(2, 30)) : undefined,
      forecast: i >= 25 ? randint(20, 60) : undefined,
    });
  }
  return arr;
})();

export const AUDIT_EVENTS = (() => {
  const actions = [
    "AI_CLASSIFIED", "ROUTED", "ASSIGNED", "ESCALATED", "CLOSED", "AUTO_ACKNOWLEDGED",
    "RISK_OVERRIDDEN", "SLA_BREACH", "DUPLICATE_FLAGGED", "AUDIT_EXPORTED",
  ];
  const users = ["ANALYST-04", "ANALYST-11", "ANALYST-02", "SYSTEM", "ADMIN", "AI-AGENT-01"];
  const arr = [];
  for (let i = 0; i < 80; i++) {
    const d = new Date("2026-06-19T17:46:00Z");
    d.setHours(d.getHours() - randint(0, 240));
    arr.push({
      id: `AUD-${900000 + i}`,
      timestamp: d.toISOString().slice(0, 19).replace("T", " "),
      user: rand(users),
      action: rand(actions),
      target: `RF-${304000 + randint(0, 70)}`,
      details: rand([
        "Critical risk auto-escalated to FIU",
        "AI classification: Medium confidence 0.81",
        "Auto-acknowledgement sent to consumer",
        "SLA timer set to 4h",
        "Duplicate detected — case merged with RF-304012",
        "Manual override applied by senior analyst",
        "Flow version v1.2 executed",
        "Case closed — auto-response template applied",
      ]),
      hash: Array.from({ length: 16 }, () => "0123456789abcdef"[randint(0, 15)]).join(""),
    });
  }
  return arr.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
})();

export const GOVERNANCE_POLICIES = [
  { id: "GOV-01", name: "FCRA — Fair Credit Reporting Act", status: "Compliant", lastReview: "2026-05-12", owner: "Compliance" },
  { id: "GOV-02", name: "FDCPA — Fair Debt Collection Practices", status: "Compliant", lastReview: "2026-05-12", owner: "Compliance" },
  { id: "GOV-03", name: "ECOA — Equal Credit Opportunity Act", status: "Review", lastReview: "2026-04-28", owner: "Compliance" },
  { id: "GOV-04", name: "GLBA — Gramm-Leach-Bliley Act", status: "Compliant", lastReview: "2026-05-30", owner: "Legal" },
  { id: "GOV-05", name: "Reg B — Unfair, Deceptive Acts", status: "Compliant", lastReview: "2026-05-12", owner: "Legal" },
  { id: "GOV-06", name: "Internal — AI Model Governance", status: "Review", lastReview: "2026-04-10", owner: "Risk Ops" },
  { id: "GOV-07", name: "Internal — Data Retention Policy", status: "Compliant", lastReview: "2026-05-22", owner: "IT" },
];

export const USERS = [
  { id: "U-01", name: "admin@riskforge.io", role: "ADMIN", lastActive: "2026-06-19 17:46", status: "Active" },
  { id: "U-02", name: "analyst@riskforge.io", role: "ANALYST", lastActive: "2026-06-19 17:41", status: "Active" },
  { id: "U-03", name: "manager@riskforge.io", role: "MANAGER", lastActive: "2026-06-19 16:20", status: "Active" },
  { id: "U-04", name: "compliance@riskforge.io", role: "COMPLIANCE", lastActive: "2026-06-19 14:08", status: "Active" },
  { id: "U-05", name: "ai-agent-01", role: "AI-AGENT", lastActive: "2026-06-19 17:46", status: "Active" },
];

export const PROMPTS = [
  { id: "PR-01", name: "Risk Tier Classifier v1.0", version: "1.0.0", author: "admin@riskforge.io", updated: "2026-05-12", tokens: 412, calls: 1284 },
  { id: "PR-02", name: "Product Category Mapper v1.2", version: "1.2.0", author: "admin@riskforge.io", updated: "2026-05-22", tokens: 286, calls: 1284 },
  { id: "PR-03", name: "Fraud Signal Extractor v0.9", version: "0.9.4", author: "manager@riskforge.io", updated: "2026-06-02", tokens: 348, calls: 1284 },
  { id: "PR-04", name: "Sentiment Tagger v1.0", version: "1.0.0", author: "analyst@riskforge.io", updated: "2026-05-30", tokens: 198, calls: 1284 },
  { id: "PR-05", name: "SLA Narrator v1.0", version: "1.0.0", author: "admin@riskforge.io", updated: "2026-06-08", tokens: 222, calls: 612 },
];

export const COMPLIANCE_METRICS = {
  totalProcessed: 4071,
  highRisk: 14,
  escalated: 0,
  closed: 4,
  escalationRate: "0%",
  slaCompliance: "98.6%",
  avgProcessingHours: 2.3,
  aiAccuracy: 0.917,
  ruleOnlyRecall: 0.567,
};

export const HEATMAP_DATA = (() => {
  const products = ["Banking", "Credit Card", "Mortgage", "Debt Collection", "Student Loan", "Personal Loan"];
  const tiers: RiskTier[] = ["Critical", "High", "Medium", "Low"];
  const data: { product: string; tier: RiskTier; count: number }[] = [];
  for (const p of products) {
    for (const t of tiers) {
      data.push({ product: p, tier: t, count: randint(0, 6) });
    }
  }
  return data;
})();
