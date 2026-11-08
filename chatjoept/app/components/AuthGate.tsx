import React, { useState } from "react";
import { Sparkles, ArrowRight, Mail, KeyRound, AlertCircle, CheckCircle2 } from "lucide-react";

interface AuthGateProps {
  onSuccess: (email: string) => void;
}

export function AuthGate({ onSuccess }: AuthGateProps) {
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [challengeToken, setChallengeToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail }),
      });

      const data = (await res.json().catch(() => ({}))) as any;

      if (!res.ok) {
        setError(data.error || "Failed to send verification email.");
        setLoading(false);
        return;
      }

      setChallengeToken(data.challengeToken);
      setStep("code");

      if (data.simulated && data.simulatedCode) {
        setInfo(
          `Demo/Dev mode (No RESEND_API_KEY detected): Your verification code is ${data.simulatedCode}`
        );
        setCode(data.simulatedCode);
      } else {
        setInfo(`A verification code was dispatched to ${cleanEmail}`);
      }
    } catch (err: any) {
      setError(err.message || "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const cleanCode = code.trim();

    if (!cleanCode) {
      setError("Please enter the 6-digit code.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          code: cleanCode,
          challengeToken,
        }),
      });

      const data = (await res.json().catch(() => ({}))) as any;

      if (!res.ok) {
        setError(data.error || "Verification failed.");
        setLoading(false);
        return;
      }

      onSuccess(email.trim().toLowerCase());
    } catch (err: any) {
      setError(err.message || "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#212121] flex flex-col items-center justify-center p-4">
      {/* Central Card */}
      <div className="w-full max-w-[420px] flex flex-col items-center text-center">
        {/* Emblem */}
        <div className="w-14 h-14 rounded-full bg-[#10a37f] flex items-center justify-center mb-6 shadow-lg shadow-[#10a37f]/20 ring-4 ring-white/5">
          <Sparkles className="w-7 h-7 text-white" />
        </div>

        <h1 className="text-2xl md:text-3xl font-semibold text-white tracking-tight mb-2">
          Welcome to ChatJoePT
        </h1>
        <p className="text-sm text-gray-400 mb-8 max-w-sm">
          The official conversational intelligence of the Joe Universe. Log in with your authorized email to continue.
        </p>

        {error && (
          <div className="w-full mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-left flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {info && (
          <div className="w-full mb-4 p-3 rounded-xl bg-[#10a37f]/10 border border-[#10a37f]/30 text-emerald-300 text-xs text-left flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{info}</span>
          </div>
        )}

        {step === "email" ? (
          <form onSubmit={handleSendCode} className="w-full space-y-4">
            <div className="relative text-left">
              <label
                htmlFor="email-input"
                className="block text-xs font-medium text-gray-300 mb-1.5"
              >
                Authorized Organization Email
              </label>
              <div className="relative">
                <input
                  id="email-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@united-taylors.org"
                  required
                  autoFocus
                  className="w-full bg-[#2f2f2f] text-white placeholder-gray-500 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#10a37f] focus:border-transparent transition-all"
                />
                <Mail className="absolute right-3.5 top-3.5 w-4 h-4 text-gray-400" />
              </div>
              <p className="text-[11px] text-gray-400 mt-1.5">
                Allowed domains: <code className="text-[#10a37f]">@united-taylors.org</code>, <code className="text-[#10a37f]">@sstx.org</code>, <code className="text-[#10a37f]">@hamdenhall.org</code>
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#10a37f] hover:bg-[#0e8c6d] disabled:opacity-50 text-white font-medium py-3 px-4 rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyCode} className="w-full space-y-4">
            <div className="relative text-left">
              <label
                htmlFor="code-input"
                className="block text-xs font-medium text-gray-300 mb-1.5"
              >
                Enter 6-Digit Verification Code
              </label>
              <div className="relative">
                <input
                  id="code-input"
                  type="text"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="123456"
                  required
                  autoFocus
                  className="w-full bg-[#2f2f2f] text-white tracking-[0.4em] font-mono text-center placeholder-gray-500 border border-white/10 rounded-xl px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-[#10a37f] focus:border-transparent transition-all"
                />
                <KeyRound className="absolute right-3.5 top-3.5 w-4 h-4 text-gray-400" />
              </div>
              <div className="flex justify-between items-center text-[11px] text-gray-400 mt-2">
                <span>Sent to: {email}</span>
                <button
                  type="button"
                  onClick={() => setStep("email")}
                  className="text-[#10a37f] hover:underline"
                >
                  Change email
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#10a37f] hover:bg-[#0e8c6d] disabled:opacity-50 text-white font-medium py-3 px-4 rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Verify and Enter</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        <div className="mt-8 text-center text-xs text-gray-500">
          <p>United Taylors &bull; Joe Universe Research Division</p>
          <p className="mt-1 text-[11px] text-gray-600">
            &ldquo;To Joe, or not to Joe, that is the question.&rdquo;
          </p>
        </div>
      </div>
    </div>
  );
}
