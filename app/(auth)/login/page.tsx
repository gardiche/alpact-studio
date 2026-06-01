"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("Merci de renseigner email et mot de passe.");
      return;
    }
    setLoading(true);
    setError(null);

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password.trim(),
    });

    if (authError || !data.user) {
      setError("Email ou mot de passe incorrect.");
      setLoading(false);
      return;
    }

    // Récupérer le profil pour savoir si structure ou entrepreneur
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    const role = profile?.role ?? "entrepreneur";
    window.location.href = role === "structure" ? "/org" : "/hub";
  }

  async function handleDemo(role: "structure" | "entrepreneur") {
    setLoading(true);
    setError(null);
    const demoEmail =
      role === "structure"
        ? "demo.structure@alpact.studio"
        : "demo.entrepreneur@alpact.studio";

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: demoEmail,
      password: "alpact-demo",
    });

    if (authError || !data.user) {
      setError("Erreur lors de la connexion démo.");
      setLoading(false);
      return;
    }

    window.location.href = role === "structure" ? "/org" : "/hub";
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-5"
      style={{
        backgroundImage: "url('/background as.png')",
        backgroundSize: "cover",
        backgroundPosition: "center 20%",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="w-full max-w-sm text-center">
        {/* Logo */}
        <img
          src="/logo alpact studio.svg"
          alt="Alpact Studio"
          className="h-24 w-auto mx-auto mb-10"
        />

        {/* Titre */}
        <h1 className="font-serif text-3xl text-fg mb-2">Bienvenue</h1>
        <p className="font-sans text-sm text-muted mb-8">
          Votre espace de pilotage, tout en un.
        </p>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(null); }}
            disabled={loading}
            className="w-full px-4 py-3 rounded-xl font-sans text-sm text-fg bg-surface placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-blue/20 transition-all disabled:opacity-50"
            style={{ border: "1.5px solid #E4E0DB" }}
          />
          <input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(null); }}
            disabled={loading}
            className="w-full px-4 py-3 rounded-xl font-sans text-sm text-fg bg-surface placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-blue/20 transition-all disabled:opacity-50"
            style={{ border: "1.5px solid #E4E0DB" }}
          />

          {error && (
            <p className="font-sans text-xs text-left" style={{ color: "#ff4f3f" }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl font-sans text-sm font-semibold text-white transition-all disabled:opacity-50"
            style={{ background: "#111" }}
            onMouseEnter={(e) => !loading && (e.currentTarget.style.background = "#333")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#111")}
          >
            {loading ? "Connexion…" : "Se connecter →"}
          </button>
        </form>

        {/* Séparateur */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px" style={{ background: "#E4E0DB" }} />
          <span className="font-sans text-xs text-muted">ou tester la démo</span>
          <div className="flex-1 h-px" style={{ background: "#E4E0DB" }} />
        </div>

        {/* Boutons démo */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleDemo("entrepreneur")}
            disabled={loading}
            className="flex-1 py-3 rounded-xl font-sans text-xs font-medium text-fg transition-all disabled:opacity-50 hover:bg-surface/80"
            style={{ border: "1.5px solid #E4E0DB", background: "rgba(255,255,255,0.6)" }}
          >
            Démo entrepreneur
          </button>
          <button
            type="button"
            onClick={() => handleDemo("structure")}
            disabled={loading}
            className="flex-1 py-3 rounded-xl font-sans text-xs font-medium text-fg transition-all disabled:opacity-50 hover:bg-surface/80"
            style={{ border: "1.5px solid #E4E0DB", background: "rgba(255,255,255,0.6)" }}
          >
            Démo structure
          </button>
        </div>
      </div>
    </div>
  );
}
