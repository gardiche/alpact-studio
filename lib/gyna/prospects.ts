export const STATUSES = [
  "À qualifier",
  "Qualifié",
  "En séquence",
  "RDV pris",
  "Closing",
  "Perdu",
  "Exclu",
] as const;
export type Status = (typeof STATUSES)[number];

export const FINAL_STATUSES: Status[] = ["RDV pris", "Closing", "Perdu", "Exclu"];
export const POSITIVE_STATUSES: Status[] = ["RDV pris", "Closing"];
export const NEGATIVE_STATUSES: Status[] = ["Perdu", "Exclu"];

export const SOURCES = [
  "Référence",
  "Appel à froid",
  "Email à froid",
  "LinkedIn",
  "Événement",
  "Autre",
] as const;
export type Source = (typeof SOURCES)[number];

export const TAILLES = ["1-10", "11-50", "51-200", "200+"] as const;
export type Taille = (typeof TAILLES)[number];

/** Universal "power / decision-maker" keywords (lowercased, accent-free). */
const POWER_KEYWORDS = [
  "directeur",
  "directrice",
  "fondateur",
  "fondatrice",
  "responsable",
  "décide",
  "decide",
  "budget",
  "ceo",
  "cto",
  "head",
  "chief",
];

export type ScoreFactor = {
  label: string;
  points: number;
  /** positive contribution (true) vs negative (false) */
  positive: boolean;
};

export type ScoreDetail = {
  phase: 1 | 2;
  total: number;
  factors: ScoreFactor[];
};

export type StatusEvent = {
  status: Status;
  at: string; // ISO
  reason?: string;
};

export type Note = {
  at: string;
  text: string;
};

export type Prospect = {
  id: string;
  createdAt: string;
  updatedAt: string;
  prenom: string;
  nom: string;
  entreprise: string;
  role: string;
  email?: string;
  telephone?: string;
  secteur: string;
  taille: Taille;
  source: Source;
  recommandePar?: string;
  contexte: string; // free enrichment text
  status: Status;
  history: StatusEvent[];
  notes: Note[];
  scoreDetail: ScoreDetail;
  /** Suggested channel based on learning + source */
  canalRecommande: string;
};

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

function containsAny(text: string, words: string[]) {
  const t = norm(text);
  return words.some((w) => t.includes(norm(w)));
}

function matchedKeywords(text: string, words: string[]): string[] {
  const t = norm(text);
  return Array.from(new Set(words.filter((w) => t.includes(norm(w)))));
}

/* ------------------------------------------------------------------ */
/* PHASE 1 — universal scoring                                         */
/* ------------------------------------------------------------------ */

function phase1Factors(p: Omit<Prospect, "scoreDetail" | "id" | "createdAt" | "updatedAt" | "status" | "history" | "notes" | "canalRecommande">): ScoreFactor[] {
  const factors: ScoreFactor[] = [
    { label: "Score de base", points: 30, positive: true },
  ];

  if (p.source === "Référence") {
    factors.push({ label: "Source : référence", points: 15, positive: true });
  }

  const haystack = `${p.role} ${p.contexte}`;
  const matched = matchedKeywords(haystack, POWER_KEYWORDS);
  if (matched.length > 0) {
    factors.push({
      label: `Signal de décision (${matched.slice(0, 2).join(", ")})`,
      points: 10,
      positive: true,
    });
  }

  if (p.taille === "11-50" || p.taille === "51-200") {
    factors.push({
      label: `Taille d'entreprise cohérente (${p.taille})`,
      points: 10,
      positive: true,
    });
  }

  if ((p.email ?? "").trim() && (p.telephone ?? "").trim()) {
    factors.push({
      label: "Contact complet (email + téléphone)",
      points: 5,
      positive: true,
    });
  }

  return factors;
}

/* ------------------------------------------------------------------ */
/* PHASE 2 — learned patterns                                          */
/* ------------------------------------------------------------------ */

type Rate = { positives: number; negatives: number; total: number; rate: number };

