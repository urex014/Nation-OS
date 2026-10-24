import Image from "next/image";
import Link from "next/link";

/** Full wordmark. Dark file is for the forest bar; light file is for paper. */
export function Logo({ inverse = false, href = "/", onClick, className = "" }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`inline-flex min-w-0 items-center ${className}`.trim()}
    >
      <Image
        src={inverse ? "/logo-full-dark.png" : "/logo-full.png"}
        alt="NationOS"
        width={1412}
        height={400}
        sizes="180px"
        priority
        className="h-10 w-auto max-w-full"
        style={{ width: "auto", height: "2.5rem" }}
      />
    </Link>
  );
}
