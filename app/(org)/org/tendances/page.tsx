import { CalendarPlus, Lightbulb, Users } from "lucide-react";
import { CohortTrendsList } from "@/components/org/impact/CohortTrendsList";
import {
  getActiveCohort,
  getCohortMemberDetails,
} from "@/lib/org/cohortRepository";
import { computeCohortTrends } from "@/lib/org/impactAnalytics";

export default async function TendancesPage() {
  const [cohort, details] = await Promise.all([
    getActiveCohort(),
    getCohortMemberDetails(),
  ]);

  const trends = computeCohortTrends(details, 8);

  return (
    <div className="min-h-screen bg-bg p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <p className="font-sans text-xs uppercase tracking-wide text-muted mb-1">
            Tendances cohorte
          </p>
          <h1
            className="font-serif text-4xl text-fg leading-tight"
            style={{ fontFamily: "DM Serif Display" }}
          >
            Ce qui revient le plus dans votre cohorte
          </h1>
          <p className="font-sans text-sm text-muted mt-2 max-w-2xl leading-relaxed">
            Détection automatique des tensions et chantiers partagés par plusieurs entrepreneurs.
            Utile pour adapter vos masterclasses, déclencher une session collective ou anticiper
            une intervention.
          </p>
        </div>

        {/* Liste principale */}
        <div className="mb-6">
          <CohortTrendsList trends={trends} />
        </div>

        {/* Bloc d'aide : comment utiliser ces signaux */}
        <section
          className="bg-surface rounded-[20px] p-6"
          style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
        >
          <h2
            className="font-serif text-lg text-fg mb-4"
            style={{ fontFamily: "DM Serif Display" }}
          >
            Comment utiliser ces signaux
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-border bg-bg/40">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                style={{ background: "rgba(45,91,227,0.12)" }}
              >
                <CalendarPlus size={16} style={{ color: "#2D5BE3" }} />
              </div>
              <p className="font-sans text-sm font-semibold text-fg mb-1">
                Programmer une masterclass
              </p>
              <p className="font-sans text-xs text-muted leading-relaxed">
                Quand 3+ entrepreneurs partagent une tension, c'est le bon moment pour
                organiser un atelier collectif.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-border bg-bg/40">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                style={{ background: "rgba(28,183,133,0.12)" }}
              >
                <Users size={16} style={{ color: "#1cb785" }} />
              </div>
              <p className="font-sans text-sm font-semibold text-fg mb-1">
                Mettre en relation
              </p>
              <p className="font-sans text-xs text-muted leading-relaxed">
                Plusieurs entrepreneurs sur le même chantier ? Connectez-les pour qu'ils
                partagent leurs patterns.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-border bg-bg/40">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                style={{ background: "rgba(255,143,39,0.12)" }}
              >
                <Lightbulb size={16} style={{ color: "#ff8f27" }} />
              </div>
              <p className="font-sans text-sm font-semibold text-fg mb-1">
                Inviter un intervenant
              </p>
              <p className="font-sans text-xs text-muted leading-relaxed">
                Un sujet revient trop souvent ? Faites venir un expert externe pour
                débloquer la cohorte en une session.
              </p>
            </div>
          </div>

          <p className="font-sans text-[11px] text-muted mt-4">
            Données calculées sur la cohorte {cohort.name}. Plus la cohorte est active sur
            Alpact, plus ces signaux deviennent précis.
          </p>
        </section>
      </div>
    </div>
  );
}
