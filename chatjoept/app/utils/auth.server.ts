// Server-side authentication and verification utilities for ChatJoePT

const DEFAULT_SECRET = "chatjoept-joe-universe-secret-salt-2026";
export const DEFAULT_ALLOWED_DOMAINS = [
  "united-taylors.org",
  "sstx.org",
  "hamdenhall.org",
];

export function getEnv(): Record<string, any> {
  const g = globalThis as any;
  if (g.__CF_ENV__) {
    return g.__CF_ENV__;
  }
  if (g.process && g.process.env) {
    return g.process.env;
  }
  return {};
}

async function getCryptoKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    "raw",
    enc.encode(secret || DEFAULT_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

async function hmacSign(message: string, secret: string): Promise<string> {
  const key = await getCryptoKey(secret);
  const enc = new TextEncoder();
  const signature = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function isAllowedEmail(email: string, customConfig?: string): boolean {
  if (!email || typeof email !== "string") return false;
  const cleanEmail = email.trim().toLowerCase();
  const atIndex = cleanEmail.lastIndexOf("@");
  if (atIndex === -1 || atIndex === cleanEmail.length - 1) return false;

  const emailDomain = cleanEmail.slice(atIndex + 1);

  // Check custom allowed domains config if provided
  if (customConfig && customConfig.trim()) {
    const customList = customConfig
      .split(",")
      .map((d) => d.trim().toLowerCase().replace(/^@/, ""));
    if (customList.includes(emailDomain)) {
      return true;
    }
  }

  // Default allowed domains check
  return DEFAULT_ALLOWED_DOMAINS.includes(emailDomain);
}

export async function createOtpChallenge(
  email: string,
  secret: string
): Promise<{ code: string; challengeToken: string; expiresAt: number }> {
  const cleanEmail = email.trim().toLowerCase();
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  const payload = `${cleanEmail}:${code}:${expiresAt}`;
  const sig = await hmacSign(payload, secret);
  const challengeToken = `${cleanEmail}:${expiresAt}:${sig}`;

  return { code, challengeToken, expiresAt };
}

export async function verifyOtpChallenge(
  email: string,
  code: string,
  challengeToken: string,
  secret: string
): Promise<boolean> {
  if (!email || !code || !challengeToken) return false;
  const cleanEmail = email.trim().toLowerCase();
  const cleanCode = code.trim();

  const parts = challengeToken.split(":");
  if (parts.length !== 3) return false;

  const [cEmail, cExpiresAt, cSig] = parts;
  if (cEmail !== cleanEmail) return false;

  const exp = Number(cExpiresAt);
  if (Number.isNaN(exp) || Date.now() > exp) return false;

  const expectedPayload = `${cleanEmail}:${cleanCode}:${cExpiresAt}`;
  const expectedSig = await hmacSign(expectedPayload, secret);

  return expectedSig === cSig;
}

export async function createSessionToken(
  email: string,
  secret: string
): Promise<string> {
  const cleanEmail = email.trim().toLowerCase();
  const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days
  const payload = `${cleanEmail}:${expiresAt}`;
  const sig = await hmacSign(payload, secret);
  return `${payload}:${sig}`;
}

export async function verifySessionToken(
  token: string | null | undefined,
  secret: string
): Promise<{ email: string } | null> {
  if (!token) return null;
  const parts = token.split(":");
  if (parts.length !== 3) return null;

  const [email, expiresAt, sig] = parts;
  const exp = Number(expiresAt);
  if (Number.isNaN(exp) || Date.now() > exp) return null;

  const expectedPayload = `${email}:${expiresAt}`;
  const expectedSig = await hmacSign(expectedPayload, secret);
  if (expectedSig !== sig) return null;

  return { email };
}

export function parseSessionCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  const cookies = cookieHeader.split(";").map((c) => c.trim());
  for (const c of cookies) {
    if (c.startsWith("chatjoept_session=")) {
      return decodeURIComponent(c.substring("chatjoept_session=".length));
    }
  }
  return null;
}

export function serializeSessionCookie(
  token: string,
  maxAge = 30 * 24 * 60 * 60
): string {
  return `chatjoept_session=${encodeURIComponent(
    token
  )}; Path=/; Max-Age=${maxAge}; HttpOnly; SameSite=Lax; Secure`;
}

export function clearSessionCookie(): string {
  return `chatjoept_session=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax; Secure`;
}

export async function sendOtpEmail(options: {
  apiKey?: string;
  from?: string;
  to: string;
  code: string;
}): Promise<{ success: boolean; simulated?: boolean; error?: string }> {
  const {
    apiKey,
    from = "ChatJoePT <chatjoept-noreply@united-taylors.org>",
    to,
    code,
  } = options;

  if (!apiKey || apiKey.trim() === "") {
    // If no Resend key provided yet, log simulated code so local development can proceed smoothly
    console.warn(
      `[ChatJoePT Auth] RESEND_API_KEY is not configured. SIMULATED OTP CODE FOR ${to}: ${code}`
    );
    return { success: true, simulated: true };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey.trim()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: `Your ChatJoePT Verification Code: ${code}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #171717; color: #ececec; padding: 40px; border-radius: 12px; max-width: 520px; margin: 0 auto; border: 1px solid #333;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h1 style="color: #10a37f; margin: 0; font-size: 28px; font-weight: 700;">ChatJoePT</h1>
              <p style="color: #999; margin: 6px 0 0 0; font-size: 14px;">The Official Intelligence of the Joe Universe</p>
            </div>
            <div style="background-color: #212121; padding: 24px; border-radius: 8px; text-align: center; border: 1px solid #2f2f2f;">
              <p style="font-size: 16px; margin: 0 0 16px 0; color: #ddd;">Joello! Here is your one-time verification code to access ChatJoePT:</p>
              <div style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #10a37f; padding: 12px; background-color: #111; border-radius: 6px; display: inline-block; margin-bottom: 16px;">
                ${code}
              </div>
              <p style="font-size: 13px; color: #888; margin: 0;">This code will expire in 10 minutes. If you did not request this joemail, please disregard it.</p>
            </div>
            <div style="text-align: center; margin-top: 24px; font-size: 12px; color: #666;">
              <p style="margin: 0;">To Joe, or not to Joe, that is the question.</p>
              <p style="margin: 4px 0 0 0;">&copy; 2026 ChatJoePT &bull; United Taylors Joe Universe</p>
            </div>
          </div>
        `,
      }),
    });

    if (!res.ok) {
      const errJson = (await res.json().catch(() => ({}))) as Record<string, any>;
      const errMsg = errJson?.message || `Resend API failed with status ${res.status}`;
      console.error("[ChatJoePT Auth] Resend error:", errMsg);
      return { success: false, error: errMsg };
    }

    return { success: true };
  } catch (err: any) {
    console.error("[ChatJoePT Auth] Resend request exception:", err);
    return { success: false, error: err.message || "Failed to reach Resend API" };
  }
}
