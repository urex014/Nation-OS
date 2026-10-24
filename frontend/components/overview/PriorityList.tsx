import type { Overview } from "@/lib/types";

export function PriorityList({ priorities }: { priorities: Overview["priorities"] }) {
  return (
    <section className="panel" aria-label="National priorities">
      <h2 className="eyebrow">National priorities</h2>
      {priorities.length === 0 ? (
        <p className="quiet">No sector split of the ₦68.3tn third reading is in the cited files.</p>
      ) : (
        priorities.map((priority) => (
          <div className="priority" key={priority.name}>
            <div className="priority-row">
              <strong>{priority.name}</strong>
              <span className="quiet">{priority.amount}</span>
            </div>
            <div className="meter" aria-hidden="true">
              <span style={{ width: `${priority.percent}%` }} />
            </div>
            <p className="quiet">
              {priority.projects} projects · {priority.percent}% of the envelope in view
            </p>
          </div>
        ))
      )}
    </section>
  );
}
