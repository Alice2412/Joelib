import type { ActionFunctionArgs } from "react-router";
import { isAllowedEmail, createOtpChallenge, sendOtpEmail, getEnv } from "~/utils/auth.server";

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const env = getEnv();
  const secret = env.SESSION_SECRET || "chatjoept-default-secret-salt-2026";
  const customDomains = env.ALLOWED_EMAIL_DOMAINS;
  const resendApiKey = env.RESEND_API_KEY;
  const fromEmail = env.RESEND_FROM_EMAIL || "ChatJoePT <chatjoept-noreply@united-taylors.org>";

  let body: any;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const email = (body?.email || "").trim().toLowerCase();

  if (!email) {
    return Response.json({ error: "Email is required" }, { status: 400 });
  }

  if (!isAllowedEmail(email, customDomains)) {
    return Response.json(
      {
        error:
          "Unauthorized domain. Only emails from @united-taylors.org, @sstx.org, or @hamdenhall.org are permitted to register.",
      },
      { status: 403 }
    );
  }

  // Create challenge with 6-digit code
  const { code, challengeToken } = await createOtpChallenge(email, secret);

  // Send email via Resend
  const emailResult = await sendOtpEmail({
    apiKey: resendApiKey,
    from: fromEmail,
    to: email,
    code,
  });

  if (!emailResult.success) {
    return Response.json(
      {
        error: `Could not send verification email: ${emailResult.error}`,
      },
      { status: 500 }
    );
  }

  return Response.json({
    success: true,
    challengeToken,
    simulated: emailResult.simulated,
    simulatedCode: emailResult.simulated ? code : undefined,
    message: emailResult.simulated
      ? `Simulated OTP code generated (RESEND_API_KEY is not set). Code: ${code}`
      : `Verification code sent to ${email}`,
  });
}
