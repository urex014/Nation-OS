import { NextResponse } from "next/server";
import { cookieOptions, SESSION_COOKIE, SESSION_TTL_SECONDS } from "./token";

const noStore = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };

export function jsonError(error: string, status: number, fieldErrors?: Record<string, string>) {
  return NextResponse.json(fieldErrors ? { error, fieldErrors } : { error }, {
    status,
    headers: noStore,
  });
}

export function withSession(body: unknown, token: string, status = 200) {
  const response = NextResponse.json(body, { status, headers: noStore });
  response.cookies.set(SESSION_COOKIE, token, cookieOptions(SESSION_TTL_SECONDS));
  return response;
}

export function clearSession(body: unknown) {
  const response = NextResponse.json(body, { headers: noStore });
  response.cookies.set(SESSION_COOKIE, "", { ...cookieOptions(0), maxAge: 0 });
  return response;
}

type StatusError = { status?: number; message?: string };

export function httpFailure(error: unknown) {
  const status = Number((error as StatusError)?.status) || 500;
  const message =
    error instanceof Error && (status === 503 || (status >= 400 && status < 500))
      ? error.message
      : "The request could not be completed.";
  return jsonError(message, status);
}
