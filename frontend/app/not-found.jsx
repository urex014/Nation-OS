import Link from "next/link";
export default function NotFound() {
  return (
    <section className="py-16">
      <h1 className="font-serif text-4xl">Page not found</h1>
      <p className="my-5 text-sm">This workspace section does not exist.</p>
      <Link href="/" className="underline">
        Return to the country overview
      </Link>
    </section>
  );
}
