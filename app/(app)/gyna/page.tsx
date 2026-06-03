import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Users, Target, MessageSquare, ArrowRight } from "lucide-react";

export default async function GynaPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Vérifier si le user a des données (hub_metrics remplies)
  const { data: metrics } = await supabase
    .from("hub_metrics")
    .select("mrr")
    .eq("user_id", user.id)
    .single();

  const hasData = metrics?.mrr && metrics.mrr !== "—";

  // Si le user a des données → afficher le dashboard Gyna
  if (hasData) {
    return (
      <iframe
        src="/gyna-app/index.html"
        className="w-full border-none"
        style={{ height: "calc(100vh - 0px)" }}
        allow="same-origin"
      />
    );
  }

  // Sinon → état vide avec CTA
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-8">
      <div className="max-w-lg text-center">
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6"
          style={{ backgroundColor: "#9d89fc15" }}
        >
          <img src="/gyna.png" alt="Gyna" className="h-12 w-auto" />
        </div>

        <h1 className="font-serif text-3xl text-fg mb-3">Gyna</h1>
        <p className="font-sans text-sm text-muted mb-8 leading-relaxed">
          Votre copilot Go-to-Market. Connectez vos sources de données pour
          suivre vos prospects, pipeline commercial, taux de conversion et
          stratégie d'acquisition.
        </p>

        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="bg-surface rounded-xl p-4 border border-border">
            <Users size={20} className="mx-auto mb-2" style={{ color: "#9d89fc" }} />
            <p className="font-sans text-xs text-muted">Pipeline</p>
          </div>
          <div className="bg-surface rounded-xl p-4 border border-border">
            <Target size={20} className="mx-auto mb-2" style={{ color: "#9d89fc" }} />
            <p className="font-sans text-xs text-muted">Prospection</p>
          </div>
          <div className="bg-surface rounded-xl p-4 border border-border">
            <MessageSquare size={20} className="mx-auto mb-2" style={{ color: "#9d89fc" }} />
            <p className="font-sans text-xs text-muted">Outreach</p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <a
            href="/integrations"
            className="inline-flex items-center justify-center gap-2 font-sans text-sm font-medium px-6 py-3 rounded-xl transition-all"
            style={{ background: "#9d89fc", color: "white" }}
          >
            Connecter mes sources de données
            <ArrowRight size={16} />
          </a>
          <span className="font-sans text-xs text-muted">
            Notion, CRM, outils de prospection...
          </span>
        </div>
      </div>
    </div>
  );
}
