export function RevenueCurve({
  quarters,
  collected,
  target,
}: {
  quarters: string[];
  collected: number[];
  target: number[];
}) {
  if (quarters.length === 0) {
    return (
      <figure className="panel">
        <figcaption className="priority-row">
          <span className="eyebrow">Revenue trajectory</span>
        </figcaption>
        <p className="quiet">No quarterly revenue series is loaded.</p>
      </figure>
    );
  }

  const max = Math.max(...collected, ...target, 1) * 1.15;
  const x = (index: number) => 28 + (index * 270) / Math.max(quarters.length - 1, 1);
  const y = (value: number) => 118 - (value / max) * 96;
  const line = (series: number[]) =>
    series
      .map(
        (value, index) => `${index === 0 ? "M" : "L"}${x(index).toFixed(1)} ${y(value).toFixed(1)}`,
      )
      .join(" ");
  const area = `${line(collected)} L${x(collected.length - 1).toFixed(1)} 118 L${x(0).toFixed(1)} 118 Z`;

  return (
    <figure className="panel">
      <figcaption className="priority-row">
        <span className="eyebrow">Revenue trajectory</span>
        <span className="quiet">₦ trillion</span>
      </figcaption>
      <svg
        className="curve"
        viewBox="0 0 320 150"
        role="img"
        aria-label="Quarterly collected revenue against target"
      >
        {[0, 1, 2, 3].map((row) => (
          <line
            key={row}
            x1="24"
            x2="304"
            y1={28 + row * 24}
            y2={28 + row * 24}
            stroke="var(--line)"
          />
        ))}
        <path d={area} fill="var(--emerald)" opacity="0.16" />
        <path
          d={line(target)}
          fill="none"
          stroke="var(--ink)"
          strokeWidth="1.75"
          strokeDasharray="5 4"
          opacity="0.55"
        />
        <path d={line(collected)} fill="none" stroke="var(--emerald)" strokeWidth="2.5" />
        {collected.map((value, index) => (
          <circle
            key={quarters[index]}
            cx={x(index)}
            cy={y(value)}
            r="3.5"
            fill="var(--card)"
            stroke="var(--emerald)"
            strokeWidth="2"
          />
        ))}
        {quarters.map((quarter, index) => (
          <text
            key={quarter}
            x={x(index)}
            y="140"
            textAnchor="middle"
            fontSize="11"
            fill="currentColor"
          >
            {quarter}
          </text>
        ))}
      </svg>
      <div className="legend">
        <span>
          <span className="swatch swatch-collected" /> Collected
        </span>
        <span>
          <span className="swatch swatch-target" /> Target
        </span>
      </div>
      <table className="sr-only">
        <caption>Collected and target revenue by quarter, trillion naira</caption>
        <thead>
          <tr>
            <th>Quarter</th>
            <th>Collected</th>
            <th>Target</th>
          </tr>
        </thead>
        <tbody>
          {quarters.map((quarter, index) => (
            <tr key={quarter}>
              <td>{quarter}</td>
              <td>{collected[index]}</td>
              <td>{target[index]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
