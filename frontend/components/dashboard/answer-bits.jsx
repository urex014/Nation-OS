import Link from "next/link";

function tag(input) {
  if (input.assumed) return "Assumed budget";
  if (input.enteredByUser) return "You entered";
  return input.label || "Input";
}

export function AnswerBits({ message }) {
  const work = Array.isArray(message.work) ? message.work : [];
  const alternatives = Array.isArray(message.alternatives) ? message.alternatives : [];
  const links = Array.isArray(message.links) ? message.links : [];
  const warnings = Array.isArray(message.warnings) ? message.warnings : [];
  if (!work.length && !alternatives.length && !links.length && !warnings.length && !message.bestReason) {
    return null;
  }
  return (
    <div className="mt-3 space-y-2 text-xs leading-5 text-stone-700">
      {warnings.map((warning) => (
        <p key={warning}>{warning}</p>
      ))}
      {alternatives.map((item) => (
        <p key={item.id || item.title}>
          {item.best ? <strong>Best fit: </strong> : null}
          {item.title}. {item.summary} {item.tradeoff}
        </p>
      ))}
      {message.bestReason ? <p>{message.bestReason}</p> : null}
      {work.length ? (
        <div>
          <p className="font-semibold text-[#18352e]">How we got this</p>
          {work.map((row, index) => (
            <div key={`${row.formula}-${index}`}>
              <p>{row.formula}</p>
              {(row.inputs || []).map((input) => (
                <p key={`${input.label}-${input.display}`}>
                  {tag(input)}: {input.display}
                </p>
              ))}
            </div>
          ))}
        </div>
      ) : null}
      {links.map((link) => (
        <Link
          key={`${link.href}-${link.label}`}
          href={link.href}
          className="inline-flex min-h-11 items-center text-emerald-800 underline"
        >
          {link.label}
        </Link>
      ))}
    </div>
  );
}
