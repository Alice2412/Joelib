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
    webSearch = false,
    model: clientModel,
  } = body;

  // Server-only provider credentials & endpoint (strictly non-overridable by client)
  const apiKey = (env.LLM_API_KEY || "").trim();
  const rawBaseUrl = (env.LLM_API_URL || "https://api.deepseek.com").trim();
  const baseUrl = rawBaseUrl.endsWith("/") ? rawBaseUrl.slice(0, -1) : rawBaseUrl;

  // Map JPT-6.1 Sol and JPT-6.1 Terra internally with differing effort
  const requestedModel = (clientModel || "jpt-6.1-sol").toLowerCase();
  const targetModel = (env.LLM_BASE_MODEL || "deepseek-chat").trim();

  // Immutable Joeglish system prompt (strictly non-overridable by client)
  let systemPrompt = JOEGLISH_SYSTEM_PROMPT;

  // Configure effort difference between JPT-6.1 Sol and JPT-6.1 Terra
  if (requestedModel === "jpt-6.1-sol") {
    systemPrompt += `\n\n[Operating Mode: JPT-6.1 Sol]: Apply comprehensive depth, thoroughness, step-by-step rigorous analysis, detailed mathematical derivations, and articulate wisdom in Joeglish.`;
  } else if (requestedModel === "jpt-6.1-terra") {
    systemPrompt += `\n\n[Operating Mode: JPT-6.1 Terra]: Deliver concise, efficient, grounded, and prompt responses with direct clarity in Joeglish.`;
  }

  if (webSearch) {
    systemPrompt += `\n\n[Web Search Mode Activated]: You have access to real-time search knowledge. Synthesize current, accurate facts while speaking in your authentic Joeglish dialect. Formulate clear citations or sources where helpful.`;
  }

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

  // Case 2: API key is configured -> Stream from upstream endpoint
  try {
    const formattedMessages = [
      { role: "system", content: systemPrompt },
      ...messages.map((m: any) => ({
        role: m.role,
        content: m.content,
      })),
    ];

    const targetUrl = `${baseUrl}/chat/completions`;
    const requestPayload: Record<string, any> = {
      model: targetModel,
      messages: formattedMessages,
      stream: true,
    };

    if (webSearch) {
      requestPayload.web_search = true;
    }

    const upstreamRes = await fetch(targetUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestPayload),
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

      // Sanitize error string to prevent leaking provider identity or URLs
      const cleanError = String(parsedError)
        .replace(/https?:\/\/[^\s]+/g, "")
        .replace(/openai/gi, "ChatJoePT")
        .replace(/deepseek/gi, "ChatJoePT")
        .trim();

      const encoder = new TextEncoder();
      const errorStream = new ReadableStream({
        start(controller) {
          const errMsg = `[ChatJoePT Error ${upstreamRes.status}]: ${cleanError}`;
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
