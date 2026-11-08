import type { ActionFunctionArgs } from "react-router";
import { JOEGLISH_SYSTEM_PROMPT, generateJoeglishFallback } from "~/utils/joeglish";
import { getEnv } from "~/utils/auth.server";

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const env = getEnv();

  let body: any;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const {
    messages = [],
    apiKey: clientApiKey,
    baseUrl: clientBaseUrl,
    model: clientModel,
    systemPrompt: clientSystemPrompt,
  } = body;

  // Prioritize server environment variables to prevent API key read/write leakage
  const apiKey = (env.LLM_API_KEY || clientApiKey || "").trim();
  const rawBaseUrl = (env.LLM_API_URL || clientBaseUrl || "https://api.openai.com/v1").trim();
  const baseUrl = rawBaseUrl.endsWith("/") ? rawBaseUrl.slice(0, -1) : rawBaseUrl;
  const model = (env.LLM_BASE_MODEL || clientModel || "gpt-4o").trim();
  const systemPrompt = clientSystemPrompt || JOEGLISH_SYSTEM_PROMPT;

  // Case 1: No API key configured -> Use interactive Joeglish streaming simulator
  if (!apiKey) {
    const lastUserMessage =
      [...messages].reverse().find((m: any) => m.role === "user")?.content || "Joello!";
    const fullResponse = generateJoeglishFallback(lastUserMessage);

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        // Break response into natural word/token chunks
        const tokens = fullResponse.split(/(?<=\s|[\n.,!?:;])/);
        for (const token of tokens) {
          const sseEvent = `data: ${JSON.stringify({
            choices: [{ delta: { content: token } }],
          })}\n\n`;
          controller.enqueue(encoder.encode(sseEvent));
          // Micro-delay between tokens to simulate realistic streaming
          await new Promise((r) => setTimeout(r, 20));
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  }

  // Case 2: API key is configured -> Stream from OpenAI-compatible endpoint
  try {
    const formattedMessages = [
      { role: "system", content: systemPrompt },
      ...messages.map((m: any) => ({
        role: m.role,
        content: m.content,
      })),
    ];

    const targetUrl = `${baseUrl}/chat/completions`;
    const upstreamRes = await fetch(targetUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: formattedMessages,
        stream: true,
      }),
    });

    if (!upstreamRes.ok) {
      const errText = await upstreamRes.text();
      let parsedError = errText;
      try {
        const parsed = JSON.parse(errText);
        parsedError = parsed.error?.message || errText;
      } catch {
        // Keep raw text
      }

      const encoder = new TextEncoder();
      const errorStream = new ReadableStream({
        start(controller) {
          const errMsg = `[Upstream Error ${upstreamRes.status}]: ${parsedError}`;
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                choices: [{ delta: { content: errMsg } }],
              })}\n\n`
            )
          );
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        },
      });

      return new Response(errorStream, {
        headers: {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache",
        },
      });
    }

    // Stream directly from upstream response body
    return new Response(upstreamRes.body, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err: any) {
    const encoder = new TextEncoder();
    const errorStream = new ReadableStream({
      start(controller) {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              choices: [{ delta: { content: `[Connection Exception]: ${err.message}` } }],
            })}\n\n`
          )
        );
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      },
    });

    return new Response(errorStream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  }
}
