import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import hero from "@/assets/hero-beach.jpg";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/remake/Logo";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { homeForCurrentUser, safeRedirect } from "@/lib/remake/auth";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): { redirect?: string | undefined } => ({ redirect: safeRedirect(s["redirect"]) ?? undefined }),
  head: () => ({
    meta: [
      { title: "Log in — Remake" },
      { name: "description", content: "Log in to Remake to book pickups, run collection routes and manage Green Coins." },
      { property: "og:title", content: "Log in — Remake" },
      { property: "og:description", content: "Welcome back to Remake." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

const inputCls = "mt-1.5 h-12 w-full rounded-xl border bg-card px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

function AuthPage() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);

  const goHome = async () => {
    navigate({ to: redirect ?? (await homeForCurrentUser()), replace: true });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) { toast.error("Enter your email address"); return; }
    if (!pw) { toast.error("Enter your password"); return; }
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: pw });
    if (error) { setBusy(false); toast.error(error.message === "Invalid login credentials" ? "Wrong email or password" : error.message); return; }
    await goHome();
  };

  const google = async () => {
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) { toast.error("Google sign-in didn't work. Please try again."); return; }
    if (result.redirected) return;
    await goHome();
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <section className="relative hidden overflow-hidden lg:block">
        <img src={hero} alt="Gambian beach with plastic waste" className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-12 text-ink-foreground">
          <h2 className="font-display text-4xl font-semibold">Welcome back</h2>
          <p className="mt-2 max-w-md text-ink-muted">Every pickup you book keeps The Gambia a little cleaner.</p>
        </div>
      </section>
      <section className="flex flex-col px-6 py-8 md:px-16">
        <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground"><ArrowLeft className="size-4" /> Back</Link>
        <div className="mx-auto my-auto w-full max-w-md py-10">
          <Logo />
          <h1 className="mt-8 font-display text-3xl font-semibold">Log in to Remake</h1>
          <p className="mt-1 text-muted-foreground">Use the email and password you signed up with.</p>
          <form onSubmit={submit} className="mt-8 space-y-4">
            <label className="block text-sm font-medium">Email<input type="email" autoComplete="email" className={inputCls} placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
            <label className="block text-sm font-medium">Password<input type="password" autoComplete="current-password" className={inputCls} placeholder="Enter password" value={pw} onChange={(e) => setPw(e.target.value)} /></label>
            <Button type="submit" size="lg" className="w-full" disabled={busy}>{busy ? <Loader2 className="animate-spin" /> : null} Log in</Button>
          </form>
          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />or<span className="h-px flex-1 bg-border" /></div>
          <Button type="button" variant="outline" size="lg" className="w-full" onClick={google}>
            <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="size-[18px]"><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/></svg>
            Continue with Google
          </Button>
          <p className="mt-6 text-center text-sm text-muted-foreground">New to Remake? <Link to="/join" className="font-semibold text-primary">Create an account</Link></p>
        </div>
      </section>
    </div>
  );
}
