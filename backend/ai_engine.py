"""NationOS AI Engine powered by LlamaIndex, OpenRouter, and ChromaDB.

Provides strict financial auditing over public budget data with mathematical
determinism and semantic context augmentation.
"""

import os
import re
import pandas as pd
from typing import Dict, Any, Optional

from llama_index.core import Settings
from backend.vector_store import query_budget_semantic, query_policies_semantic

# Path to the ground truth CSV dataset
CSV_PATH = os.path.join(os.path.dirname(__file__), "lagos_budget_2026.csv")
if not os.path.exists(CSV_PATH):
    raise FileNotFoundError(f"Ground truth dataset not found at {CSV_PATH}")

df = pd.read_csv(CSV_PATH)

# Instruction string enforcing audit standards
INSTRUCTION_STR = (
    "You are a strict financial auditor for Lagos State and the Federal Republic of Nigeria. "
    "You must use the provided Pandas DataFrame to answer queries mathematically. "
    "Never guess or hallucinate numbers. Return monetary values formatted in Naira (₦)."
)

# OpenRouter / OpenAI configuration
OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY", "").strip()
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "").strip()

llm = None
query_engine = None

if OPENROUTER_API_KEY:
    try:
        from llama_index.llms.openrouter import OpenRouter
        llm = OpenRouter(
            api_key=OPENROUTER_API_KEY,
            model=os.environ.get("OPENROUTER_MODEL", "meta-llama/llama-3.1-8b-instruct"),
            temperature=0.1
        )
        print("[AIEngine] OpenRouter LLM initialized successfully.")
    except Exception as exc:
        print(f"[AIEngine] OpenRouter initialization note: {exc}")
elif OPENAI_API_KEY:
    try:
        from llama_index.llms.openai import OpenAI
        llm = OpenAI(
            api_key=OPENAI_API_KEY,
            model=os.environ.get("OPENAI_MODEL", "gpt-4o-mini"),
            temperature=0.1
        )
        print("[AIEngine] OpenAI LLM initialized successfully.")
    except Exception as exc:
        print(f"[AIEngine] OpenAI initialization note: {exc}")

if llm:
    try:
        from llama_index.experimental.query_engine import PandasQueryEngine
        query_engine = PandasQueryEngine(
            df=df,
            llm=llm,
            instruction_str=INSTRUCTION_STR,
            verbose=True
        )
        print("[AIEngine] LlamaIndex PandasQueryEngine mounted successfully.")
    except Exception as exc:
        print(f"[AIEngine] PandasQueryEngine initialization note: {exc}")
        query_engine = None


def format_naira(val: float) -> str:
    """Format numeric amount into human-readable Naira."""
    if abs(val) >= 1_000_000_000_000:
        return f"₦{val / 1_000_000_000_000:.2f}tn"
    elif abs(val) >= 1_000_000_000:
        return f"₦{val / 1_000_000_000:.2f}bn"
    elif abs(val) >= 1_000_000:
        return f"₦{val / 1_000_000:.2f}m"
    return f"₦{val:,.2f}"


