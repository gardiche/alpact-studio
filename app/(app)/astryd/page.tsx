"use client";

import { useEffect, useState } from "react";
import { Zap, Loader2, AlertCircle, ExternalLink } from "lucide-react";

const ASTRYD_BASE_URL = (process.env.NEXT_PUBLIC_ASTRYD_URL || "http://localhost:8080").replace(/\/+$/, "");

export default function AstrydPage() {
  const [ssoUrl, setSsoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getSSOToken() {
      try {
        const res = await fetch("/api/astryd/sso-token", { method: "POST" });
        const data = await res.json();

        if (!res.ok || data.error) {
          // Si pas de SSO configuré, afficher quand même Astryd sans SSO
          if (data.error === "ASTRYD_SSO_SECRET manquant ou trop court (min 32 chars)") {
            setSsoUrl(`${ASTRYD_BASE_URL}/auth`);
          } else {
            setError(data.error || "Erreur de connexion");
          }
          setLoading(false);
          return;
        }

        // Construire l'URL avec le token SSO
        setSsoUrl(`${ASTRYD_BASE_URL}/sso?token=${data.token}`);
        setLoading(false);
      } catch {
        setError("Impossible de se connecter à Astryd");
        setLoading(false);
      }
    }

    getSSOToken();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <Loader2
            size={32}
            className="animate-spin mx-auto mb-4"
            style={{ color: "#ff8f27" }}
          />
          <p className="font-sans text-sm text-muted">Connexion à Astryd...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: "#ff4f3f18" }}
          >
            <AlertCircle size={32} style={{ color: "#ff4f3f" }} />
          </div>
          <h2 className="font-serif text-2xl text-fg mb-2">
            Connexion impossible
          </h2>
          <p className="font-sans text-sm text-muted mb-4">{error}</p>
          <a
            href={ASTRYD_BASE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 font-sans text-sm font-medium px-4 py-2.5 rounded-xl transition-all"
            style={{
              background: "#ff8f27",
              color: "white",
            }}
          >
            Ouvrir Astryd
            <ExternalLink size={14} />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full" style={{ height: "calc(100vh)" }}>
      {/* Barre supérieure discrète */}
      <div
        className="h-10 flex items-center justify-between px-4 border-b border-border bg-surface"
      >
        <div className="flex items-center gap-2">
          <Zap size={16} style={{ color: "#ff8f27" }} />
          <span className="font-sans text-xs font-medium text-fg">Astryd</span>
          <span className="font-sans text-[10px] text-muted">
            Coach posture entrepreneuriale
          </span>
        </div>
        <a
          href={ASTRYD_BASE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 font-sans text-[11px] text-muted hover:text-fg transition-colors"
        >
          Ouvrir en plein écran
          <ExternalLink size={11} />
        </a>
      </div>

      {/* Iframe Astryd */}
      <iframe
        src={ssoUrl!}
        className="w-full border-none"
        style={{ height: "calc(100vh - 40px)" }}
        allow="clipboard-write"
        title="Astryd — Coach IA"
      />
    </div>
  );
}
