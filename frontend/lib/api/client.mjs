/**
 * NationOS Centralized Fiscal API Client
 * Manages HTTP communication with the backend service or local mock adapters.
 */

import { mockFiscalAdapter } from "./fiscal-adapter.mjs";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";
const FORCE_MOCK =
  process.env.NEXT_PUBLIC_USE_MOCK_API === "true" ||
  process.env.NEXT_PUBLIC_USE_MOCK_API === undefined ||
  !API_BASE_URL;

class FiscalApiClient {
  constructor(baseUrl, useMock) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.useMock = useMock;
  }

  async _fetch(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs || 15000);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...options.headers,
        },
      });

      if (!response.ok) {
        let errorBody = {};
        try {
          errorBody = await response.json();
        } catch {
          errorBody = { message: response.statusText };
        }
        const error = new Error(
          errorBody.message || errorBody.error || `Request failed with status ${response.status}`,
        );
        error.status = response.status;
        error.details = errorBody;
        throw error;
      }

      return await response.json();
    } finally {
      clearTimeout(timeout);
    }
  }

  async getOverview(params = {}) {
    if (this.useMock) {
      return mockFiscalAdapter.getOverview(params);
    }
    const query = new URLSearchParams(params).toString();
    return this._fetch(`/api/v1/fiscal/overview${query ? `?${query}` : ""}`);
  }

  async getRevenue(params = {}) {
    if (this.useMock) {
      return mockFiscalAdapter.getRevenue(params);
    }
    const query = new URLSearchParams(params).toString();
    return this._fetch(`/api/v1/fiscal/revenue${query ? `?${query}` : ""}`);
  }

  async recommendBudget(params = {}) {
    if (this.useMock) {
      return mockFiscalAdapter.recommendBudget(params);
    }
    return this._fetch("/api/v1/budgets/recommend", {
      method: "POST",
      body: JSON.stringify(params),
    });
  }

  async calculateBudget(params = {}) {
    if (this.useMock) {
      return mockFiscalAdapter.calculateBudget(params);
    }
    return this._fetch("/api/v1/budgets/calculate", {
      method: "POST",
      body: JSON.stringify(params),
    });
  }

  async simulateScenarios(params = {}) {
    if (this.useMock) {
      return mockFiscalAdapter.simulateScenarios(params);
    }
    return this._fetch("/api/v1/scenarios/simulate", {
      method: "POST",
      body: JSON.stringify(params),
    });
  }

  async getDecisions() {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem("nationos-decisions-v2");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  async saveDecision(record) {
    if (typeof window === "undefined") return record;
    const existing = await this.getDecisions();
    const now = new Date().toISOString();
    const newRecord = {
      id: record.id || `DEC-${Date.now().toString(36).toUpperCase()}`,
      created: record.created || now,
      updated: now,
      status: record.status || "Draft",
      ...record,
    };
    const updated = [newRecord, ...existing.filter((d) => d.id !== newRecord.id)];
    localStorage.setItem("nationos-decisions-v2", JSON.stringify(updated));
    return newRecord;
  }

  async updateDecision(id, patch) {
    if (typeof window === "undefined") return null;
    const existing = await this.getDecisions();
    const index = existing.findIndex((d) => d.id === id);
    if (index === -1) throw new Error(`Decision record ${id} not found`);
    const updatedRecord = {
      ...existing[index],
      ...patch,
      updated: new Date().toISOString(),
    };
    existing[index] = updatedRecord;
    localStorage.setItem("nationos-decisions-v2", JSON.stringify(existing));
    return updatedRecord;
  }
}

export const fiscalApi = new FiscalApiClient(API_BASE_URL, FORCE_MOCK);
