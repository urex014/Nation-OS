import React from "react";
import { states } from "../../lib/client/country.mjs";
import { stateBoundaries, stateSites } from "../../lib/client/geography.mjs";

const colors = ["#c8d2b1", "#e1d9af", "#bdd1c2", "#d7cebb", "#c2d5d7", "#ccd6bb"];
export function CountryMap({ selected, onSelect }) {
  // Keyboard-operable SVG cells represent fictional boundaries, not surveyed geography.
  return (
    <svg
      viewBox="80 0 500 450"
      role="group"
      aria-label="Aderin map with 37 selectable jurisdictions"
      className="mx-auto max-h-[460px] w-full"
    >
      {states.map((state, index) => (
        <g key={state.id}>
          <polygon
            role="button"
            tabIndex={0}
            aria-label={state.name}
            aria-pressed={selected === state.id}
            onClick={() => onSelect(state.id)}
            onKeyDown={(event) => {
              if (["Enter", " "].includes(event.key)) {
                event.preventDefault();
                onSelect(state.id);
              }
            }}
            points={stateBoundaries[index].map((point) => point.join(",")).join(" ")}
            fill={selected === state.id ? "#476548" : colors[state.parentZone]}
            stroke="#fff"
            strokeWidth="2"
            className="cursor-pointer transition hover:opacity-70"
          >
            <title>{state.name}</title>
          </polygon>
          <text
            x={stateSites[index][0]}
            y={stateSites[index][1]}
            textAnchor="middle"
            pointerEvents="none"
            fontSize="9"
            fill={selected === state.id ? "white" : "#18352e"}
          >
            {state.id.replace("AD-", "")}
          </text>
        </g>
      ))}
    </svg>
  );
}
