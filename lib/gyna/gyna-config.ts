export type Canal = {
  nom: string;
  tauxReponse: number | null;
};

export type GynaConfig = {
  produit: string;
  ciblePhrase: string;
  objectifs: {
    rdv: number | null;
    closings: number | null;
    echeance: string | null;
  };
  apprentissagesInitiaux: string;
  canaux: Canal[];
  relances: {
    nombre: number;
    delaiJours: number;
  };
};

export const CANAUX_DISPONIBLES = [
  "Appel direct",
  "Email",
  "LinkedIn",
  "Référence",
  "Réseaux",
  "Événements",
] as const;

export const emptyConfig: GynaConfig = {
  produit: "",
  ciblePhrase: "",
  objectifs: { rdv: null, closings: null, echeance: null },
  apprentissagesInitiaux: "",
  canaux: [],
  relances: { nombre: 2, delaiJours: 3 },
};