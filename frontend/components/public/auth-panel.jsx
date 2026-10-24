"use client";
import { useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DEMO_USERS } from "../../lib/auth/demo-users";
import { ROLE_PROFILES } from "../../lib/auth/types";
import { Button, Field, Notice } from "../nigeria/ui";

export function AuthPanel() {
  const params = useSearchParams();
  const router = useRouter();
  const [mode, setMode] = useState("sign-in");
  const [error, setError] = useState("");
  const [fields, setFields] = useState({});
  const [pending, setPending] = useState(false);
  const pendingRef = useRef(false);

  async function onSubmit(event) {
    event.preventDefault();
    if (pendingRef.current) return;
    pendingRef.current = true;
    setPending(true);
    setError("");
    setFields({});
    const form = new FormData(event.currentTarget);
    const signingIn = mode === "sign-in";
    const body = signingIn
      ? {
          email: form.get("email"),
          password: form.get("password"),
          next: params.get("next") || undefined,
        }
      : {
          name: form.get("name"),
          agency: form.get("agency"),
          email: form.get("email"),
          password: form.get("password"),
        };
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    let moved = false;
    try {
      const response = await fetch(signingIn ? "/api/auth/sign-in" : "/api/auth/sign-up", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "The request could not be completed.");
        setFields(data.fieldErrors || {});
        return;
      }
      if (!data.dashboardPath) {
        setError("We couldn't open your desk.");
        return;
      }
      moved = true;
      router.replace(data.dashboardPath);
    } catch (error) {
      const aborted = error instanceof Error && error.name === "AbortError";
      setError(
        aborted
          ? signingIn
            ? "Signing in is taking too long. Check your connection and try again."
            : "Creating an account is taking too long. Check your connection and try again."
          : "We couldn't reach NationOS. Check your connection and try again.",
      );
    } finally {
      clearTimeout(timer);
      if (!moved) {
        pendingRef.current = false;
        setPending(false);
      }
    }
  }

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-[0_1px_0_rgb(11_59_44_/_0.04),0_14px_32px_rgb(11_59_44_/_0.06)] sm:p-8">
      <div
        className="grid grid-cols-2 gap-1 rounded-md bg-[#F8FAF9] p-1"
        role="group"
        aria-label="Account action"
      >
        {[
          ["sign-in", "Sign in"],
          ["sign-up", "Create account"],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            aria-pressed={mode === value}
            disabled={pending}
            onClick={() => {
              setMode(value);
              setError("");
              setFields({});
            }}
            className={`rounded-md px-3 py-2 text-sm font-medium max-md:min-h-11 ${mode === value ? "bg-[#0B3B2C] text-white" : "text-[#18352e]"}`}
          >
            {label}
          </button>
        ))}
      </div>
      <h1 className="mt-6 font-serif text-3xl font-semibold tracking-tight">
        {mode === "sign-in" ? "Sign in" : "Create a citizen account"}
      </h1>
      <p className="mt-3 text-sm leading-6 text-stone-600">
        {mode === "sign-in"
          ? "We'll check your role, then open the right desk."
          : "New accounts are for the public. This form can't make you a government user."}
      </p>
      <form className="mt-6 space-y-4" onSubmit={onSubmit} noValidate>
        {mode === "sign-up" && (
          <>
            <Field label="Name">
              <input name="name" autoComplete="name" required aria-invalid={Boolean(fields.name)} />
            </Field>
            {fields.name && <p className="text-sm text-red-800">{fields.name}</p>}
            <Field label="Place or organisation">
              <input
                name="agency"
                autoComplete="organization"
                required
                aria-invalid={Boolean(fields.agency)}
              />
            </Field>
            {fields.agency && <p className="text-sm text-red-800">{fields.agency}</p>}
          </>
        )}
        <Field label="Email">
          <input
            name="email"
            type="email"
            autoComplete="username"
            required
            aria-invalid={Boolean(fields.email)}
          />
        </Field>
        {fields.email && <p className="text-sm text-red-800">{fields.email}</p>}
        <Field label="Password">
          <input
            name="password"
            type="password"
            autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
            required
            aria-invalid={Boolean(fields.password)}
          />
        </Field>
        {fields.password && <p className="text-sm text-red-800">{fields.password}</p>}
        {error && <Notice error>{error}</Notice>}
        <div className="[&_button]:w-full">
          <Button type="submit" disabled={pending} aria-busy={pending}>
            {pending ? (
              <span className="inline-flex items-center justify-center gap-2">
                <span
                  className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                  aria-hidden="true"
                />
                {mode === "sign-in" ? "Signing in…" : "Creating account…"}
              </span>
            ) : mode === "sign-in" ? (
              "Sign in"
            ) : (
              "Create account"
            )}
          </Button>
        </div>
      </form>
      <details className="mt-6 text-sm leading-6 text-stone-600">
        <summary className="font-medium text-[#18352e] max-md:flex max-md:min-h-11 max-md:items-center">
          Demo accounts
        </summary>
        <ul className="mt-3 space-y-2">
          {DEMO_USERS.map((account) => (
            <li key={account.email}>
              <span className="font-medium text-[#18352e]">
                {ROLE_PROFILES[account.role].title}
              </span>
              <span className="mt-0.5 block">
                {account.email}
                <span className="text-stone-500"> · </span>
                {account.password}
              </span>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
