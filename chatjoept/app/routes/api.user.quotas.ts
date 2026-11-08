import type { LoaderFunctionArgs } from "react-router";
import { parseSessionCookie, verifySessionToken, getEnv } from "~/utils/auth.server";
import { getUserQuotas } from "~/utils/kv";

export async function loader({ request }: LoaderFunctionArgs) {
  const env = getEnv();
  const secret = env.SESSION_SECRET || "chatjoept-default-secret-salt-2026";
  const cookieHeader = request.headers.get("Cookie");
  const sessionToken = parseSessionCookie(cookieHeader);
  const session = await verifySessionToken(sessionToken, secret);

  if (!session?.email) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const quotas = await getUserQuotas(session.email, env);
  return Response.json({ quotas });
}
