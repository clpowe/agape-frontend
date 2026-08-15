import { z } from "astro/zod";

// One schema for both sides of the wire: the page script uses it to block bad
// submissions, the API route re-runs it because a client check is a courtesy,
// never a guarantee.
export const contactSchema = z.object({
  firstName: z
    .string({ error: "First name is required." })
    .trim()
    .min(1, "First name is required.")
    .max(80, "First name must be 80 characters or fewer."),
  lastName: z
    .string({ error: "Last name is required." })
    .trim()
    .min(1, "Last name is required.")
    .max(80, "Last name must be 80 characters or fewer."),
  email: z
    .email("Enter a valid email address.")
    .trim()
    .min(1, "Email address is required.")
    .max(254, "Email address must be 254 characters or fewer."),
  subject: z
    .string({ error: "Subject is required." })
    .trim()
    .min(1, "Subject is required.")
    .max(120, "Subject must be 120 characters or fewer."),
  message: z
    .string({ error: "Message is required." })
    .trim()
    .min(10, "Message must be at least 10 characters.")
    .max(2000, "Message must be 2000 characters or fewer."),
  // Which teacher page the message came from; absent on other forms.
  teacher: z.string().trim().max(120).optional(),
  // Spam trap. Anything non-empty here is a bot, but that is handled outside the
  // schema so the response never tells the bot which field gave it away.
  company: z.string().max(200).optional(),
});

/** True when the honeypot was filled, i.e. the submission came from a bot. */
export function isSpam(body: unknown): boolean {
  return Boolean(
    body &&
    typeof body === "object" &&
    typeof (body as { company?: unknown }).company === "string" &&
    (body as { company: string }).company.trim(),
  );
}

export type ContactInput = z.input<typeof contactSchema>;
export type ContactPayload = z.output<typeof contactSchema>;

export type FieldErrors = Partial<Record<keyof ContactPayload, string>>;

/** First message per field, in a shape both the script and the route can render. */
export function fieldErrors(error: z.ZodError): FieldErrors {
  const errors: FieldErrors = {};

  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key !== "string") continue;
    const field = key as keyof ContactPayload;
    if (errors[field]) continue;
    errors[field] = issue.message;
  }

  return errors;
}
