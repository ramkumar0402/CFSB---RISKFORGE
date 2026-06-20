"""
RISKFORGE — AI Classification Engine
Structured prompt system to classify CFPB complaint narratives into:
  - Risk tier (Critical / High / Medium / Low)
  - Product category
  - Fraud signals
  - Department routing

Uses Anthropic Claude by default with a GPT-4 fallback.
Exponential backoff via tenacity. Schema validation enforced.
"""
from __future__ import annotations
import json
import logging
import os
import re
from typing import Optional, Dict, Any
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

from models import RiskTier, Product, RiskAssessment

logger = logging.getLogger(__name__)

# ── Tier definitions (shared with prompt) ──────────────────────────────────
RISK_DEFS: Dict[RiskTier, str] = {
    RiskTier.CRITICAL: (
        "Allegations of fraud, identity theft, wrongful account closure, "
        "discriminatory lending, legal threats, or regulatory violations."
    ),
    RiskTier.HIGH: (
        "Billing disputes, communication failures, incorrect credit reporting, "
        "unresolved complaints, fee disputes."
    ),
    RiskTier.MEDIUM: (
        "General service dissatisfaction, partial resolution, procedural errors."
    ),
    RiskTier.LOW: (
        "General inquiries, resolved issues, informational complaints, minor service dissatisfaction."
    ),
}

PRODUCT_VOCAB = [p.value for p in Product]

SYSTEM_PROMPT = """You are a financial risk compliance analyst specialising in consumer
protection regulation. Your role is to assess CFPB consumer complaint narratives and
classify them by risk severity and product category. You follow strict financial industry
classification standards. You return ONLY valid JSON. You never add commentary outside
the JSON structure."""

USER_PROMPT_TEMPLATE = """Classify the following CFPB consumer complaint. Return a JSON object
matching this exact schema:
{{
  "complaint_id": "string",
  "risk_tier": "Critical | High | Medium | Low",
  "risk_rationale": "One sentence explaining the classification",
  "product_category": "{product_vocab}",
  "confidence_score": 0.0-1.0,
  "escalation_flag": true | false,
  "sentiment": "Highly Negative | Negative | Neutral | Positive",
  "fraud_signals": ["Identity Theft", "Regulatory Violation", "Unauthorized Transactions", "Account Takeover", ...],
  "department": "Fraud Investigation Unit | Mortgage Servicing | Operations | Compliance | Legal | Unassigned"
}}

Complaint ID: {complaint_id}.
Product (as filed): {product}.
Complaint Narrative: {narrative}.

Apply the following risk tier definitions:
- CRITICAL: {critical_def}
- HIGH: {high_def}
- MEDIUM: {medium_def}
- LOW: {low_def}

If the narrative is too short or ambiguous to classify confidently, set confidence_score
below 0.6 and explain in risk_rationale. Escalation_flag MUST be true for Critical risk."""


# ── Provider clients ────────────────────────────────────────────────────────
def _anthropic_client():
    import anthropic
    return anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))


def _openai_client():
    import openai
    return openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


