import React from "react";
import { definitions, states } from "../../lib/client/country.mjs";
import { Button, Field, Panel } from "../ui/primitives";

export function PlanForm({ draft, onChange, onCalculate, onSave, onDownload }) {
  const update = (key, value) => onChange({ ...draft, [key]: value });
  const config = (key, value) => update("config", { ...draft.config, [key]: value });
  // Native validation helps the user; the shared engine also validates every calculation.
  return (
    <Panel title="Proposal inputs">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onCalculate();
        }}
        className="space-y-5"
      >
        <Field label="Proposal title">
          <input
            required
            maxLength={160}
            value={draft.title}
            onChange={(event) => update("title", event.target.value)}
          />
        </Field>
        <Field label="Reasoning and evidence">
          <textarea
            required
            maxLength={3000}
            value={draft.reason}
            onChange={(event) => update("reason", event.target.value)}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Investment scope">
            <select
              value={draft.config.scope}
              onChange={(event) => config("scope", event.target.value)}
            >
              <option value="all">Whole country</option>
              {states.map((state) => (
                <option key={state.id} value={state.id}>
                  {state.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Planning horizon">
            <select
              value={draft.config.years}
              onChange={(event) => config("years", Number(event.target.value))}
            >
              <option value={5}>5 years</option>
              <option value={10}>10 years</option>
            </select>
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            ["growth", "Population growth (%)", 5],
            ["delivery", "Delivery (%)", 100],
            ["maintenance", "Maintenance (%)", 50],
          ].map(([key, label, max]) => (
            <Field key={key} label={label}>
              <input
                type="number"
                required
                min="0"
                max={max}
                step="0.1"
                value={draft.config[key]}
                onChange={(event) => config(key, Number(event.target.value))}
              />
            </Field>
          ))}
        </div>
        <h3>Annual investment Â· Aâ‚¦ millions</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {Object.entries(definitions).map(([key, definition]) => (
            <Field key={key} label={definition.name}>
              <input
                type="number"
                required
                min="0"
                max="2000"
                step="0.1"
                value={draft.config.budgets[key]}
                onChange={(event) =>
                  config("budgets", { ...draft.config.budgets, [key]: Number(event.target.value) })
                }
              />
            </Field>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button primary type="submit">
            Calculate scenarios
          </Button>
          <Button onClick={onSave}>Save proposed decision</Button>
          <Button onClick={onDownload}>Download model</Button>
        </div>
      </form>
    </Panel>
  );
}
