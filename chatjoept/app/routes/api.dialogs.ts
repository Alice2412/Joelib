import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { parseSessionCookie, verifySessionToken, getEnv } from "~/utils/auth.server";
import {
  getAllUserDialogs,
  getUserDialog,
  saveUserDialog,
  deleteUserDialog,
  deleteAllUserData,
  getUserQuotas,
} from "~/utils/kv";
import type { ChatSession } from "~/types/chat";

// GET /api/dialogs -> list all dialogs & quotas
export async function loader({ request }: LoaderFunctionArgs) {
  const env = getEnv();
  const secret = env.SESSION_SECRET || "chatjoept-default-secret-salt-2026";
  const cookieHeader = request.headers.get("Cookie");
  const sessionToken = parseSessionCookie(cookieHeader);
  const session = await verifySessionToken(sessionToken, secret);
  const email = session?.email || null;

  if (!email) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [dialogs, quotas] = await Promise.all([
    getAllUserDialogs(email, env),
    getUserQuotas(email, env),
  ]);

  return Response.json({ dialogs, quotas });
}

// POST /api/dialogs (save dialog) or DELETE /api/dialogs (delete dialog)
export async function action({ request }: ActionFunctionArgs) {
  const env = getEnv();
  const secret = env.SESSION_SECRET || "chatjoept-default-secret-salt-2026";
  const cookieHeader = request.headers.get("Cookie");
  const sessionToken = parseSessionCookie(cookieHeader);
  const session = await verifySessionToken(sessionToken, secret);
  const email = session?.email || null;

  if (!email) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (request.method === "POST") {
    let body: any;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const dialog: ChatSession = body?.dialog;
    if (!dialog || !dialog.id) {
      return Response.json({ error: "Missing dialog payload" }, { status: 400 });
    }

    const saveResult = await saveUserDialog(email, dialog, env);
    if (!saveResult.success) {
      return Response.json({ error: saveResult.error }, { status: 400 });
    }

    const quotas = await getUserQuotas(email, env);
    return Response.json({ success: true, quotas });
  }

  if (request.method === "DELETE") {
    const url = new URL(request.url);
    const dialogId = url.searchParams.get("id");
    const deleteAll = url.searchParams.get("all") === "true";

    if (deleteAll) {
      await deleteAllUserData(email, env);
      const quotas = await getUserQuotas(email, env);
      return Response.json({ success: true, quotas });
    }

    if (!dialogId) {
      return Response.json({ error: "Missing dialog id" }, { status: 400 });
    }

    await deleteUserDialog(email, dialogId, env);
    const quotas = await getUserQuotas(email, env);
    return Response.json({ success: true, quotas });
  }

  return Response.json({ error: "Method not allowed" }, { status: 405 });
}
