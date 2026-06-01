"use client";

import { Plus, Trash2 } from "lucide-react";
import { useBusinessPlanStore } from "@/lib/store/useBusinessPlanStore";
import { QuestionCard } from "../QuestionCard";
import type { TeamMemberForm } from "@/types/business-plan";

const MEMBER_TYPES = [
  { value: "founder", label: "Fondateur/trice" },
  { value: "employee", label: "Salarié(e)" },
  { value: "freelance", label: "Freelance" },
] as const;

const SALARY_COEF: Record<TeamMemberForm["type"], number> = {
  founder: 1.45,
  employee: 1.82,
  freelance: 1.0,
};

const SALARY_LABEL: Record<TeamMemberForm["type"], string> = {
  founder: "TNS (×1.45 pour le coût employeur)",
  employee: "Salarié France (×1.82 pour le coût employeur)",
  freelance: "Freelance (coût = montant facturé)",
};

function newMember(type: TeamMemberForm["type"] = "founder"): TeamMemberForm {
  return {
    id: crypto.randomUUID(),
    role: "",
    type,
    count: 1,
    net_salary_monthly: null,
    is_current: true,
    is_paid: type !== "founder",
    start_date: new Date().toISOString().split("T")[0],
    source: "user_input",
  };
}

interface TeamStepProps {
  onNext: () => void;
  onBack: () => void;
}

