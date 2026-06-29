"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Loader2, CheckCircle2, AlertCircle, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

interface StatusResponse {
  connected: boolean;
  workspace_name?: string;
  workspace_icon?: string | null;
  notion_user_email?: string | null;
  notion_user_name?: string | null;
  connected_at?: string;
  last_synced_at?: string | null;
  pages_in_snapshot?: number;
  total_chars?: number;
}

function formatRelative(iso: string | null | undefined): string {
  if (!iso) return "jamais";
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `il y a ${h}h`;
  const d = Math.floor(h / 24);
  return `il y a ${d}j`;
}

interface Props {
  initialError?: string | null;
}

function normalizeError(error: string): string {
  try {
    const decoded = decodeURIComponent(error);
    if (decoded === "state_mismatch") {
      return "La session de connexion Notion a expiré ou le retour OAuth ne vient pas du même navigateur. Relance la connexion depuis Alpact.";
    }
    if (decoded === "missing_params") {
      return "Notion n'a pas renvoyé les paramètres de connexion attendus. Relance la connexion.";
    }
    if (decoded.includes("Configuration Notion")) {
      return "La configuration Notion locale est incomplète. Vérifie les variables NOTION_CLIENT_ID, NOTION_CLIENT_SECRET et NOTION_REDIRECT_URI.";
    }
    if (decoded.includes("Notion token exchange failed")) {
      return `${decoded} Vérifie surtout que l'URL de redirection Notion correspond exactement à celle de .env.local.`;
    }
    if (decoded.includes("authentifi")) {
      return "Ta session Alpact n'est plus active. Reconnecte-toi à Alpact, puis relance la connexion Notion.";
    }
    return decoded;
  } catch {
    return error;
  }
}

export function NotionIntegrationCard({ initialError }: Props) {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error] = useState<string | null>(initialError ?? null);

  useEffect(() => {
    fetch("/api/integrations/notion/status")
      .then((r) => r.json())
      .then((data) => setStatus(data))
      .catch(() => setStatus({ connected: false }))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-surface rounded-card shadow-card p-6">
      <div className="flex items-start gap-4">
        {/* Logo */}
        <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-white border-2 border-black overflow-hidden">
          {status?.workspace_icon && status.workspace_icon.startsWith("http") ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={status.workspace_icon} alt="" className="w-9 h-9 object-contain" />
          ) : status?.workspace_icon ? (
            <span className="text-2xl">{status.workspace_icon}</span>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src="/Notion.png" alt="Notion" className="w-7 h-7 object-contain" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="font-sans font-semibold text-sm text-fg">Notion</h3>
            {loading ? (
              <Badge variant="muted">Chargement…</Badge>
            ) : status?.connected ? (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-sans font-medium"
                style={{ background: "rgba(28,183,133,0.12)", color: "#1cb785" }}
              >
                <CheckCircle2 size={11} />
                Connecté
              </span>
            ) : (
              <Badge variant="muted">Non connecté</Badge>
            )}
          </div>

          {loading ? (
            <p className="font-sans text-xs text-muted leading-relaxed mb-4 flex items-center gap-2">
              <Loader2 size={12} className="animate-spin" />
              Vérification de l'état…
            </p>
          ) : status?.connected ? (
            <div className="mb-4">
              <p className="font-sans text-xs text-fg mb-1">
                Workspace : <span className="font-semibold">{status.workspace_name}</span>
              </p>
              <p className="font-sans text-xs text-muted">
                {status.pages_in_snapshot && status.pages_in_snapshot > 0
                  ? `${status.pages_in_snapshot} pages synchronisées · `
                  : "Aucune page synchronisée · "}
                Dernière sync : {formatRelative(status.last_synced_at)}
              </p>
            </div>
          ) : (
            <p className="font-sans text-xs text-muted leading-relaxed mb-4">
              Base opérationnelle — données stratégiques pour Astryd. Connectez votre workspace pour
              que vos outils comprennent votre contexte.
            </p>
          )}

          {error && (
            <div className="mb-3 flex items-start gap-2 p-2 rounded-lg bg-red/5 border border-red/20">
              <AlertCircle size={12} className="text-red flex-shrink-0 mt-0.5" />
              <p className="font-sans text-[11px] text-red leading-snug">
                Erreur Notion : {normalizeError(error)}
              </p>
            </div>
          )}

          <div className="flex items-center gap-2">
            {status?.connected ? (
              <Link
                href="/integrations/notion"
                className="px-3 py-1.5 rounded-full font-sans font-medium text-sm text-white bg-fg hover:opacity-90 transition-opacity inline-flex items-center gap-1.5"
              >
                Gérer les pages
                <ExternalLink size={12} />
              </Link>
            ) : (
              <a
                href="/api/integrations/notion/connect"
                className="px-3 py-1.5 rounded-full font-sans font-medium text-sm text-white bg-fg hover:opacity-90 transition-opacity"
              >
                Connecter Notion
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
