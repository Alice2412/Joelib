import type { ActionFunctionArgs } from "react-router";
import { parseSessionCookie, verifySessionToken, getEnv } from "~/utils/auth.server";
import { createSharedDialog, saveUserDialog } from "~/utils/kv";
import type { ChatSession } from "~/types/chat";

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const env = getEnv();
  const secret = env.SESSION_SECRET || "chatjoept-default-secret-salt-2026";
  const cookieHeader = request.headers.get("Cookie");
  const sessionToken = parseSessionCookie(cookieHeader);
  const session = await verifySessionToken(sessionToken, secret);

  if (!session?.email) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const dialog: ChatSession = body?.dialog;
  if (!dialog || !dialog.messages || dialog.messages.length === 0) {
    return Response.json({ error: "Cannot share an empty dialog" }, { status: 400 });
  }

  const shareId = await createSharedDialog(dialog, env);
  const origin = new URL(request.url).origin;
  const shareUrl = `${origin}/share/${shareId}`;

  // Persist shareId association with user's dialog so future rounds automatically sync to it
  if (dialog.id) {
    dialog.shareId = shareId;
    await saveUserDialog(session.email, dialog, env).catch(console.error);
  }

  return Response.json({
    success: true,
    shareId,
    shareUrl,
  });
}
