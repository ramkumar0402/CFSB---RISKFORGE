"""
RISKFORGE — RAG Search Module
TF-IDF + cosine similarity over the historical complaint corpus.
Indexes are rebuilt nightly. Returns the top-K similar cases with similarity scores.
"""
from __future__ import annotations
import logging
import pickle
import os
from datetime import datetime
from typing import List, Dict, Any, Optional
from motor.motor_asyncio import AsyncIOMotorDatabase

from models import RAGQuery, RAGHit, RAGResponse, Product

logger = logging.getLogger(__name__)

_INDEX_PATH = os.getenv("RAG_INDEX_PATH", "./data/rag_index.pkl")


# ── TF-IDF lightweight implementation ───────────────────────────────────────
class TfidfIndex:
    """Minimal TF-IDF index — no heavy sklearn dependency at runtime."""

    def __init__(self) -> None:
        self.documents: List[str] = []
        self.ids: List[str] = []
        self.meta: List[Dict[str, Any]] = []
        self.idf: Dict[str, float] = {}
        self._tokenized_docs: List[Dict[str, float]] = []

    @staticmethod
    def _tokenize(text: str) -> List[str]:
        import re
        text = text.lower()
        tokens = re.findall(r"[a-z]{3,}", text)
        stopwords = {"the", "and", "for", "are", "but", "not", "you", "all", "can", "had", "her", "was", "one", "our", "out", "day", "get", "has", "him", "his", "how", "its", "may", "new", "now", "old", "see", "two", "way", "who", "boy", "did", "own", "say", "she", "too", "use", "that", "with", "this", "from", "they", "been", "have", "were", "their", "what", "your", "them", "than", "then", "into", "only", "over", "such", "also", "back", "after", "work", "take", "make", "just", "know", "think", "year", "good", "some", "time", "very", "when", "come", "could", "made", "find", "here", "long", "made"}
        return [t for t in tokens if t not in stopwords]

    def fit(self, documents: List[str], ids: List[str], meta: List[Dict[str, Any]]) -> None:
        import math
        self.documents = documents
        self.ids = ids
        self.meta = meta

        # IDF
        df: Dict[str, int] = {}
        self._tokenized_docs = []
        for doc in documents:
            tokens = self._tokenize(doc)
            tf: Dict[str, float] = {}
            for t in tokens:
                tf[t] = tf.get(t, 0) + 1.0
            # normalise
            total = sum(tf.values()) or 1.0
            for t in tf:
                tf[t] /= total
            for t in set(tokens):
                df[t] = df.get(t, 0) + 1
            self._tokenized_docs.append(tf)

        n = len(documents)
        for term, freq in df.items():
            self.idf[term] = math.log((n + 1) / (freq + 1)) + 1

    def search(self, query: str, top_k: int = 8) -> List[RAGHit]:
        q_tokens = self._tokenize(query)
        q_tf: Dict[str, float] = {}
        for t in q_tokens:
            q_tf[t] = q_tf.get(t, 0) + 1.0
        total = sum(q_tf.values()) or 1.0
        for t in q_tf:
            q_tf[t] /= total

        scores: List[tuple[float, int]] = []
        for i, doc_tf in enumerate(self._tokenized_docs):
            common = set(q_tf) & set(doc_tf)
            score = sum(q_tf[t] * doc_tf[t] * self.idf.get(t, 0.0) for t in common)
            if score > 0:
                scores.append((score, i))
        scores.sort(reverse=True)

        hits: List[RAGHit] = []
        max_score = scores[0][0] if scores else 1.0
        for score, idx in scores[:top_k]:
            m = self.meta[idx]
            hits.append(
                RAGHit(
                    complaint_id=self.ids[idx],
                    product=Product(m.get("product", "Other")),
                    company=m.get("company"),
                    narrative=self.documents[idx][:400],
                    similarity=round(score / max(max_score, 1e-9), 3),
                )
            )
        return hits


# ── Module-level singleton ──────────────────────────────────────────────────
_INDEX: Optional[TfidfIndex] = None


async def build_index(db: AsyncIOMotorDatabase) -> TfidfIndex:
    """Rebuild the TF-IDF index from the complaints collection."""
    global _INDEX
    cursor = db.complaints.find(
        {"narrative": {"$exists": True, "$ne": ""}},
        {"_id": 1, "narrative": 1, "product": 1, "company": 1},
    ).sort("created_at", -1).limit(50000)

    docs: List[str] = []
    ids: List[str] = []
    meta: List[Dict[str, Any]] = []
    async for doc in cursor:
        docs.append(doc["narrative"])
        ids.append(str(doc["_id"]))
        meta.append({"product": doc.get("product", "Other"), "company": doc.get("company")})

    index = TfidfIndex()
    index.fit(docs, ids, meta)
    _INDEX = index
    logger.info("RAG index rebuilt — documents=%d", len(docs))
    return index


def get_index() -> TfidfIndex:
    if _INDEX is None:
        raise RuntimeError("RAG index not built — call /api/rag/rebuild first")
    return _INDEX


async def run_query(query: RAGQuery, db: AsyncIOMotorDatabase) -> RAGResponse:
    idx = _INDEX or await build_index(db)
    hits = idx.search(query.query, top_k=query.top_k)
    return RAGResponse(query=query.query, hits=hits, total_hits=len(hits))
