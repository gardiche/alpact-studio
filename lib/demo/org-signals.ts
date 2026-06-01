// Signaux faibles + sessions par entrepreneur — cohérents avec leur état actuel
import type {
  WeatherSignal,
  TensionSignal,
  ActionSignal,
  Session,
} from "@/types";

const now = Date.now();
const hours = (n: number) => 1000 * 60 * 60 * n;
const days = (n: number) => hours(24 * n);
const iso = (offsetMs: number) => new Date(now + offsetMs).toISOString();

interface MemberSignals {
  weather: WeatherSignal[];
  tensions: TensionSignal[];
  actions: ActionSignal[];
  next_session: Session | null;
  last_session: Session | null;
}

export const DEMO_SIGNALS: Record<string, MemberSignals> = {
  // Eva — Caudia · active, traction, dossier BPI en cours
  "cm-1": {
    weather: [
      { id: "w1-1", cohort_member_id: "cm-1", mood: "ensoleillé", note: "Premier client payant signé hier", created_at: iso(-days(2)) },
      { id: "w1-2", cohort_member_id: "cm-1", mood: "nuageux", note: "Stress sur le dossier BPI", created_at: iso(-days(6)) },
      { id: "w1-3", cohort_member_id: "cm-1", mood: "ensoleillé", note: null, created_at: iso(-days(11)) },
    ],
    tensions: [
      { id: "t1-1", cohort_member_id: "cm-1", kind: "produit", description: "Hésitation entre approfondir le module RH ou pousser sur la finance — risque de dispersion", resolved: false, created_at: iso(-days(4)) },
    ],
    actions: [
      { id: "a1-1", cohort_member_id: "cm-1", title: "Boucler le dossier BPI (annexes financières)", status: "en cours", due_at: iso(days(7)), created_at: iso(-days(10)) },
      { id: "a1-2", cohort_member_id: "cm-1", title: "Onboarding du premier client (3 sessions formation)", status: "à faire", due_at: iso(days(10)), created_at: iso(-days(3)) },
      { id: "a1-3", cohort_member_id: "cm-1", title: "Préparer pitch pour réseau Initiative", status: "fait", due_at: null, created_at: iso(-days(14)) },
    ],
    next_session: { id: "s1-1", cohort_member_id: "cm-1", scheduled_at: iso(days(3)), duration_min: 60, kind: "check-up", status: "à venir" },
    last_session: { id: "s1-2", cohort_member_id: "cm-1", scheduled_at: iso(-days(14)), duration_min: 60, kind: "check-up", status: "passée" },
  },

  // Jérôme — Faibrik · actif, cadrage ICP V2, tension co-fondateur
  "cm-2": {
    weather: [
      { id: "w2-1", cohort_member_id: "cm-2", mood: "nuageux", note: "Discussion difficile avec mon associé sur la cible", created_at: iso(-days(1)) },
      { id: "w2-2", cohort_member_id: "cm-2", mood: "brumeux", note: "Doute sur le pivot ICP", created_at: iso(-days(5)) },
      { id: "w2-3", cohort_member_id: "cm-2", mood: "nuageux", note: null, created_at: iso(-days(9)) },
    ],
    tensions: [
      { id: "t2-1", cohort_member_id: "cm-2", kind: "co-fondateur", description: "Désaccord sur la cible : son associé veut continuer le large, Jérôme veut resserrer sur les fabricants mécaniques", resolved: false, created_at: iso(-days(8)) },
      { id: "t2-2", cohort_member_id: "cm-2", kind: "produit", description: "Pression à livrer une démo personnalisée à chaque prospect — non scalable", resolved: false, created_at: iso(-days(3)) },
    ],
    actions: [
      { id: "a2-1", cohort_member_id: "cm-2", title: "Trancher l'ICP V2 avec l'associé (atelier 2h)", status: "à faire", due_at: iso(days(5)), created_at: iso(-days(7)) },
      { id: "a2-2", cohort_member_id: "cm-2", title: "Lancer 3 séquences outbound test", status: "en cours", due_at: iso(days(14)), created_at: iso(-days(10)) },
      { id: "a2-3", cohort_member_id: "cm-2", title: "Audit conversion landing", status: "fait", due_at: null, created_at: iso(-days(20)) },
    ],
    next_session: { id: "s2-1", cohort_member_id: "cm-2", scheduled_at: iso(days(2) + hours(4)), duration_min: 60, kind: "check-up", status: "à venir" },
    last_session: { id: "s2-2", cohort_member_id: "cm-2", scheduled_at: iso(-days(13)), duration_min: 60, kind: "check-up", status: "passée" },
  },

  // Elsa — Oteo Care · ALERTE, runway critique, désengagement
  "cm-3": {
    weather: [
      { id: "w3-1", cohort_member_id: "cm-3", mood: "orageux", note: "Refus du dernier investisseur. Démoralisée.", created_at: iso(-days(11)) },
      { id: "w3-2", cohort_member_id: "cm-3", mood: "orageux", note: "Doute total sur le canal d'acquisition", created_at: iso(-days(16)) },
      { id: "w3-3", cohort_member_id: "cm-3", mood: "brumeux", note: null, created_at: iso(-days(22)) },
    ],
    tensions: [
      { id: "t3-1", cohort_member_id: "cm-3", kind: "financière", description: "Runway 3,8 mois — pas de visibilité sur la prochaine entrée de cash", resolved: false, created_at: iso(-days(18)) },
      { id: "t3-2", cohort_member_id: "cm-3", kind: "personnelle", description: "Charge mentale élevée, isolement (co-fondateur à temps partiel)", resolved: false, created_at: iso(-days(11)) },
      { id: "t3-3", cohort_member_id: "cm-3", kind: "client", description: "Difficulté à trouver le bon canal — testé B2B mutuelles sans traction", resolved: false, created_at: iso(-days(25)) },
    ],
    actions: [
      { id: "a3-1", cohort_member_id: "cm-3", title: "Prendre RDV avec 5 mutuelles régionales", status: "abandonné", due_at: null, created_at: iso(-days(28)) },
      { id: "a3-2", cohort_member_id: "cm-3", title: "Préparer plan B canal B2C (acquisition directe aidants)", status: "à faire", due_at: iso(days(7)), created_at: iso(-days(10)) },
      { id: "a3-3", cohort_member_id: "cm-3", title: "Activer le dispositif French Tech Bridge", status: "à faire", due_at: iso(days(14)), created_at: iso(-days(5)) },
    ],
    next_session: { id: "s3-1", cohort_member_id: "cm-3", scheduled_at: iso(days(1) + hours(2)), duration_min: 90, kind: "deep-dive", status: "à venir" },
    last_session: { id: "s3-2", cohort_member_id: "cm-3", scheduled_at: iso(-days(28)), duration_min: 60, kind: "check-up", status: "passée" },
  },

  // Laura — Datalumni · scaling, recrutement réussi
  "cm-4": {
    weather: [
      { id: "w4-1", cohort_member_id: "cm-4", mood: "ensoleillé", note: "Nouvelle Head of Sales en place — excellent fit", created_at: iso(-days(1)) },
      { id: "w4-2", cohort_member_id: "cm-4", mood: "ensoleillé", note: null, created_at: iso(-days(7)) },
      { id: "w4-3", cohort_member_id: "cm-4", mood: "nuageux", note: "Fatigue post-closing recrutement", created_at: iso(-days(15)) },
    ],
    tensions: [
      { id: "t4-1", cohort_member_id: "cm-4", kind: "équipe", description: "Onboarding de la Head of Sales — risque de friction avec l'équipe historique", resolved: false, created_at: iso(-days(5)) },
    ],
    actions: [
      { id: "a4-1", cohort_member_id: "cm-4", title: "Roadmap 30/60/90 jours Head of Sales", status: "fait", due_at: null, created_at: iso(-days(8)) },
      { id: "a4-2", cohort_member_id: "cm-4", title: "Lancement officiel campagne outbound H2", status: "en cours", due_at: iso(days(4)), created_at: iso(-days(10)) },
      { id: "a4-3", cohort_member_id: "cm-4", title: "Préparer board meeting Q3", status: "à faire", due_at: iso(days(18)), created_at: iso(-days(3)) },
    ],
    next_session: { id: "s4-1", cohort_member_id: "cm-4", scheduled_at: iso(days(6)), duration_min: 60, kind: "check-up", status: "à venir" },
    last_session: { id: "s4-2", cohort_member_id: "cm-4", scheduled_at: iso(-days(13)), duration_min: 60, kind: "check-up", status: "passée" },
  },

  // Malik — Trasso · inactif, idéation
  "cm-5": {
    weather: [
      { id: "w5-1", cohort_member_id: "cm-5", mood: "brumeux", note: "Hésitation sur le pivot agro → pharma", created_at: iso(-days(6)) },
      { id: "w5-2", cohort_member_id: "cm-5", mood: "brumeux", note: null, created_at: iso(-days(20)) },
    ],
    tensions: [
      { id: "t5-1", cohort_member_id: "cm-5", kind: "produit", description: "Proposition de valeur encore floue — n'arrive pas à pitcher en 30 sec", resolved: false, created_at: iso(-days(15)) },
    ],
    actions: [
      { id: "a5-1", cohort_member_id: "cm-5", title: "Faire le BMC complet sur Astryd", status: "à faire", due_at: iso(days(7)), created_at: iso(-days(8)) },
      { id: "a5-2", cohort_member_id: "cm-5", title: "Réaliser 5 interviews clients agro", status: "en cours", due_at: iso(days(21)), created_at: iso(-days(20)) },
    ],
    next_session: { id: "s5-1", cohort_member_id: "cm-5", scheduled_at: iso(days(4)), duration_min: 60, kind: "check-up", status: "à venir" },
    last_session: { id: "s5-2", cohort_member_id: "cm-5", scheduled_at: iso(-days(21)), duration_min: 60, kind: "check-up", status: "passée" },
  },

  // Camille — Niveo · early-stage, levée seed en cours
  "cm-6": {
    weather: [
      { id: "w6-1", cohort_member_id: "cm-6", mood: "ensoleillé", note: "Très bon retour sur le pitch deck V3", created_at: iso(-days(2)) },
      { id: "w6-2", cohort_member_id: "cm-6", mood: "nuageux", note: "Stress du calendrier closing levée", created_at: iso(-days(9)) },
      { id: "w6-3", cohort_member_id: "cm-6", mood: "ensoleillé", note: null, created_at: iso(-days(16)) },
    ],
    tensions: [
      { id: "t6-1", cohort_member_id: "cm-6", kind: "financière", description: "Pression sur le calendrier — closing visé fin Q3, dépend de 2 lead VCs", resolved: false, created_at: iso(-days(7)) },
      { id: "t6-2", cohort_member_id: "cm-6", kind: "équipe", description: "Question : recruter senior eng avant ou après closing ?", resolved: false, created_at: iso(-days(4)) },
    ],
    actions: [
      { id: "a6-1", cohort_member_id: "cm-6", title: "Term sheet final avec lead VC", status: "en cours", due_at: iso(days(10)), created_at: iso(-days(12)) },
      { id: "a6-2", cohort_member_id: "cm-6", title: "Préparer data room complète", status: "fait", due_at: null, created_at: iso(-days(18)) },
      { id: "a6-3", cohort_member_id: "cm-6", title: "Sourcer 3 candidats senior eng", status: "à faire", due_at: iso(days(20)), created_at: iso(-days(4)) },
    ],
    next_session: { id: "s6-1", cohort_member_id: "cm-6", scheduled_at: iso(days(2)), duration_min: 60, kind: "check-up", status: "à venir" },
    last_session: { id: "s6-2", cohort_member_id: "cm-6", scheduled_at: iso(-days(12)), duration_min: 60, kind: "check-up", status: "passée" },
  },
};

export function getMemberSignals(memberId: string): MemberSignals {
  return (
    DEMO_SIGNALS[memberId] ?? {
      weather: [],
      tensions: [],
      actions: [],
      next_session: null,
      last_session: null,
    }
  );
}
