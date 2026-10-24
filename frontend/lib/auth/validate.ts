import { z, type ZodError } from "zod";
import type { FieldErrors } from "./types";

const email = z
  .string()
  .trim()
  .toLowerCase()
  .max(254, "Enter an email address.")
  .email("Enter a valid email address.");

export const signInSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password.").max(200, "That password is too long."),
  next: z.string().max(300).optional(),
});

export const signUpSchema = z.object({
  name: z.string().trim().min(2, "Enter your name.").max(80, "Use a shorter name."),
  agency: z
    .string()
    .trim()
    .min(2, "Enter a place or organisation.")
    .max(120, "Use a shorter place or organisation."),
  email,
  password: z
    .string()
    .min(12, "Use at least 12 characters.")
    .max(200, "That password is too long."),
  role: z.string().max(40).optional(),
  next: z.string().max(300).optional(),
});

export function fieldErrorsFrom(error: ZodError): FieldErrors {
  const fields: FieldErrors = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!fields[key]) fields[key] = issue.message;
  }
  return fields;
}