def execute_deterministic_audit(query_str: str) -> str:
    """Deterministic fallback auditor that computes exact sums using Pandas and ChromaDB."""
    q_lower = query_str.lower()
    
    # 1. Detect LGA filter
    matching_lga = None
    for lga in df["lga"].dropna().unique():
        if lga.lower() in q_lower:
            matching_lga = lga
            break

    # 2. Detect Sector filter
    matching_sector = None
    for sec in df["sector"].dropna().unique():
        if sec.lower() in q_lower:
            matching_sector = sec
            break

    # 3. Detect MDA filter
    matching_mda = None
    for m in df["mda"].dropna().unique():
        if m.lower() in q_lower or any(word in q_lower for word in m.lower().split() if len(word) > 4):
            matching_mda = m
            break

    sub = df.copy()
    filters_applied = []
    if matching_lga:
        sub = sub[sub["lga"] == matching_lga]
        filters_applied.append(f"in {matching_lga} LGA")
    if matching_sector:
        sub = sub[sub["sector"] == matching_sector]
        filters_applied.append(f"under the {matching_sector} sector")
    if matching_mda:
        sub = sub[sub["mda"] == matching_mda]
        filters_applied.append(f"for {matching_mda}")

    if len(sub) > 0 and filters_applied:
        total_approved = sub["approved_budget_naira"].sum()
        total_disbursed = sub["actual_disbursed_naira"].sum()
        count = len(sub)
        capital_count = len(sub[sub["expenditure_type"] == "Capital"])
        recurrent_count = count - capital_count

        filter_desc = " ".join(filters_applied)
        ans = (
            f"Based on the official 2026 fiscal records {filter_desc}, a total of "
            f"{format_naira(total_approved)} ({total_approved:,.2f} Naira) was approved across {count} line items "
            f"({capital_count} Capital, {recurrent_count} Recurrent). "
            f"Actual disbursements to date stand at {format_naira(total_disbursed)} ({total_disbursed:,.2f} Naira), "
            f"representing an execution rate of {(total_disbursed / total_approved * 100):.1f}%."
        )
        return ans

    # 4. Use ChromaDB semantic search if no simple SQL/Pandas filter matches
    semantic_matches = query_budget_semantic(query_str, n_results=3)
    if semantic_matches:
        snippets = [m["text"] for m in semantic_matches]
        return "Audit records matching your query:\n" + "\n".join(f"- {s}" for s in snippets)

    total_state_budget = df["approved_budget_naira"].sum()
    total_state_disbursed = df["actual_disbursed_naira"].sum()
    return (
        f"Consolidated Lagos State 2026 ground truth dataset comprises {len(df)} line items. "
        f"Total approved budget: {format_naira(total_state_budget)} ({total_state_budget:,.2f} Naira); "
        f"Actual disbursed: {format_naira(total_state_disbursed)} ({total_state_disbursed:,.2f} Naira)."
    )


def execute_citizen_query(query_str: str) -> str:
    """Entry point for the Citizen Transparency Portal."""
    if query_engine:
        try:
            res = query_engine.query(query_str)
            ans = str(res).strip()
            if ans and not ans.lower().startswith("there was an error"):
                return ans
        except Exception as exc:
            print(f"[AIEngine] LlamaIndex query failed: {exc}. Using deterministic fallback.")

    return execute_deterministic_audit(query_str)


def execute_overhead_allocation_cut(revenue_drop_percentage: int) -> str:
    """Execute proportional reduction of Recurrent - Overhead across MDAs."""
    total_approved = float(df["approved_budget_naira"].sum())
    shortfall = total_approved * (revenue_drop_percentage / 100.0)

    overhead_mask = df["expenditure_type"] == "Recurrent - Overhead"
    overhead_df = df[overhead_mask]
    total_overhead = float(overhead_df["approved_budget_naira"].sum())

    if total_overhead == 0:
        return "Error: No Recurrent - Overhead budget found in dataset."

    cut_percentage = min(100.0, (shortfall / total_overhead) * 100.0)
    
    # Calculate exact cuts per MDA
    mda_overheads = overhead_df.groupby("mda")["approved_budget_naira"].sum()
    mda_breakdown = []
    total_cut_actual = 0.0

    for mda_name, mda_amt in mda_overheads.items():
        mda_cut = mda_amt * (cut_percentage / 100.0)
        total_cut_actual += mda_cut
        mda_breakdown.append(
            f"  - {mda_name}: Overhead reduced by {format_naira(mda_cut)} "
            f"(from {format_naira(mda_amt)} to {format_naira(mda_amt - mda_cut)})"
        )

    breakdown_text = "\n".join(mda_breakdown)
    result = (
        f"SIMULATION REPORT: {revenue_drop_percentage}% Revenue Contraction Analysis\n\n"
        f"1. Baseline Financial Position:\n"
        f"   - Total Approved Budget: {format_naira(total_approved)} ({total_approved:,.2f} Naira)\n"
        f"   - Revenue Shortfall ({revenue_drop_percentage}%): {format_naira(shortfall)} ({shortfall:,.2f} Naira)\n"
        f"   - Total Recurrent Overhead Pool: {format_naira(total_overhead)} across {len(mda_overheads)} MDAs\n"
        f"   - Capital Expenditure Pool: {format_naira(df[df['expenditure_type'] == 'Capital']['approved_budget_naira'].sum())} (Protected, 0% cut)\n\n"
        f"2. Mandatory Expenditure Adjustments:\n"
        f"   - Required Overhead Cut Across MDAs: {cut_percentage:.2f}%\n"
        f"   - Total Overhead Savings Realized: {format_naira(total_cut_actual)} ({total_cut_actual:,.2f} Naira)\n\n"
        f"3. Ministry Breakdown:\n{breakdown_text}\n\n"
        f"Audit Confirmation: Capital investments remain 100% safeguarded under statutory guidelines."
    )
    return result
