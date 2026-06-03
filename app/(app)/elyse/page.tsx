import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { BarChart3, TrendingUp, PiggyBank, ArrowRight } from "lucide-react";

export default async function ElysePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Vérifier si le user a des données financières (hub_metrics remplies)
  const { data: metrics } = await supabase
    .from("hub_metrics")
    .select("mrr")
    .eq("user_id", user.id)
    .single();

  const hasData = metrics?.mrr && metrics.mrr !== "—";

  // Si le user a des données → afficher le dashboard Elyse
  if (hasData) {
    return (
      <iframe
        src="/elyse-app/index.html"
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
          style={{ backgroundColor: "#1cb78515" }}
        >
          <img src="/Elyse.png" alt="Elyse" className="h-12 w-auto" />
        </div>

        <h1 className="font-serif text-3xl text-fg mb-3">Elyse</h1>
        <p className="font-sans text-sm text-muted mb-8 leading-relaxed">
          Votre copilot financier. Connectez vos sources de données pour
          visualiser votre trésorerie, runway, burn rate et projections
          financières en temps réel.
        </p>

        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="bg-surface rounded-xl p-4 border border-border">
            <BarChart3 size={20} className="mx-auto mb-2" style={{ color: "#1cb785" }} />
            <p className="font-sans text-xs text-muted">Business Plan</p>
          </div>
          <div className="bg-surface rounded-xl p-4 border border-border">
            <TrendingUp size={20} className="mx-auto mb-2" style={{ color: "#1cb785" }} />
            <p className="font-sans text-xs text-muted">Projections</p>
          </div>
          <div className="bg-surface rounded-xl p-4 border border-border">
            <PiggyBank size={20} className="mx-auto mb-2" style={{ color: "#1cb785" }} />
            <p className="font-sans text-xs text-muted">Financements</p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <a
            href="/elyse/business-plan"
            className="inline-flex items-center justify-center gap-2 font-sans text-sm font-medium px-6 py-3 rounded-xl transition-all"
            style={{ background: "#1cb785", color: "white" }}
          >
            Créer mon Business Plan
            <ArrowRight size={16} />
          </a>
          <a
            href="/integrations"
            className="inline-flex items-center justify-center gap-2 font-sans text-xs text-muted hover:text-fg transition-colors"
          >
            Ou connectez Notion pour importer vos données automatiquement
          </a>
        </div>
      </div>
    </div>
  );
}
