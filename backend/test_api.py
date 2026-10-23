"""Automated test suite verifying all FastAPI, ChromaDB, and Database endpoints.
"""

from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_all():
    print("1. Testing /health...")
    res = client.get("/health")
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["status"] == "ok"
    assert "ChromaDB" in data["vector_database"]
    print("   Passed:", data)

    print("\n2. Testing /api/v1/fiscal/overview...")
    res = client.get("/api/v1/fiscal/overview")
    assert res.status_code == 200, res.text
    ov = res.json()
    assert ov["metrics"]["approvedBudget"] == "₦54.99tn"
    assert len(ov["indicators"]) == 4
    assert len(ov["projects"]) >= 3
    print("   Passed: Headline KPIs and project snapshot verified.")

    print("\n3. Testing /api/v1/fiscal/revenue...")
    res = client.get("/api/v1/fiscal/revenue")
    assert res.status_code == 200, res.text
    rev = res.json()
    assert rev["distributablePool"] > 0
    assert "federal" in rev["tiers"]
    print("   Passed: FAAC statutory revenue tiers verified.")

    print("\n4. Testing /api/v1/jurisdictions...")
    res = client.get("/api/v1/jurisdictions")
    assert res.status_code == 200, res.text
    assert res.json()["count"] == 37
    print("   Passed: 37 jurisdictions listed.")

    print("\n5. Testing /api/v1/budgets/recommend...")
    res = client.post("/api/v1/budgets/recommend", json={
        "question": "How should we distribute 100 billion to improve healthcare and infrastructure?",
        "budget": 100000.0,
        "horizon": 5,
        "strategy": "needs"
    })
    assert res.status_code == 200, res.text
    rec = res.json()
    assert "budgets" in rec
    assert len(rec["investigationStages"]) == 6
    print("   Passed: 6-stage AI investigation trace generated.")

    print("\n6. Testing /api/v1/decisions (Create & Read)...")
    res = client.post("/api/v1/decisions", json={
        "title": "National Healthcare Resilience Plan",
        "fiscalYear": 2026,
        "budgetAmount": 100000.0,
        "allocations": {"healthcare": 40000.0, "education": 30000.0, "infrastructure": 30000.0},
        "reason": "Test proposal persistence"
    })
    assert res.status_code == 200, res.text
    rec_id = res.json()["record"]["id"]
    
    # Read back
    res_list = client.get("/api/v1/decisions")
    assert res_list.status_code == 200
    records = res_list.json()["records"]
    assert any(r["id"] == rec_id for r in records)
    print("   Passed: Decision record stored and retrieved via Supabase/SQLite layer.")

    print("\n7. Testing Citizen Portal /api/chat...")
    res_chat = client.post("/api/chat", json={"query": "How much was spent on education in Ikeja?"})
    assert res_chat.status_code == 200, res_chat.text
    ans = res_chat.json()["answer"]
    assert "Ikeja" in ans or "Naira" in ans or "₦" in ans
    print("   Passed Citizen Query Answer:\n   ", ans[:120], "...")

    print("\n8. Testing Government Portal /api/allocate...")
    res_alloc = client.post("/api/allocate", json={"revenue_drop_percentage": 15})
    assert res_alloc.status_code == 200, res_alloc.text
    sim = res_alloc.json()["simulation_result"]
    assert "15% Revenue Contraction" in sim
    assert "Capital" in sim
    print("   Passed Allocation Simulation:\n   ", sim[:120], "...")

    print("\nALL BACKEND API TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_all()