export function TeamStep({ onNext, onBack }: TeamStepProps) {
  const { teamMembers, addTeamMember, updateTeamMember, removeTeamMember, markBlockComplete } =
    useBusinessPlanStore();

  function handleNext() {
    markBlockComplete(2);
    onNext();
  }

  const totalMonthlyPayroll = teamMembers.reduce((sum, m) => {
    if (!m.is_paid || !m.net_salary_monthly) return sum;
    return sum + m.net_salary_monthly * SALARY_COEF[m.type] * m.count;
  }, 0);

  return (
    <div className="space-y-5">
      <QuestionCard
        question="Qui compose ton équipe ?"
        hint="Ajoute chaque profil séparément. Inclus les fondateurs, même s'ils ne se paient pas encore."
      >
        <div className="space-y-4">
          {teamMembers.map((member) => (
            <div key={member.id} className="bg-bg rounded-xl p-4 border border-border space-y-3">
              <div className="flex items-center justify-between gap-3">
                <input
                  type="text"
                  value={member.role}
                  onChange={(e) => updateTeamMember(member.id, { role: e.target.value })}
                  placeholder="Rôle (ex : CEO, CTO, Commercial…)"
                  className="flex-1 px-3 py-2 rounded-lg font-sans text-sm text-fg bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-green/20 focus:border-green transition-all"
                />
                <button
                  onClick={() => removeTeamMember(member.id)}
                  className="p-2 text-muted hover:text-red transition-colors"
                >
                  <Trash2 size={15} />
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {MEMBER_TYPES.map((t) => (
                  <button
                    key={t.value}
                    onClick={() =>
                      updateTeamMember(member.id, {
                        type: t.value,
                        is_paid: t.value !== "founder",
                      })
                    }
                    className={`px-3 py-1.5 rounded-full text-xs font-sans font-medium border transition-all ${
                      member.type === t.value
                        ? "bg-green text-white border-green"
                        : "bg-surface text-muted border-border hover:border-green/40"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Count */}
                <div>
                  <p className="text-xs text-muted mb-1">Nombre de personnes</p>
                  <input
                    type="number"
                    value={member.count}
                    min={1}
                    onChange={(e) =>
                      updateTeamMember(member.id, { count: Math.max(1, Number(e.target.value)) })
                    }
                    className="w-full px-3 py-2 rounded-lg font-sans text-sm text-fg bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-green/20 focus:border-green transition-all"
                  />
                </div>

                {/* Salary */}
                <div>
                  <p className="text-xs text-muted mb-1">
                    {member.type === "founder" ? "Rémunération nette / mois" : "Salaire net / mois"}
                  </p>
                  {member.type === "founder" ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateTeamMember(member.id, { is_paid: false, net_salary_monthly: null })}
                        className={`px-2.5 py-1 rounded-full text-xs font-sans border transition-all ${
                          !member.is_paid
                            ? "bg-green text-white border-green"
                            : "bg-surface text-muted border-border"
                        }`}
                      >
                        Pas encore
                      </button>
                      <button
                        onClick={() => updateTeamMember(member.id, { is_paid: true })}
                        className={`px-2.5 py-1 rounded-full text-xs font-sans border transition-all ${
                          member.is_paid
                            ? "bg-green text-white border-green"
                            : "bg-surface text-muted border-border"
                        }`}
                      >
                        Oui
                      </button>
                    </div>
                  ) : null}
                  {member.is_paid && (
                    <div className="relative mt-1">
                      <input
                        type="number"
                        value={member.net_salary_monthly ?? ""}
                        onChange={(e) =>
                          updateTeamMember(member.id, {
                            net_salary_monthly: e.target.value ? Number(e.target.value) : null,
                          })
                        }
                        placeholder="0"
                        className="w-full pl-3 pr-7 py-2 rounded-lg font-sans text-sm text-fg bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-green/20 focus:border-green transition-all"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted">€</span>
                    </div>
                  )}
                  {member.is_paid && member.net_salary_monthly && (
                    <p className="text-[10px] text-muted mt-1">
                      Coût total ≈ {Math.round(member.net_salary_monthly * SALARY_COEF[member.type] * member.count).toLocaleString("fr-FR")} € — {SALARY_LABEL[member.type]}
                    </p>
                  )}
                </div>
              </div>

              {/* Future hire */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => updateTeamMember(member.id, { is_current: !member.is_current })}
                  className={`px-3 py-1 rounded-full text-xs font-sans font-medium border transition-all ${
                    member.is_current
                      ? "bg-green/10 text-green border-green/20"
                      : "bg-orange/10 text-orange border-orange/20"
                  }`}
                >
                  {member.is_current ? "✓ En poste" : "À recruter"}
                </button>
                {!member.is_current && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted">Arrivée prévue :</span>
                    <input
                      type="date"
                      value={member.start_date}
                      onChange={(e) => updateTeamMember(member.id, { start_date: e.target.value })}
                      className="px-2 py-1 rounded-lg text-xs font-sans text-fg bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-green/20"
                    />
                  </div>
                )}
              </div>
            </div>
          ))}

          <div className="flex gap-2">
            <button
              onClick={() => addTeamMember(newMember("founder"))}
              className="flex-1 py-2.5 rounded-xl border-2 border-dashed border-border text-xs font-sans text-muted hover:border-green/40 hover:text-green transition-all flex items-center justify-center gap-2"
            >
              <Plus size={14} /> Fondateur/trice
            </button>
            <button
              onClick={() => addTeamMember(newMember("employee"))}
              className="flex-1 py-2.5 rounded-xl border-2 border-dashed border-border text-xs font-sans text-muted hover:border-green/40 hover:text-green transition-all flex items-center justify-center gap-2"
            >
              <Plus size={14} /> Salarié(e)
            </button>
            <button
              onClick={() => addTeamMember(newMember("freelance"))}
              className="flex-1 py-2.5 rounded-xl border-2 border-dashed border-border text-xs font-sans text-muted hover:border-green/40 hover:text-green transition-all flex items-center justify-center gap-2"
            >
              <Plus size={14} /> Freelance
            </button>
          </div>
        </div>

        {teamMembers.length > 0 && totalMonthlyPayroll > 0 && (
          <div className="mt-4 p-3 bg-green/5 border border-green/15 rounded-xl">
            <p className="text-sm font-sans font-semibold text-green">
              Masse salariale totale : {Math.round(totalMonthlyPayroll).toLocaleString("fr-FR")} € / mois
            </p>
          </div>
        )}
      </QuestionCard>

      <div className="flex justify-between pt-2">
        <button
          onClick={onBack}
          className="px-5 py-2.5 rounded-full font-sans text-sm font-medium text-muted border border-border hover:border-fg hover:text-fg transition-all"
        >
          ← Retour
        </button>
        <button
          onClick={handleNext}
          className="px-6 py-3 rounded-full font-sans text-sm font-semibold text-white transition-all"
          style={{ background: "#1cb785" }}
        >
          Continuer →
        </button>
      </div>
    </div>
  );
}
