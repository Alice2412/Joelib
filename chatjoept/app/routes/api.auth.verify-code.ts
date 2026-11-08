import type { ActionFunctionArgs } from "react-router";
import {
  verifyOtpChallenge,
  createSessionToken,
  serializeSessionCookie,
  getEnv,
} from "~/utils/auth.server";

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const env = getEnv();
  const secret = env.SESSION_SECRET || "chatjoept-default-secret-salt-2026";

  let body: any;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const email = (body?.email || "").trim().toLowerCase();
  const code = (body?.code || "").trim();
  const challengeToken = (body?.challengeToken || "").trim();

  if (!email || !code || !challengeToken) {
    return Response.json(
      { error: "Email, verification code, and challenge token are required" },
      { status: 400 }
    );
  }

  const isValid = await verifyOtpChallenge(email, code, challengeToken, secret);

  if (!isValid) {
    return Response.json(
      { error: "Invalid or expired verification code. Please request a new one." },
      { status: 400 }
    );
  }

  // Issue 30-day session token
  const sessionToken = await createSessionToken(email, secret);
  const cookieHeader = serializeSessionCookie(sessionToken);

  return Response.json(
    {
      success: true,
      email,
      sessionToken,
    },
    {
      headers: {
        "Set-Cookie": cookieHeader,
      },
    }
  );
}
