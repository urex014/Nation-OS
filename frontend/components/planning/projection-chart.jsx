import React from "react";
import { definitions } from "../../lib/client/country.mjs";

export function ProjectionChart({ result, sector }) {
  const values = result.years.flatMap((year) => [
    year.national[sector].no,
    year.national[sector].with,
  ]);
  const min = Math.min(...values) - 1,
    max = Math.max(...values) + 1;
  const line = (path) =>
    result.years
      .map(
        (year, index) =>
          `${40 + (index * 520) / (result.years.length - 1)},${170 - ((year.national[sector][path] - min) / (max - min)) * 130}`,
      )
      .join(" ");
  return (
    <figure>
      <svg
        viewBox="0 0 600 210"
        role="img"
        aria-label={`National ${definitions[sector].metric} scenario projection`}
        className="w-full"
      >
        <line x1="40" y1="175" x2="570" y2="175" stroke="#ccc" />
        <text x="0" y="40" fontSize="11">
          {max.toFixed(1)}
        </text>
        <text x="0" y="175" fontSize="11">
          {min.toFixed(1)}
        </text>
        <polyline
          points={line("no")}
          fill="none"
          stroke="#a39075"
          strokeDasharray="5 4"
          strokeWidth="2"
        />
        <polyline points={line("with")} fill="none" stroke="#476548" strokeWidth="3" />
        <text x="40" y="200" fontSize="11">
          2026
        </text>
        <text x="530" y="200" fontSize="11">
          {result.years.at(-1).year}
        </text>
      </svg>
      <figcaption className="text-xs text-stone-500">
        Green: with investment. Dashed: no new investment. National averages; fictional conditional
        scenarios.
      </figcaption>
    </figure>
  );
}