function bucketRates<K extends string>(
  prospects: Prospect[],
  pick: (p: Prospect) => K,
): Map<K, Rate> {
  const m = new Map<K, Rate>();
  for (const p of prospects) {
    if (!FINAL_STATUSES.includes(p.status)) continue;
    const key = pick(p);
    const pos = POSITIVE_STATUSES.includes(p.status) ? 1 : 0;
    const neg = NEGATIVE_STATUSES.includes(p.status) ? 1 : 0;
    const cur = m.get(key) ?? { positives: 0, negatives: 0, total: 0, rate: 0 };
    cur.positives += pos;
    cur.negatives += neg;
    cur.total += 1;
    cur.rate = cur.positives / cur.total;
    m.set(key, cur);
  }
  return m;
}

function globalPositiveRate(prospects: Prospect[]): number {
  const finals = prospects.filter((p) => FINAL_STATUSES.includes(p.status));
  if (finals.length === 0) return 0.5;
  const pos = finals.filter((p) => POSITIVE_STATUSES.includes(p.status)).length;
  return pos / finals.length;
}

export type LearnedInsight = {
  field: "source" | "taille" | "keyword";
  value: string;
  rate: number; // 0..1
  baseline: number;
  total: number;
  positives: number;
};

/** All learned insights with at least 2 data points and a meaningful lift. */
export function learnedInsights(prospects: Prospect[]): LearnedInsight[] {
  const finals = prospects.filter((p) => FINAL_STATUSES.includes(p.status));
  if (finals.length < 5) return [];
  const baseline = globalPositiveRate(prospects);
  const out: LearnedInsight[] = [];

  const bySource = bucketRates(prospects, (p) => p.source);
  Array.from(bySource.entries()).forEach(([value, r]) => {
    if (r.total < 2) return;
    if (Math.abs(r.rate - baseline) < 0.1) return;
    out.push({ field: "source", value, rate: r.rate, baseline, total: r.total, positives: r.positives });
  });

  const byTaille = bucketRates(prospects, (p) => p.taille);
  Array.from(byTaille.entries()).forEach(([value, r]) => {
    if (r.total < 2) return;
    if (Math.abs(r.rate - baseline) < 0.1) return;
    out.push({ field: "taille", value, rate: r.rate, baseline, total: r.total, positives: r.positives });
  });

  // Keyword lift
  for (const kw of POWER_KEYWORDS) {
    let tot = 0, pos = 0;
    for (const p of finals) {
      if (containsAny(`${p.role} ${p.contexte}`, [kw])) {
        tot += 1;
        if (POSITIVE_STATUSES.includes(p.status)) pos += 1;
      }
    }
    if (tot < 2) continue;
    const rate = pos / tot;
    if (Math.abs(rate - baseline) < 0.15) continue;
    out.push({ field: "keyword", value: kw, rate, baseline, total: tot, positives: pos });
  }

  // Strongest signals first
  return out.sort((a, b) => Math.abs(b.rate - b.baseline) - Math.abs(a.rate - a.baseline));
}

function phase2Factors(
  draft: Pick<Prospect, "source" | "taille" | "role" | "contexte">,
  prospects: Prospect[],
): ScoreFactor[] {
  const insights = learnedInsights(prospects);
  const factors: ScoreFactor[] = [];
  for (const i of insights) {
    const lift = i.rate - i.baseline; // -1..1
    const points = Math.round(lift * 30); // up to ±30
    if (points === 0) continue;
    const matchesDraft =
      (i.field === "source" && draft.source === i.value) ||
      (i.field === "taille" && draft.taille === i.value) ||
      (i.field === "keyword" &&
        containsAny(`${draft.role} ${draft.contexte}`, [i.value]));
    if (!matchesDraft) continue;
    const label =
      i.field === "keyword"
        ? `Mot-clé appris : "${i.value}" (${Math.round(i.rate * 100)}% de conversion observée)`
        : i.field === "source"
        ? `Source apprise : ${i.value} (${Math.round(i.rate * 100)}% de conversion observée)`
        : `Taille apprise : ${i.value} (${Math.round(i.rate * 100)}% de conversion observée)`;
    factors.push({ label, points, positive: points > 0 });
  }
  return factors;
}

