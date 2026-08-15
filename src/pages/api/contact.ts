import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { contactSchema, fieldErrors, isSpam } from "@/lib/contact-schema";

export const prerender = false;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

export const POST: APIRoute = async ({ request }) => {
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return json({ ok: false, error: "Expected a JSON body." }, 415);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "Malformed JSON body." }, 400);
  }

  // Checked before validation so the response never reveals the trap: a bot
  // gets the same success it would get for a clean submission, and nothing sends.
  if (isSpam(body)) return json({ ok: true });

  const result = contactSchema.safeParse(body);

  if (!result.success) {
    return json(
      {
        ok: false,
        error: "Some fields need another look.",
        fields: fieldErrors(result.error),
      },
      400,
    );
  }

  const { firstName, lastName, email, subject, message, teacher } = result.data;

  const heading = teacher ? `${subject} (for ${teacher})` : subject;

  try {
    const response = await env.EMAIL.send({
      from: "contact@envisioncsreport.com",
      to: "clpowe@gmail.com",
      // Replying in the inbox goes straight to the visitor.
      replyTo: email,
      subject: `Contact form: ${heading}`,
      text: [
        `Name: ${firstName} ${lastName}`,
        `Email: ${email}`,
        teacher ? `Teacher: ${teacher}` : null,
        `Subject: ${subject}`,
        "",
        message,
      ]
        .filter((line) => line !== null)
        .join("\n"),
    });

    console.log("Sent:", response.messageId);
    return json({ ok: true, messageId: response.messageId });
  } catch (error: any) {
    console.error("Email send failed:", error.code, error.message);
    // The upstream message can leak provider detail; keep it in the logs.
    return json({ ok: false, error: "Message could not be sent. Try again shortly." }, 500);
  }
};
