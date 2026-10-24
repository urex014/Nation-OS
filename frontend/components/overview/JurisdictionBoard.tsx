import Link from "next/link";
import type { Overview } from "@/lib/types";

const ZONES = [
  "North West",
  "North East",
  "North Central",
  "South West",
  "South East",
  "South South",
];

export function JurisdictionBoard({
  jurisdictions,
  current,
}: {
  jurisdictions: Overview["jurisdictions"];
  current: string;
}) {
  const peak = Math.max(...jurisdictions.map((item) => item.sharePercent), 1);
  return (
    <section className="panel" aria-label="37 jurisdictions">
      <div className="priority-row">
        <h2 className="eyebrow">Jurisdictions</h2>
        <p className="quiet">
          Every state amount is published January–September 2026 gross FAAC. The FCT is not in that
          table.
        </p>
      </div>
      <div className="zone-frame">
        <div className="zones">
          {ZONES.map((zone) => (
            <div className="zone" key={zone}>
              <h3>{zone}</h3>
              {jurisdictions
                .filter((item) => item.zone === zone)
                .map((item) => (
                  <Link
                    key={item.id}
                    className={`cell ${item.provenance === "published" ? "" : "cell-outside"}`}
                    href={`/?jurisdictionId=${item.id}`}
                    aria-current={current === item.id ? "page" : undefined}
                  >
                    <span>{item.name}</span>
                    <span>{item.provenance === "outside" ? "—" : `${item.sharePercent}%`}</span>
                    {item.provenance === "outside" ? null : (
                      <span
                        className="cell-meter"
                        style={{ width: `${Math.round((item.sharePercent / peak) * 100)}%` }}
                      />
                    )}
                  </Link>
                ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
