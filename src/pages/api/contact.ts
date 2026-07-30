import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";

export const POST: APIRoute = async ({ request }) => {
  try {
    const response = await env.EMAIL.send({
      from: "contact@envisioncsreport.com",
      to: "clpowe@gmail.com",
      replyTo: "clpowe@gmail.com",
      subject: "I am from cloudflare",
      text: "stuff",
    });

    console.log("Sent:", response.messageId);
    return new Response(JSON.stringify({ ok: true, messageId: response.messageId }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Email send failed:", error.code, error.message);
    return new Response(JSON.stringify({ ok: false, error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
