"use client";

import { useState } from "react";

/** Full hash on a wide screen. One truncated line and a copy control on a phone. */
export function HashLine({ value }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const area = document.createElement("textarea");
      area.value = value;
      area.setAttribute("readonly", "");
      document.body.append(area);
      area.select();
      document.execCommand("copy");
      area.remove();
    }
    setCopied(true);
  }

  return (
    <div className="mt-4 flex flex-col gap-2 md:block">
      <p className="hidden break-all font-mono text-[10px] text-stone-400 md:block">
        SHA-256 {value}
      </p>
      <p className="truncate font-mono text-sm text-stone-500 md:hidden" title={value}>
        SHA-256 {value}
      </p>
      <button
        type="button"
        onClick={copy}
        className="min-h-11 rounded-md border border-stone-300 bg-white px-4 text-sm font-medium text-[#18352e] md:hidden"
      >
        {copied ? "Copied" : "Copy SHA-256"}
      </button>
    </div>
  );
}