/* ------------------------------------------------------------------ */
/* Exclusion learning                                                  */
/* ------------------------------------------------------------------ */

const STOPWORDS = new Set([
  "le", "la", "les", "un", "une", "des", "de", "du", "et", "ou", "a", "à", "au",
  "aux", "ce", "cet", "cette", "ces", "il", "elle", "ils", "elles", "on", "que",
  "qui", "quoi", "pour", "par", "avec", "sans", "dans", "sur", "sous", "en",
  "est", "sont", "été", "ete", "pas", "ne", "plus", "moins", "trop", "très",
  "tres", "mais", "si", "se", "ses", "son", "sa", "nous", "vous", "leur", "leurs",
  "trop", "vraiment", "juste", "donc", "alors", "comme", "encore",
]);

/** Extract candidate keywords from a free-text "why excluded" reason. */
export function extractExclusionWords(text: string): string[] {
  const cleaned = norm(text).replace(/[^a-z0-9\s-]/g, " ");
  const tokens = cleaned.split(/\s+/).filter(Boolean);
  const out = new Set<string>();
  for (const t of tokens) {
    if (t.length < 4) continue;
    if (STOPWORDS.has(t)) continue;
    out.add(t);
  }
  return Array.from(out).slice(0, 6);
}

/* ------------------------------------------------------------------ */
/* Public: score a draft prospect                                      */
/* ------------------------------------------------------------------ */

export type ScoreInput = {
  source: Source;
  taille: Taille;
  role: string;
  contexte: string;
  email?: string;
  telephone?: string;
};

export function scoreProspect(
  draft: ScoreInput,
  prospects: Prospect[],
  motsExclusAppris: string[],
): { detail: ScoreDetail; excluded: boolean } {
  const finalsCount = prospects.filter((p) => FINAL_STATUSES.includes(p.status)).length;
  const phase: 1 | 2 = finalsCount >= 5 ? 2 : 1;

  const factors = phase1Factors({
    prenom: "", nom: "", entreprise: "", secteur: "",
    source: draft.source, taille: draft.taille,
    role: draft.role, contexte: draft.contexte,
    email: draft.email, telephone: draft.telephone,
    recommandePar: undefined,
  });

  if (phase === 2) {
    factors.push(...phase2Factors(draft, prospects));
  }

  // Exclusion penalty
  let excluded = false;
  const learnedMatch = matchedKeywords(
    `${draft.role} ${draft.contexte}`,
    motsExclusAppris,
  );
  if (learnedMatch.length > 0) {
    factors.push({
      label: `Mots associés à des exclusions passées (${learnedMatch.slice(0, 2).join(", ")})`,
      points: -40,
      positive: false,
    });
    excluded = true;
  }

  let total = factors.reduce((s, f) => s + f.points, 0);
  // Phase 1 capped at 60 to signal uncertainty
  const cap = phase === 1 ? 60 : 100;
  total = Math.max(0, Math.min(cap, total));

  return { detail: { phase, total, factors }, excluded };
}

/** Recommend a channel given the source + learned source rates. */
export function recommendCanal(source: Source, prospects: Prospect[]): string {
  type BestCanal = { source: Source; rate: number; total: number };
  const rates = bucketRates(prospects, (p) => p.source);
  let best: BestCanal | null = null;
  const rateEntries = Array.from(rates.entries());
  for (let i = 0; i < rateEntries.length; i++) {
    const [k, v] = rateEntries[i];
    if (v.total < 2) continue;
    if (!best || v.rate > best.rate) best = { source: k as Source, rate: v.rate, total: v.total };
  }
  if (best != null) {
    const b: BestCanal = best;
    if (b.rate > 0.5) {
      return b.source === source
        ? `${source} (canal historiquement fort)`
        : `${b.source} (vu meilleur — ${Math.round(b.rate * 100)}% conv.)`;
    }
  }
  return source;
}

