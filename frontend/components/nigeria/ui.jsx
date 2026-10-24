import Link from "next/link";
// Presentation helpers deliberately contain no data or model logic.
export function Heading({ eyebrow, title, children }) {
  return (
    <header className="mb-8 scroll-mt-24">
      <p className="mb-2 text-xs uppercase tracking-widest text-emerald-700">{eyebrow}</p>
      <h1 className="break-words text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-500">{children}</p>
    </header>
  );
}
export function Card({ title, children, className = "" }) {
  return (
    <section
      className={`min-w-0 rounded-xl border border-stone-200 bg-white p-5 sm:p-6 ${className}`}
    >
      {title && <h2 className="mb-5 font-semibold">{title}</h2>}
      {children}
    </section>
  );
}
export function Stat({ label, value, note }) {
  return (
    <Card>
      <p className="text-xs text-stone-500">{label}</p>
      <p className="my-3 break-words text-2xl font-semibold">{value}</p>
      <p className="text-xs leading-5 text-stone-500">{note}</p>
    </Card>
  );
}
export function Button({ children, secondary, ...props }) {
  return (
    <button
      {...props}
      className={`rounded-md px-4 py-2.5 text-sm disabled:opacity-40 max-md:inline-flex max-md:min-h-11 max-md:w-full max-md:items-center max-md:justify-center ${secondary ? "border border-stone-300 bg-white" : "bg-emerald-900 text-white hover:bg-emerald-800"}`}
    >
      {children}
    </button>
  );
}
export function Field({ label, children }) {
  return (
    <label className="block space-y-2 text-sm text-stone-600">
      <span>{label}</span>
      {children}
    </label>
  );
}
export function Notice({ children, error }) {
  return (
    <p
      role={error ? "alert" : undefined}
      className={`rounded-md border p-4 text-sm leading-6 ${error ? "border-red-200 bg-red-50 text-red-800" : "border-emerald-100 bg-emerald-50/50 text-emerald-950"}`}
    >
      {children}
    </p>
  );
}
export function Source({ id, children = "Where this comes from" }) {
  return (
    <Link
      className="text-xs text-emerald-700 underline underline-offset-4 max-md:inline-flex max-md:min-h-11 max-md:items-center"
      href={`/sources#${id}`}
    >
      {children}
    </Link>
  );
}
export function Download({ value }) {
  function download() {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(value, null, 2)], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "nationos-record.json";
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <Button secondary onClick={download}>
      Download JSON
    </Button>
  );
}
