import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export function Heading({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <header className="mb-8">
      <p className="mb-2 text-xs uppercase tracking-widest text-emerald-700">{eyebrow}</p>
      <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
      {children ? (
        <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-500">{children}</p>
      ) : null}
    </header>
  );
}

export function Card({
  title,
  children,
  className = "",
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-xl border border-stone-200 bg-white p-6 ${className}`}>
      {title ? <h2 className="mb-5 font-semibold">{title}</h2> : null}
      {children}
    </section>
  );
}

export function Stat({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <Card>
      <p className="text-xs text-stone-500">{label}</p>
      <p className="my-3 text-2xl font-semibold">{value}</p>
      <p className="text-xs leading-5 text-stone-500">{note}</p>
    </Card>
  );
}

export function Button({
  children,
  secondary,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { secondary?: boolean }) {
  return (
    <button
      {...props}
      className={`rounded-md px-4 py-2.5 text-sm disabled:opacity-40 ${
        secondary
          ? "border border-stone-300 bg-white"
          : "bg-emerald-900 text-white hover:bg-emerald-800"
      }`}
    >
      {children}
    </button>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-2 text-sm text-stone-600">
      <span>{label}</span>
      {children}
    </label>
  );
}

export function Notice({ children, error }: { children: ReactNode; error?: boolean }) {
  return (
    <p
      role={error ? "alert" : undefined}
      className={`rounded-md border p-4 text-sm leading-6 ${
        error
          ? "border-red-200 bg-red-50 text-red-800"
          : "border-emerald-100 bg-emerald-50/50 text-emerald-950"
      }`}
    >
      {children}
    </p>
  );
}

export function Source({ id, children = "Source" }: { id: string; children?: ReactNode }) {
  return (
    <Link className="text-xs text-emerald-700 underline underline-offset-4" href={`/sources#${id}`}>
      {children}
    </Link>
  );
}
