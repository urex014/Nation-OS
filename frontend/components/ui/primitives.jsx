import React from "react";
/** Small presentation components keep spacing and accessible controls consistent across features. */
export function Heading({ eyebrow, title, children, action }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-stone-300 pb-6">
      <div>
        <p className="mb-3 text-xs uppercase tracking-[.18em] text-accent">{eyebrow}</p>
        <h1 className="font-serif text-4xl leading-tight md:text-5xl">{title}</h1>
        {children && <p className="mt-4 max-w-3xl text-sm leading-7 text-stone-600">{children}</p>}
      </div>
      {action}
    </div>
  );
}
export function Panel({ title, children, className = "", action }) {
  return (
    <section className={`min-w-0 border border-stone-300 bg-white ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 px-5 py-4">
        <h2 className="font-serif text-2xl">{title}</h2>
        {action}
      </div>
      <div className="space-y-5 p-5">{children}</div>
    </section>
  );
}
export function Button({ children, primary = false, className = "", ...props }) {
  return (
    <button
      type="button"
      {...props}
      className={`inline-flex items-center justify-center border px-4 py-2.5 text-sm transition disabled:cursor-wait disabled:opacity-50 ${primary ? "border-ink bg-ink text-white hover:bg-accent" : "border-stone-300 bg-white hover:bg-stone-100"} ${className}`}
    >
      {children}
    </button>
  );
}
export function Field({ label, children, hint }) {
  return (
    <label className="block space-y-2 text-sm">
      <span className="block font-medium">{label}</span>
      {children}
      {hint && <span className="block text-xs leading-5 text-stone-500">{hint}</span>}
    </label>
  );
}
export function Note({ children, error = false }) {
  return (
    <div
      role={error ? "alert" : undefined}
      className={`border-l-2 px-4 py-3 text-sm leading-7 ${error ? "border-red-600 bg-red-50 text-red-900" : "border-accent bg-stone-100 text-stone-600"}`}
    >
      {children}
    </div>
  );
}
export function Stats({ items }) {
  return (
    <div className="mb-7 grid border border-stone-300 bg-white sm:grid-cols-2 xl:grid-cols-4">
      {items.map(([label, value, detail]) => (
        <div key={label} className="border-b border-r border-stone-200 p-5">
          <p className="text-xs uppercase tracking-wider text-stone-500">{label}</p>
          <p className="my-4 font-serif text-3xl">{value}</p>
          <p className="text-xs leading-5 text-stone-500">{detail}</p>
        </div>
      ))}
    </div>
  );
}
export function DataTable({ headers, children, caption }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        {caption && <caption className="pb-4 text-left text-xs text-stone-500">{caption}</caption>}
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header} scope="col">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
