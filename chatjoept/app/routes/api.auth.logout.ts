import type { ActionFunctionArgs } from "react-router";
import { clearSessionCookie } from "~/utils/auth.server";

export async function action({ request }: ActionFunctionArgs) {
  return Response.json(
    { success: true },
    {
      headers: {
        "Set-Cookie": clearSessionCookie(),
      },
    }
  );
}

export async function loader() {
  return Response.json(
    { success: true },
    {
      headers: {
        "Set-Cookie": clearSessionCookie(),
      },
    }
  );
}
