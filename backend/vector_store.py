"""Vector Database Integration using ChromaDB.

Embeds and indexes budget line items, statutory fiscal policies,
and national development plans for semantic retrieval.
"""

import os
import pandas as pd
import chromadb
from typing import List, Dict, Any, Optional

CHROMA_DIR = os.path.join(os.path.dirname(__file__), "chroma_db")
os.makedirs(CHROMA_DIR, exist_ok=True)

_chroma_client = chromadb.PersistentClient(path=CHROMA_DIR)
_budget_collection = _chroma_client.get_or_create_collection(
    name="lagos_budget_items",
    metadata={"description": "Lagos State 2026 Budget Line Items"}
)
_policy_collection = _chroma_client.get_or_create_collection(
    name="fiscal_policies",
    metadata={"description": "Statutory FAAC rules and fiscal policies"}
)


def seed_policy_documents():
    """Ensure baseline statutory policies and formulas are indexed in ChromaDB."""
    if _policy_collection.count() > 0:
        return

    policies = [
        {
            "id": "pol_faac_statutory",
            "text": "Federation Account Allocation Committee (FAAC) statutory formula: Federal Government 52.68%, State Governments 26.72%, Local Government Councils 20.60%. Statutory distribution weights: Equality 40%, Population 30%, Landmass 10%, Internal Revenue Effort 10%, Social Development 10%. Legal basis: Allocation of Revenue Act Cap F26 LFN 2004.",
            "metadata": {"type": "statutory", "jurisdiction": "federal", "category": "revenue_sharing"}
        },
        {
            "id": "pol_lagos_budget_2026",
            "text": "Lagos State 2026 Budget of Shared Prosperity: Total proposed budget ₦3.01tn. Priorities emphasize transport infrastructure (BRT and Rail corridors), healthcare resilience, public education renewal, and flood desilting. Recurrent overheads must be compressed to maintain capital execution above 38%.",
            "metadata": {"type": "state_policy", "jurisdiction": "lagos", "category": "budget_strategy"}
        },
        {
            "id": "pol_fiscal_responsibility",
            "text": "Fiscal Responsibility Act guidelines: Consolidated public debt must not exceed 40% of GDP. Fiscal deficit must remain within 3% of national GDP unless extraordinary emergency circumstances apply. Recurrent expenditure must be funded strictly from non-debt revenues.",
            "metadata": {"type": "statutory", "jurisdiction": "federal", "category": "debt_sustainability"}
        },
        {
            "id": "pol_capital_protection",
            "text": "Executive Expenditure Directive: In the event of statutory revenue contraction, capital investments in ongoing critical corridors must remain untouched. Shortfalls must be resolved through proportional reduction in Recurrent Overhead across all Ministries, Departments, and Agencies (MDAs).",
            "metadata": {"type": "executive_rule", "jurisdiction": "national", "category": "expenditure_cut"}
        }
    ]

    _policy_collection.add(
        ids=[p["id"] for p in policies],
        documents=[p["text"] for p in policies],
        metadatas=[p["metadata"] for p in policies]
    )
    print(f"[VectorStore] Indexed {len(policies)} statutory policy documents.")


def seed_budget_csv(csv_path: Optional[str] = None):
    """Index line items from lagos_budget_2026.csv into ChromaDB."""
    if _budget_collection.count() > 0:
        return

    if not csv_path:
        csv_path = os.path.join(os.path.dirname(__file__), "lagos_budget_2026.csv")

    if not os.path.exists(csv_path):
        print(f"[VectorStore] CSV file not found at {csv_path}. Skipping budget item seeding.")
        return

    df = pd.read_csv(csv_path)
    ids = []
    documents = []
    metadatas = []

    for idx, row in df.iterrows():
        item_id = f"item_{idx}"
        desc = str(row["project_description"])
        mda = str(row["mda"])
        sector = str(row["sector"])
        exp_type = str(row["expenditure_type"])
        lga = str(row["lga"])
        approved = float(row["approved_budget_naira"])
        disbursed = float(row["actual_disbursed_naira"])

        doc_text = (
            f"Project: {desc}. Ministry: {mda}. Sector: {sector}. "
            f"Expenditure Type: {exp_type}. Local Government: {lga}. "
            f"Approved Budget: ₦{approved:,.2f}. Disbursed Amount: ₦{disbursed:,.2f}."
        )

        ids.append(item_id)
        documents.append(doc_text)
        metadatas.append({
            "mda": mda,
            "sector": sector,
            "expenditure_type": exp_type,
            "lga": lga,
            "approved": approved,
            "disbursed": disbursed
        })

    # Add in batches of 100
    batch_size = 100
    for i in range(0, len(ids), batch_size):
        _budget_collection.add(
            ids=ids[i:i + batch_size],
            documents=documents[i:i + batch_size],
            metadatas=metadatas[i:i + batch_size]
        )

    print(f"[VectorStore] Indexed {len(ids)} budget line items from CSV into ChromaDB.")


def query_budget_semantic(query_text: str, n_results: int = 5, where: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
    """Retrieve semantically relevant budget line items from ChromaDB."""
    kwargs = {"query_texts": [query_text], "n_results": min(n_results, max(1, _budget_collection.count()))}
    if where:
        kwargs["where"] = where

    results = _budget_collection.query(**kwargs)
    items = []
    if results and results["documents"]:
        docs = results["documents"][0]
        metas = results["metadatas"][0] if results.get("metadatas") else [{}] * len(docs)
        for doc, meta in zip(docs, metas):
            items.append({"text": doc, "metadata": meta})
    return items


def query_policies_semantic(query_text: str, n_results: int = 3) -> List[str]:
    """Retrieve semantically relevant statutory rules and policy documents."""
    cnt = _policy_collection.count()
    if cnt == 0:
        return []
    results = _policy_collection.query(
        query_texts=[query_text],
        n_results=min(n_results, cnt)
    )
    if results and results["documents"]:
        return results["documents"][0]
    return []


# Initialize baseline vectors on load
try:
    seed_policy_documents()
    seed_budget_csv()
except Exception as exc:
    print(f"[VectorStore] Initialization note: {exc}")