/* ------------------------------------------------------------------ */
/* Demo data                                                           */
/* ------------------------------------------------------------------ */

const now = () => new Date().toISOString();
const daysAgo = (n: number) =>
  new Date(Date.now() - n * 86400 * 1000).toISOString();

function rawProspect(p: Omit<Prospect, "scoreDetail" | "canalRecommande" | "history" | "notes" | "createdAt" | "updatedAt"> & {
  createdDaysAgo: number;
  updatedDaysAgo: number;
  notes?: Note[];
  history?: StatusEvent[];
}): Prospect {
  const { createdDaysAgo, updatedDaysAgo, notes, history, ...rest } = p;
  return {
    ...rest,
    createdAt: daysAgo(createdDaysAgo),
    updatedAt: daysAgo(updatedDaysAgo),
    notes: notes ?? [],
    history: history ?? [{ status: rest.status, at: daysAgo(updatedDaysAgo) }],
    scoreDetail: { phase: 1, total: 0, factors: [] },
    canalRecommande: rest.source,
  };
}

export function buildDemoProspects(): Prospect[] {
  const seed: Prospect[] = [
    rawProspect({
      id: "p1",
      prenom: "Marie", nom: "Lefèvre",
      entreprise: "Acme Coaching", role: "Directrice partenariats",
      email: "marie@acme-coaching.fr", telephone: "+33 6 12 34 56 78",
      secteur: "Accompagnement entrepreneurs", taille: "51-200",
      source: "Référence", recommandePar: "Paul Durand",
      contexte:
        "Rencontrée via Paul. Cherche à structurer la prospection de leur réseau d'accompagnateurs. Décide seule sur les outils en-dessous de 500€/mois. A déjà testé deux outils concurrents.",
      status: "RDV pris",
      createdDaysAgo: 18, updatedDaysAgo: 4,
      notes: [{ at: daysAgo(4), text: "RDV calé le 12 — apporter la démo orientée partenaires." }],
    }),
    rawProspect({
      id: "p2",
      prenom: "Thomas", nom: "Martin",
      entreprise: "Studio Mauve", role: "Fondateur",
      email: "thomas@studiomauve.co",
      secteur: "Studio créatif", taille: "1-10",
      source: "LinkedIn",
      contexte: "Approché à froid sur LinkedIn après un post sur la prospection. Petite structure, équipe de 4, budget probablement très contraint.",
      status: "Perdu",
      createdDaysAgo: 22, updatedDaysAgo: 6,
      notes: [{ at: daysAgo(6), text: "Pas le bon timing — on se reparle dans 6 mois." }],
    }),
    rawProspect({
      id: "p3",
      prenom: "Sophie", nom: "Bernard",
      entreprise: "Growth Lab", role: "Responsable acquisition",
      email: "sophie.b@growthlab.io", telephone: "+33 6 88 22 11 09",
      secteur: "Conseil growth", taille: "51-200",
      source: "Référence", recommandePar: "Julie Petit",
      contexte: "Recommandée par Julie. Cherche un copilote pour son équipe de 3 SDR. Budget validé par son directeur général.",
      status: "Closing",
      createdDaysAgo: 30, updatedDaysAgo: 2,
      notes: [{ at: daysAgo(2), text: "Proposition envoyée — signature attendue cette semaine." }],
    }),
    rawProspect({
      id: "p4",
      prenom: "Jérôme", nom: "Calvet",
      entreprise: "Tech Bureau", role: "Stagiaire marketing",
      email: "j.calvet@techbureau.fr",
      secteur: "Édition logicielle", taille: "11-50",
      source: "Email à froid",
      contexte: "A répondu à une séquence email mais c'est un stagiaire. Pas décisionnaire, pas de budget, redirige vers son maître de stage qui ne répond pas.",
      status: "Exclu",
      createdDaysAgo: 14, updatedDaysAgo: 9,
      notes: [
        { at: daysAgo(9), text: "Stagiaire — pas de pouvoir d'achat." },
      ],
      history: [
        { status: "À qualifier", at: daysAgo(14) },
        { status: "Exclu", at: daysAgo(9), reason: "Stagiaire sans budget ni pouvoir d'achat — typiquement le profil à éviter chez nous." },
      ],
    }),
    rawProspect({
      id: "p5",
      prenom: "Léa", nom: "Moreau",
      entreprise: "Studio Pivot", role: "Directrice générale",
      email: "lea@studiopivot.com", telephone: "+33 6 45 78 12 03",
      secteur: "Accompagnement freelances", taille: "11-50",
      source: "Référence", recommandePar: "Marc Chevalier",
      contexte: "Marc a fait l'intro. Lea décide en direct, elle cherche à rajouter un copilote IA pour son équipe d'accompagnateurs. Budget non communiqué mais a déjà investi sur d'autres outils.",
      status: "RDV pris",
      createdDaysAgo: 10, updatedDaysAgo: 3,
    }),
    rawProspect({
      id: "p6",
      prenom: "Vincent", nom: "Roy",
      entreprise: "Mega Corp Industries", role: "Chef de projet",
      email: "v.roy@megacorp.com",
      secteur: "Industrie", taille: "200+",
      source: "Appel à froid",
      contexte: "Contact intéressé mais doit valider avec trois niveaux hiérarchiques. Cycle de décision probablement très long.",
      status: "Qualifié",
      createdDaysAgo: 5, updatedDaysAgo: 5,
    }),
    rawProspect({
      id: "p7",
      prenom: "Camille", nom: "Renault",
      entreprise: "Hark & Co", role: "Directrice marketing",
      email: "camille@harkco.fr", telephone: "+33 6 77 88 11 22",
      secteur: "Conseil B2B", taille: "11-50",
      source: "LinkedIn",
      contexte: "A liké plusieurs posts puis répondu à une connexion. Décide sur les outils marketing, budget annuel défini.",
      status: "En séquence",
      createdDaysAgo: 12, updatedDaysAgo: 7,
    }),
    rawProspect({
      id: "p8",
      prenom: "Hugo", nom: "Lambert",
      entreprise: "Atelier Nord", role: "Fondateur",
      email: "hugo@atelier-nord.fr", telephone: "+33 6 22 44 66 88",
      secteur: "Studio produit", taille: "11-50",
      source: "Référence", recommandePar: "Marie Lefèvre",
      contexte: "Intro faite par Marie. Cherche un copilote pour structurer leur prospection inbound + outbound. Réunion d'équipe lundi.",
      status: "Qualifié",
      createdDaysAgo: 4, updatedDaysAgo: 4,
    }),
    rawProspect({
      id: "p9",
      prenom: "Nadia", nom: "Berthelot",
      entreprise: "Pivot Studio", role: "Head of growth",
      email: "nadia@pivot.studio",
      secteur: "Agence digitale", taille: "11-50",
      source: "LinkedIn",
      contexte: "Réponse à une approche froide LinkedIn. Décisionnaire, cherche à accélérer son acquisition outbound. Budget confirmé.",
      status: "RDV pris",
      createdDaysAgo: 24, updatedDaysAgo: 11,
    }),
  ];

  // Initial exclusion words from p4's reason
  const learnedExcl = extractExclusionWords(
    "Stagiaire sans budget ni pouvoir d'achat — typiquement le profil à éviter chez nous.",
  );

  // Compute scores using the same pipeline so the demo looks coherent.
  const scored: Prospect[] = [];
  for (const p of seed) {
    const { detail } = scoreProspect(
      {
        source: p.source, taille: p.taille, role: p.role,
        contexte: p.contexte, email: p.email, telephone: p.telephone,
      },
      scored,
      learnedExcl,
    );
    scored.push({
      ...p,
      scoreDetail: detail,
      canalRecommande: recommendCanal(p.source, scored),
    });
  }

  return scored;
}

export function initialExclusionWords(): string[] {
  return extractExclusionWords(
    "Stagiaire sans budget ni pouvoir d'achat — typiquement le profil à éviter chez nous.",
  );
}

export function newId(): string {
  return `p${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export { now };
