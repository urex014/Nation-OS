import Link from "next/link";

export default function NotFound() {
  return (
    <section className="py-16">
      <h1 className="break-words font-serif text-4xl">We can&apos;t find that page</h1>
      <p className="my-5 text-sm">That part of NationOS doesn&apos;t exist.</p>
      <Link href="/" className="inline-flex min-h-11 items-center underline">
        Back to the start
      </Link>
    </section>
  );
}