# ── Core classifier ──────────────────────────────────────────────────────────
@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    retry=retry_if_exception_type((Exception,)),
)
async def classify_complaint(
    complaint_id: str,
    product: str,
    narrative: str,
    provider: str = "anthropic",
    model: str = "claude-sonnet-4.5-20250929",
) -> RiskAssessment:
    """Run a single complaint through the LLM classifier and validate the JSON output."""
    user_prompt = USER_PROMPT_TEMPLATE.format(
        complaint_id=complaint_id,
        product=product,
        narrative=narrative[:4000],
        product_vocab=" | ".join(PRODUCT_VOCAB),
        critical_def=RISK_DEFS[RiskTier.CRITICAL],
        high_def=RISK_DEFS[RiskTier.HIGH],
        medium_def=RISK_DEFS[RiskTier.MEDIUM],
        low_def=RISK_DEFS[RiskTier.LOW],
    )

    logger.info("Classifying complaint=%s product=%s", complaint_id, product)

    if provider == "anthropic":
        client = _anthropic_client()
        resp = client.messages.create(
            model=model,
            max_tokens=1024,
            temperature=0.2,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_prompt}],
        )
        raw = "".join(block.text for block in resp.content)
    else:
        client = _openai_client()
        resp = client.chat.completions.create(
            model=model or "gpt-4o",
            temperature=0.2,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
        )
        raw = resp.choices[0].message.content or "{}"

    data = _extract_and_validate(raw, complaint_id, product, narrative)
    return RiskAssessment(
        complaint_id=complaint_id,
        risk_tier=RiskTier(data["risk_tier"]),
        risk_rationale=data["risk_rationale"],
        product_category=Product(data["product_category"]) if data["product_category"] in PRODUCT_VOCAB else Product.OTHER,
        confidence_score=float(data["confidence_score"]),
        escalation_flag=bool(data["escalation_flag"]),
        sentiment=data.get("sentiment"),
        fraud_signals=data.get("fraud_signals"),
        department=data.get("department"),
        model_version=model,
    )


def _extract_and_validate(raw: str, complaint_id: str, product: str, narrative: str) -> Dict[str, Any]:
    """Robust JSON extraction + schema validation. Falls back to rule-based if LLM fails."""
    match = re.search(r"\{[\s\S]*\}", raw)
    if not match:
        logger.warning("LLM returned non-JSON for %s — falling back to rule-based", complaint_id)
        return _rule_based_classify(complaint_id, product, narrative)
    try:
        data = json.loads(match.group(0))
    except json.JSONDecodeError:
        return _rule_based_classify(complaint_id, product, narrative)

    # Enforce required fields + value spaces
    required = ["risk_tier", "risk_rationale", "product_category", "confidence_score", "escalation_flag"]
    for field in required:
        if field not in data:
            return _rule_based_classify(complaint_id, product, narrative)

    if data["risk_tier"] not in [t.value for t in RiskTier]:
        data["risk_tier"] = "Medium"
    if not 0.0 <= float(data["confidence_score"]) <= 1.0:
        data["confidence_score"] = 0.5

    return data


def _rule_based_classify(complaint_id: str, product: str, narrative: str) -> Dict[str, Any]:
    """Keyword-based fallback. Provides a baseline for recall comparison."""
    text = narrative.lower()
    critical_keywords = ["identity theft", "fraud", "discriminat", "legal action", "harassment", "wrongful", "attorney general"]
    high_keywords = ["dispute", "unresponsive", "incorrect", "denied", "closed without notice"]

    if any(k in text for k in critical_keywords):
        tier, conf, esc = "Critical", 0.75, True
    elif any(k in text for k in high_keywords):
        tier, conf, esc = "High", 0.65, False
    else:
        tier, conf, esc = "Low", 0.55, False

    return {
        "complaint_id": complaint_id,
        "risk_tier": tier,
        "risk_rationale": "Rule-based fallback — keyword heuristic applied.",
        "product_category": product if product in PRODUCT_VOCAB else "Other",
        "confidence_score": conf,
        "escalation_flag": esc,
        "sentiment": "Negative",
        "fraud_signals": [],
        "department": "Unassigned",
    }


async def classify_batch(complaints: list[Dict[str, Any]], batch_size: int = 50) -> list[RiskAssessment]:
    """Process complaints in batches to stay within rate limits."""
    results: list[RiskAssessment] = []
    for i in range(0, len(complaints), batch_size):
        chunk = complaints[i : i + batch_size]
        logger.info("Processing batch %d/%d", i // batch_size + 1, (len(complaints) + batch_size - 1) // batch_size)
        for c in chunk:
            try:
                results.append(
                    await classify_complaint(
                        complaint_id=c["complaint_id"],
                        product=c.get("product", "Other"),
                        narrative=c["narrative"],
                    )
                )
            except Exception as exc:
                logger.exception("Batch item failed: %s", exc)
        # Simple rate-limiter guard
        import asyncio
        await asyncio.sleep(1.0)
    return results
