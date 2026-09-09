"use client";

import { Check, ReceiptText, Sparkles } from "lucide-react";
import { startTransition, useEffect, useEffectEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/services/auth";

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (config: { client_id: string; callback: (response: { credential?: string }) => void }) => void;
          renderButton: (parent: HTMLElement, options: { theme: "outline"; size: "large"; text: "continue_with"; shape: "rectangular"; width?: number }) => void;
        };
      };
    };
  }
}

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function LoginPage() {
  const router = useRouter();
  const buttonRef = useRef<HTMLDivElement>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = useEffectEvent(async (response: { credential?: string }) => {
    if (!response.credential) {
      setErrorMessage("Google did not return a sign-in credential. Please try again.");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    try {
      const result = await fetch(`${API_URL}/api/v1/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: response.credential }),
      });
      const body = await result.json() as { access_token?: string; user?: { id: string; email: string; full_name: string }; detail?: string };
      if (!result.ok || !body.access_token || !body.user) {
        throw new Error(body.detail || "Google sign-in could not be completed.");
      }

      localStorage.setItem("access_token", body.access_token);
      await getCurrentUser();
      router.replace("/");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Google sign-in could not be completed.");
      setIsLoading(false);
    }
  });

  useEffect(() => {
    if (localStorage.getItem("access_token")) {
      router.replace("/");
      return;
    }

    if (!GOOGLE_CLIENT_ID) {
      return;
    }

    const renderGoogleButton = () => {
      const googleId = window.google?.accounts?.id;
      if (!googleId || !buttonRef.current) return;
      googleId.initialize({ client_id: GOOGLE_CLIENT_ID, callback: handleGoogleLogin });
      buttonRef.current.replaceChildren();
      googleId.renderButton(buttonRef.current, {
        theme: "outline",
        size: "large",
        text: "continue_with",
        shape: "rectangular",
        width: 320,
      });
    };

    const existingScript = document.querySelector("script[src='https://accounts.google.com/gsi/client']");
    if (existingScript) {
      renderGoogleButton();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = renderGoogleButton;
    script.onerror = () => startTransition(() => setErrorMessage("Google sign-in could not load. Check your connection and try again."));
    document.head.appendChild(script);
  }, [router]);

  return <main className="min-h-screen bg-[#f6f5f2] text-[#18212b]">
    <div className="mx-auto grid min-h-screen max-w-[1440px] lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden overflow-hidden bg-[#18212b] px-12 py-12 text-white lg:flex lg:flex-col lg:justify-between xl:px-20">
        <div className="relative z-10 flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-[11px] bg-[#f2532f]"><Sparkles size={17} /></div><span className="text-[18px] font-bold tracking-[-0.04em]">snap<span className="text-[#f2532f]">ai</span></span></div>
        <div className="relative z-10 max-w-[500px]"><p className="mb-4 text-[11px] font-bold uppercase tracking-[0.18em] text-[#ff9d86]">Expense clarity, without the busywork</p><h1 className="font-serif text-[clamp(3.5rem,6vw,6.5rem)] leading-[0.9] tracking-[-0.07em]">Receipts in.<br /><span className="text-[#ff9d86]">Clarity out.</span></h1><p className="mt-7 max-w-md text-[15px] leading-7 text-[#b8c0c5]">SnapAI turns everyday receipts into a calm, useful view of where your money is going.</p><div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-[12px] text-[#d4dcdf]"><span className="flex items-center gap-2"><Check size={15} className="text-[#ff9d86]" /> Automatic capture</span><span className="flex items-center gap-2"><Check size={15} className="text-[#ff9d86]" /> Smart categories</span></div></div>
        <div className="absolute -bottom-32 -right-24 h-[430px] w-[430px] rounded-full border-[52px] border-[#24323d]" />
      </section>
      <section className="flex items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-[420px]">
          <div className="mb-10 flex items-center gap-3 lg:hidden"><div className="flex h-9 w-9 items-center justify-center rounded-[11px] bg-[#18212b] text-white"><Sparkles size={17} /></div><span className="text-[18px] font-bold tracking-[-0.04em]">snap<span className="text-[#f2532f]">ai</span></span></div>
          <div className="mb-9"><div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff0e8] text-[#f2532f]"><ReceiptText size={22} /></div><p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#f2532f]">Welcome to SnapAI</p><h2 className="font-serif text-[clamp(2.5rem,7vw,4.1rem)] leading-[0.94] tracking-[-0.065em]">Your spending,<br />made simple.</h2><p className="mt-5 max-w-sm text-[14px] leading-6 text-[#777b7e]">Sign in to capture receipts, understand your habits, and keep your expenses in one clear place.</p></div>
          <div className="rounded-2xl border border-[#deded9] bg-white p-5 shadow-[0_18px_45px_rgba(24,33,43,0.06)] sm:p-7"><p className="mb-4 text-[13px] font-bold">Log in or create your account</p><div ref={buttonRef} className="flex min-h-[44px] justify-center overflow-hidden rounded-xl" />{isLoading && <p className="mt-4 text-center text-[12px] text-[#777b7e]">Signing you in...</p>}{(errorMessage || !GOOGLE_CLIENT_ID) && <p role="alert" className="mt-4 rounded-xl bg-[#fff0e8] px-3 py-2.5 text-[12px] leading-5 text-[#a64025]">{errorMessage || "Google sign-in is not configured yet."}</p>}<p className="mt-5 text-center text-[11px] leading-5 text-[#969997]">By continuing, you agree to use SnapAI for your own expense records.</p></div>
        </div>
      </section>
    </div>
  </main>;
}
